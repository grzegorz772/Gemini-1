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
    
    // Budujemy zapytanie tak, aby Anki od razu przefiltrowało ID kart.
    let query = `deck:"${safeDeckName}"`;
    
    // Dodajemy filtry statusu do zapytania
    if (filterStatus === 'learned') {
      query += ' -is:new';
    } else if (filterStatus === 'reviewed') {
      query += ' is:review';
    }

    // Dodajemy filtr czasu do zapytania
    if (daysAgo && daysAgo > 0) {
      query += ` rated:${daysAgo}`;
    }

    console.log(`[AnkiService] Próba zapytania findCards: ${query}`);

    let cardIds: number[] = [];
    
    try {
      // Próbujemy pobrać przefiltrowane ID kart
      cardIds = await this.request(url, 'findCards', { query });
      console.log(`[AnkiService] findCards zwróciło ${cardIds.length} ID.`);
      
      // Jeśli zapytanie z filtrami zwróciło 0, a mamy filtry, to może filtr jest zbyt restrykcyjny 
      // lub API go nie rozumie. Ale jeśli zwróciło > 0, to super.
    } catch (e: any) {
      console.warn(`[AnkiService] findCards z filtrami nie powiodło się: ${e.message}. Próba fallbacku.`);
      // Fallback: pobieramy wszystko z deku i przefiltrujemy w JS
      const basicQuery = `deck:"${safeDeckName}"`;
      try {
        cardIds = await this.request(url, 'findCards', { query: basicQuery });
        console.log(`[AnkiService] Fallback findCards (wszystkie): ${cardIds.length} ID.`);
      } catch (e2: any) {
        console.error(`[AnkiService] Fallback findCards również zawiódł: ${e2.message}`);
        return [];
      }
    }

    if (!cardIds || cardIds.length === 0) {
      console.log("[AnkiService] Brak kart spełniających kryteria (ID = 0).");
      return [];
    }

    // Jeśli mamy bardzo dużo kart (np. > 2000), a filtr API nie zadziałał (fallback), 
    // to pobieranie wszystkiego będzie trwało wieki.
    if (cardIds.length > 2000) {
      console.warn(`[AnkiService] Wykryto bardzo dużą liczbę kart (${cardIds.length}). Ograniczam do pierwszych 2000.`);
      cardIds = cardIds.slice(0, 2000);
    }

    // Jeśli mamy bardzo dużo kart, dzielimy na mniejsze paczki
    const chunks = this.chunkArray(cardIds, 50);
    let allWords: AnkiWord[] = [];
    const now = Date.now();

    console.log(`[AnkiService] Rozpoczynam pobieranie cardsInfo dla ${cardIds.length} kart w ${chunks.length} paczkach.`);

    for (const chunk of chunks) {
      try {
        const cardsData = await this.request(url, 'cardsInfo', { cards: chunk });
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

          // card.mod to czas modyfikacji (sekundy), często zbieżny z ostatnią powtórką
          const lastReviewTime = card.mod ? card.mod * 1000 : 0;

          return {
            word: cleanWord,
            fields: allFields,
            interval: card.interval || 0,
            reps: card.reps || 0,
            status: statusMap[card.type] || 'new',
            lastReview: lastReviewTime
          };
        });

        // FILTROWANIE PO STRONIE KLIENTA (zawsze robimy dla pewności i jako fallback)
        const filtered = mapped.filter((w: AnkiWord) => {
          // 1. Filtr statusu
          if (filterStatus === 'learned') {
            if (w.status === 'new') return false;
          } else if (filterStatus === 'reviewed') {
            if (w.status !== 'review') return false;
          }

          // 2. Filtr czasu (daysAgo)
          // Jeśli API przefiltrowało poprawnie, to ten warunek i tak przejdzie.
          // Jeśli API zawiodło i mamy fallback, to filtrujemy po modyfikacji (mod).
          if (daysAgo && daysAgo > 0) {
            if (!w.lastReview) return false;
            const diffDays = (now - w.lastReview) / (1000 * 60 * 60 * 24);
            if (diffDays > daysAgo) return false;
          }

          return true;
        });

        allWords = allWords.concat(filtered);
        
        // Jeśli pobraliśmy już wystarczająco dużo (np. 1000), a deck jest gigantyczny, 
        // to przerywamy, żeby nie blokować UI na wieki.
        if (allWords.length >= 1000) {
          console.log("[AnkiService] Osiągnięto limit 1000 przefiltrowanych słów, kończę.");
          break;
        }
      } catch (chunkErr: any) {
        console.error(`[AnkiService] Błąd podczas pobierania paczki kart: ${chunkErr.message}`);
        continue;
      }
    }

    console.log(`[AnkiService] Finalnie pobrano i przefiltrowano: ${allWords.length} słów.`);
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