import { AnkiWord } from "../types";
import initSqlJs from 'sql.js';
import JSZip from 'jszip';

/**
 * Service for interacting with AnkiConnectAndroid or local .apkg files
 */
export class AnkiService {
  private sqlPromise: Promise<any> | null = null;

  private async getSql() {
    if (!this.sqlPromise) {
      this.sqlPromise = initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });
    }
    return this.sqlPromise;
  }

  private async request(url: string, action: string, params?: any): Promise<any> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, version: 6, params })
      });

      if (!response.ok) {
        throw new Error(`Błąd HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error && data.error !== "null") {
        throw new Error(data.error);
      }

      return data.result;
    } catch (e: any) {
      throw new Error(`[Anki ${action}] ${e.message}`);
    }
  }

  async checkConnection(url: string): Promise<boolean> {
    try {
      await this.request(url, 'version');
      return true;
    } catch (e: any) {
      throw new Error(`Błąd weryfikacji połączenia: ${e.message}`);
    }
  }

  async getDeckNames(url: string): Promise<string[]> {
    const result = await this.request(url, 'deckNames');
    return result || [];
  }

  async getDeckStructure(url: string, deckName: string): Promise<{ 
    fields: string[], 
    preview: Record<string, string>,
    totalCards: number 
  }> {
    const safeDeckName = deckName.replace(/"/g, '');
    const query = `deck:"${safeDeckName}"`;
    let cardIds: number[] = [];
    let useNotesFallback = false;

    try {
      cardIds = await this.request(url, 'findCards', { query });
    } catch (e: any) {
      console.warn("findCards failed in getDeckStructure, falling back to findNotes", e);
      useNotesFallback = true;
      try {
        cardIds = await this.request(url, 'findNotes', { query });
      } catch (e2: any) {
        throw new Error(`Nie udało się pobrać kart ani notatek. Błąd: ${e2.message}`);
      }
    }

    if (!cardIds || cardIds.length === 0) {
      throw new Error(`Talia "${deckName}" jest pusta lub zapytanie '${query}' nie zwróciło wyników.`);
    }

    const infoAction = useNotesFallback ? 'notesInfo' : 'cardsInfo';
    const infoParam = useNotesFallback ? { notes: [cardIds[0]] } : { cards: [cardIds[0]] };
    
    const cardsData = await this.request(url, infoAction, infoParam);
    if (!cardsData || cardsData.length === 0) {
       throw new Error("Nie udało się pobrać szczegółów karty/notatki.");
    }
    const firstCard = cardsData[0];
    
    const fields = Object.keys(firstCard.fields || {});
    const preview: Record<string, string> = {};
    fields.forEach(f => {
      preview[f] = firstCard.fields[f].value.replace(/<[^>]*>/g, '').trim();
    });

    return {
      fields,
      preview,
      totalCards: cardIds.length
    };
  }

  async getWordsFromDeck(
    url: string, 
    deckName: string, 
    targetField: string,
    daysAgo?: number,
    filterStatus: string = 'all'
  ): Promise<AnkiWord[]> {
    const safeDeckName = deckName.replace(/"/g, '');
    let query = `deck:"${safeDeckName}"`;
    
    if (filterStatus === 'learned') {
      query += ' -is:new';
    } else if (filterStatus === 'reviewed') {
      query += ' is:review';
    }

    if (daysAgo && daysAgo > 0) {
      query += ` rated:${daysAgo}`;
    }

    console.log(`[AnkiService] Próba zapytania findCards: ${query}`);

    let cardIds: number[] = [];
    
    try {
      cardIds = await this.request(url, 'findCards', { query });
      console.log(`[AnkiService] findCards zwróciło ${cardIds.length} ID.`);
    } catch (e: any) {
      console.warn(`[AnkiService] findCards z filtrami nie powiodło się: ${e.message}. Próba fallbacku.`);
      const basicQuery = `deck:"${safeDeckName}"`;
      try {
        cardIds = await this.request(url, 'findCards', { query: basicQuery });
        console.log(`[AnkiService] Fallback findCards (wszystkie): ${cardIds.length} ID.`);
      } catch (e2: any) {
        console.error(`[AnkiService] Fallback findCards również zawiódł: ${e2.message}`);
        return [];
      }
    }

    if (!cardIds || cardIds.length === 0) return [];

    if (cardIds.length > 2000) {
      cardIds = cardIds.slice(0, 2000);
    }

    const chunks = this.chunkArray(cardIds, 50);
    let allWords: AnkiWord[] = [];
    const now = Date.now();

    for (const chunk of chunks) {
      try {
        const cardsData = await this.request(url, 'cardsInfo', { cards: chunk });
        if (!cardsData) continue;

        const statusMap: Record<number, AnkiWord['status']> = {
          0: 'new', 1: 'learning', 2: 'review', 3: 'relearning'
        };

        const mapped = cardsData.map((card: any) => {
          const rawContent = card.fields && card.fields[targetField] ? card.fields[targetField].value : "";
          const cleanWord = rawContent.replace(/<[^>]*>/g, '').trim();
          const allFields: Record<string, string> = {};
          if (card.fields) {
            Object.keys(card.fields).forEach(k => {
              allFields[k] = card.fields[k].value.replace(/<[^>]*>/g, '').trim();
            });
          }
          return {
            word: cleanWord,
            fields: allFields,
            interval: card.interval || 0,
            reps: card.reps || 0,
            status: statusMap[card.type] || 'new',
            lastReview: card.mod ? card.mod * 1000 : 0
          };
        });

        const filtered = mapped.filter((w: AnkiWord) => {
          if (filterStatus === 'learned' && w.status === 'new') return false;
          if (filterStatus === 'reviewed' && w.status !== 'review') return false;
          if (daysAgo && daysAgo > 0) {
            if (!w.lastReview) return false;
            const diffDays = (now - w.lastReview) / (1000 * 60 * 60 * 24);
            if (diffDays > daysAgo) return false;
          }
          return true;
        });

        allWords = allWords.concat(filtered);
        if (allWords.length >= 1000) break;
      } catch (chunkErr: any) {
        console.error(`[AnkiService] Błąd podczas pobierania paczki kart: ${chunkErr.message}`);
        continue;
      }
    }

    return allWords;
  }

  async parseApkg(file: File): Promise<{
    decks: Record<string, { id: string, name: string }>,
    models: Record<string, { id: string, name: string, flds: {name: string}[] }>,
    db: any
  }> {
    const zip = await JSZip.loadAsync(file);
    const dbFile = zip.file("collection.anki21") || zip.file("collection.anki2");
    if (!dbFile) throw new Error("Nie znaleziono bazy danych w pliku .apkg");

    const dbData = await dbFile.async("uint8array");
    const SQL = await this.getSql();
    const db = new SQL.Database(dbData);

    const colResult = db.exec("SELECT models, decks FROM col");
    if (colResult.length === 0) throw new Error("Błąd odczytu tabeli col");

    const models = JSON.parse(colResult[0].values[0][0] as string);
    const decks = JSON.parse(colResult[0].values[0][1] as string);

    return { decks, models, db };
  }

  async getWordsFromDb(
    db: any,
    deckId: string,
    targetFieldName: string,
    daysAgo?: number,
    filterStatus: string = 'all'
  ): Promise<AnkiWord[]> {
    const now = Date.now();
    const query = `
      SELECT n.flds, c.type, c.ivl, c.reps, c.mod, n.mid
      FROM notes n
      JOIN cards c ON n.id = c.nid
      WHERE c.did = ${deckId}
    `;

    const result = db.exec(query);
    if (result.length === 0) return [];

    const rows = result[0].values;
    const colResult = db.exec("SELECT models FROM col");
    const models = JSON.parse(colResult[0].values[0][0] as string);

    const statusMap: Record<number, AnkiWord['status']> = {
      0: 'new', 1: 'learning', 2: 'review', 3: 'relearning'
    };

    const words: AnkiWord[] = rows.map((row: any) => {
      const flds = (row[0] as string).split('\u001f');
      const type = row[1] as number;
      const ivl = row[2] as number;
      const reps = row[3] as number;
      const mod = row[4] as number;
      const mid = row[5] as string;

      const model = models[mid];
      const fields: Record<string, string> = {};
      let word = "";

      if (model && model.flds) {
        model.flds.forEach((f: any, idx: number) => {
          const val = flds[idx] ? flds[idx].replace(/<[^>]*>/g, '').trim() : "";
          fields[f.name] = val;
          if (f.name === targetFieldName) word = val;
        });
      }

      return {
        word,
        fields,
        interval: ivl,
        reps: reps,
        status: statusMap[type] || 'new',
        lastReview: mod * 1000
      };
    });

    return words.filter(w => {
      if (filterStatus === 'learned' && w.status === 'new') return false;
      if (filterStatus === 'reviewed' && w.status !== 'review') return false;
      if (daysAgo && daysAgo > 0) {
        if (!w.lastReview) return false;
        const diffDays = (now - w.lastReview) / (1000 * 60 * 60 * 24);
        if (diffDays > daysAgo) return false;
      }
      return true;
    });
  }

  private chunkArray(arr: any[], size: number) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}
