import { AnkiWord } from "../types";

/**
 * Service for interacting with AnkiConnectAndroid
 * Zoptymalizowany pod kątem dynamicznego wyboru pól i filtrowania powtórek.
 */
export class AnkiService {
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
    const query = `deck:"${safeDeckName}"`;

    let cardIds: number[] = [];
    let useNotesFallback = false;

    // Pobranie wszystkich kart lub notatek
    try {
      cardIds = await this.request(url, 'findCards', { query });
    } catch (e: any) {
      console.warn("findCards failed in getWordsFromDeck, falling back to findNotes", e);
      useNotesFallback = true;
      try {
        cardIds = await this.request(url, 'findNotes', { query });
      } catch (e2: any) {
        throw new Error(`Nie udało się pobrać kart ani notatek. Błąd: ${e2.message}`);
      }
    }

    if (!cardIds || cardIds.length === 0) return [];

    const chunks = this.chunkArray(cardIds, 50);
    const infoAction = useNotesFallback ? 'notesInfo' : 'cardsInfo';

    let allWords: AnkiWord[] = [];

    for (const chunk of chunks) {
      const infoParam = useNotesFallback ? { notes: chunk } : { cards: chunk };
      const cardsData = await this.request(url, infoAction, infoParam);
      if (!cardsData) continue;

      const statusMap: Record<number, AnkiWord['status']> = {
        0: 'new',
        1: 'learning',
        2: 'review',
        3: 'relearning'
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
          interval: useNotesFallback ? 30 : (card.interval || 0),
          reps: useNotesFallback ? 5 : (card.reps || 0),
          status: useNotesFallback ? 'review' : (statusMap[card.type] || 'new'),
          lastReview: useNotesFallback ? Date.now() : (card.mod ? card.mod * 1000 : undefined)
        };
      });

      // Filtrowanie po stronie JS
      const filtered = mapped.filter(w => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'learned') return w.status === 'review' || w.status === 'learning';
        if (filterStatus === 'reviewed') return w.status === 'review';
        return true;
      });

      // Filtrowanie po daysAgo
      const now = Date.now();
      const finalFiltered = filtered.filter(w => {
        if (!daysAgo || !w.lastReview) return true;
        const diffDays = (now - w.lastReview) / (1000 * 60 * 60 * 24);
        return diffDays <= daysAgo;
      });

      allWords = allWords.concat(finalFiltered);
    }

    return allWords;
  }

  private chunkArray(arr: any[], size: number) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}