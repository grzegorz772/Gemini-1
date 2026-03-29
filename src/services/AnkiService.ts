import { AnkiWord } from "../types";

/**
 * Pełna usługa AnkiService z filtrowaniem czasu (rated:X) 
 * oraz mechanicznym bezpiecznikiem chroniącym przed pobraniem całej talii.
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
        throw new Error(`[HTTP ${response.status}] Nie można połączyć z AnkiConnect.`);
      }
      
      const data = await response.json();
      if (data.error && data.error !== "null") {
        throw new Error(`[Anki API Error] ${data.error}`);
      }
      
      return data.result;
    } catch (e: any) {
      if (e instanceof TypeError && e.message.includes('fetch')) {
        throw new Error(`Błąd sieci: Sprawdź czy AnkiConnect Android jest włączony na porcie 8765.`);
      }
      throw e;
    }
  }

  async checkConnection(url: string): Promise<boolean> {
    try {
      await this.request(url, 'version');
      return true;
    } catch (e: any) {
      throw new Error(`Połączenie nieudane: ${e.message}`);
    }
  }

  async getDeckNames(url: string): Promise<string[]> {
    const result = await this.request(url, 'deckNames');
    return result || [];
  }

  /**
   * Pobiera strukturę pól, aby użytkownik mógł wybrać 'targetField'.
   */
  async getDeckStructure(url: string, deckName: string): Promise<{ 
    fields: string[], 
    preview: Record<string, string>,
    totalCards: number 
  }> {
    const safeDeckName = deckName.replace(/"/g, '');
    const query = `deck:"${safeDeckName}"`;
    
    // Używamy findCards, bo chcemy ID kart do cardsInfo
    const cardIds = await this.request(url, 'findCards', { query });

    if (!cardIds || cardIds.length === 0) {
      throw new Error(`Talia "${deckName}" jest pusta.`);
    }

    const cardsData = await this.request(url, 'cardsInfo', { cards: [cardIds[0]] });
    if (!cardsData || cardsData.length === 0) throw new Error("Błąd pobierania danych karty.");

    const firstCard = cardsData[0];
    const fields = Object.keys(firstCard.fields || {});
    const preview: Record<string, string> = {};

    fields.forEach(f => {
      preview[f] = firstCard.fields[f].value.replace(/<[^>]*>/g, '').trim();
    });

    return { fields, preview, totalCards: cardIds.length };
  }

  /**
   * Główna funkcja pobierająca słowa.
   * STOSUJE PODWÓJNY FILTR: API (rated:X) oraz RĘCZNY (lastReview).
   */
  async getWordsFromDeck(
    url: string, 
    deckName: string, 
    targetField: string,
    daysAgo?: number
  ): Promise<AnkiWord[]> {
    const safeDeckName = deckName.replace(/"/g, '');
    
    // 1. Filtr na poziomie zapytania API
    let query = `deck:"${safeDeckName}"`;
    if (daysAgo && daysAgo > 0) {
      query += ` rated:${daysAgo}`;
    }

    // WAŻNE: Nie używamy findNotes, bo notatki nie obsługują filtra 'rated'
    const cardIds = await this.request(url, 'findCards', { query });
    
    if (!cardIds || cardIds.length === 0) return [];

    let allWords: AnkiWord[] = [];
    const chunks = this.chunkArray(cardIds, 50);

    for (const chunk of chunks) {
      const cardsData = await this.request(url, 'cardsInfo', { cards: chunk });
      if (!cardsData) continue;

      const mapped = cardsData.map((card: any) => {
        // Mapowanie pól
        const rawContent = card.fields && card.fields[targetField] ? card.fields[targetField].value : "";
        const cleanWord = rawContent.replace(/<[^>]*>/g, '').trim();

        const allFields: Record<string, string> = {};
        Object.keys(card.fields).forEach(k => {
          allFields[k] = card.fields[k].value.replace(/<[^>]*>/g, '').trim();
        });

        const statusMap: Record<number, AnkiWord['status']> = {
          0: 'new', 1: 'learning', 2: 'review', 3: 'relearning'
        };

        return {
          word: cleanWord,
          fields: allFields,
          interval: card.interval || 0,
          reps: card.reps || 0,
          status: statusMap[card.type] || 'new',
          // mod to czas modyfikacji w sekundach, zamieniamy na milisekundy
          lastReview: card.mod ? card.mod * 1000 : 0 
        };
      });

      allWords = allWords.concat(mapped);
    }

    // 2. FILTR RĘCZNY (Client-side Backup)
    // Jeśli API zignorowało rated:X i wysłało całą talię, wycinamy stare dane tutaj.
    if (daysAgo && daysAgo > 0) {
      const now = Date.now();
      const cutoff = now - (daysAgo * 24 * 60 * 60 * 1000);

      const filtered = allWords.filter(word => (word.lastReview || 0) >= cutoff);
      console.log(`Pobrano ${allWords.length} kart, po filtrze zostało: ${filtered.length}`);
      return filtered;
    }

    return allWords;
  }

  private chunkArray(arr: any[], size: number) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  }
}