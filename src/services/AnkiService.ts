import { AnkiWord } from "../types";

export class AnkiService {
  private async request(url: string, action: string, params?: any): Promise<any> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, version: 6, params })
      });
      
      if (!response.ok) {
        throw new Error(`[HTTP ${response.status}] Nie można nawiązać połączenia z serwerem AnkiConnect. Sprawdź czy adres ${url} jest poprawny.`);
      }
      
      const data = await response.json();

      // AnkiconnectAndroid potrafi zwrócić string "null" zamiast wartości null w polu error
      if (data.error && data.error !== "null") {
        throw new Error(`[Anki API Error] Akcja "${action}" zwróciła błąd: ${data.error}`);
      }
      
      return data.result;
    } catch (e: any) {
      if (e instanceof TypeError && e.message.includes('fetch')) {
        throw new Error(`[Network Error] Brak dostępu do ${url}. Upewnij się, że: 
          1. Ankiconnect Android ma włączony "Start Service".
          2. Telefon i komputer są w tej samej sieci (jeśli nie używasz localhost).
          3. Przeglądarka nie blokuje Mixed Content (HTTP na stronie HTTPS).`);
      }
      throw e;
    }
  }

  async checkConnection(url: string): Promise<boolean> {
    try {
      await this.request(url, 'version');
      return true;
    } catch (e: any) {
      console.error("Connection check failed:", e.message);
      throw new Error(`Błąd weryfikacji połączenia: ${e.message}`);
    }
  }

  async getDeckNames(url: string): Promise<string[]> {
    try {
      const result = await this.request(url, 'deckNames');
      return result || [];
    } catch (e: any) {
      throw new Error(`Nie udało się pobrać listy talii: ${e.message}`);
    }
  }

  async getWordsFromDeck(url: string, deckName: string): Promise<AnkiWord[]> {
    const chunkArray = (arr: any[], size: number) => {
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
      return chunks;
    };

    const query = `deck:'${deckName}'`;

    // --- KROK 1: findCards ---
    let cardIds: number[];
    try {
      cardIds = await this.request(url, 'findCards', { query });
    } catch (e: any) {
      console.warn("KROK 1 (findCards) nieudany, próbuję trybu kompatybilności (findNotes). Powód:", e.message);
      return this.fallbackToNotes(url, query); 
    }

    if (!cardIds || cardIds.length === 0) return [];

    // --- KROK 2: cardsInfo ---
    let allCardsData: any[] = [];
    const cardChunks = chunkArray(cardIds, 50); 
    
    try {
      for (const [index, chunk] of cardChunks.entries()) {
        const cardsData = await this.request(url, 'cardsInfo', { cards: chunk });
        if (cardsData) {
          allCardsData = allCardsData.concat(cardsData);
        } else {
          console.warn(`Paczka danych ${index + 1} zwróciła pusty wynik.`);
        }
      }
    } catch (e: any) {
      throw new Error(`Błąd podczas pobierania szczegółów kart (cardsInfo): ${e.message}`);
    }

    // --- KROK 3: Mapowanie danych ---
    try {
      return allCardsData.map((card: any) => this.mapCardToAnkiWord(card));
    } catch (e: any) {
      throw new Error(`Błąd przetwarzania danych z Anki (Mapowanie): ${e.message}`);
    }
  }

  // Odseparowany fallback dla przejrzystości
  private async fallbackToNotes(url: string, query: string): Promise<AnkiWord[]> {
    let noteIds: number[];
    try {
      noteIds = await this.request(url, 'findNotes', { query });
    } catch (e: any) {
      throw new Error(`Tryb kompatybilności zawiódł. Nie można znaleźć notatek: ${e.message}`);
    }

    if (!noteIds || noteIds.length === 0) return [];

    let allNotesData: any[] = [];
    try {
      const noteChunks = this.chunkArray(noteIds, 50);
      for (const chunk of noteChunks) {
        const notesData = await this.request(url, 'notesInfo', { notes: chunk });
        if (notesData) allNotesData = allNotesData.concat(notesData);
      }
    } catch (e: any) {
      throw new Error(`Błąd w trybie kompatybilności (notesInfo): ${e.message}`);
    }

    return allNotesData.map((note: any) => this.mapNoteToAnkiWord(note));
  }

  // Helpery do mapowania, aby główna funkcja była czytelna
  private mapCardToAnkiWord(card: any): AnkiWord {
    const fields: Record<string, string> = {};
    if (card.fields) {
      Object.keys(card.fields).forEach(key => {
        fields[key] = card.fields[key].value.replace(/<[^>]*>/g, '').trim();
      });
    }

    const word = fields.Front || fields.Word || fields.Text || Object.values(fields)[0] || "Unknown";
    const statusMap: Record<number, AnkiWord['status']> = { 0: 'new', 1: 'learning', 2: 'review', 3: 'relearning' };

    return {
      word,
      fields,
      interval: card.interval || 0,
      reps: card.reps || 0,
      status: statusMap[card.type] || 'new',
      lastReview: card.mod ? card.mod * 1000 : undefined
    };
  }

  private mapNoteToAnkiWord(note: any): AnkiWord {
    const fields: Record<string, string> = {};
    if (note.fields) {
      Object.keys(note.fields).forEach(key => {
        fields[key] = note.fields[key].value.replace(/<[^>]*>/g, '').trim();
      });
    }
    return {
      word: fields.Front || fields.Word || fields.Text || Object.values(fields)[0] || "Unknown",
      fields,
      interval: 0,
      reps: 0,
      status: 'review',
      lastReview: Date.now()
    };
  }

  private chunkArray(arr: any[], size: number) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  }
}