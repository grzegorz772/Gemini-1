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
      
      // Obsługa specyficznego błędu "null" w AnkiconnectAndroid
      if (data.error && data.error !== "null") {
        throw new Error(data.error);
      }

      return data.result;
    } catch (e: any) {
      throw new Error(`[Anki ${action}] ${e.message}`);
    }
  }

  /**
   * Sprawdza połączenie z AnkiConnect
   */
  async checkConnection(url: string): Promise<boolean> {
    try {
      await this.request(url, 'version');
      return true;
    } catch (e: any) {
      throw new Error(`Błąd weryfikacji połączenia: ${e.message}`);
    }
  }

  /**
   * KROK 1: Pobiera listę talii
   */
  async getDeckNames(url: string): Promise<string[]> {
    const result = await this.request(url, 'deckNames');
    return result || [];
  }

  /**
   * KROK 2: Podgląd struktury talii przed pobraniem całości.
   * Zwraca nazwy pól (kolumn) oraz przykładowe wartości z pierwszej notatki.
   */
  async getDeckStructure(url: string, deckName: string): Promise<{ 
    fields: string[], 
    preview: Record<string, string>,
    totalCards: number 
  }> {
    // Używamy pojedynczych cudzysłowów, aby uniknąć błędów parsowania (MalformedJsonException) w AnkiConnectAndroid
    const query = `deck:'${deckName}'`;
    let cardIds: number[] = [];
    let useNotesFallback = false;

    try {
      cardIds = await this.request(url, 'findCards', { query });
    } catch (e: any) {
      console.warn("findCards failed in getDeckStructure, falling back to findNotes", e);
      useNotesFallback = true;
      cardIds = await this.request(url, 'findNotes', { query });
    }

    if (!cardIds || cardIds.length === 0) {
      throw new Error("Talia jest pusta.");
    }

    // Pobieramy dane tylko dla PIERWSZEJ karty, aby poznać strukturę
    const infoAction = useNotesFallback ? 'notesInfo' : 'cardsInfo';
    const infoParam = useNotesFallback ? { notes: [cardIds[0]] } : { cards: [cardIds[0]] };
    
    const cardsData = await this.request(url, infoAction, infoParam);
    const firstCard = cardsData[0];
    
    const fields = Object.keys(firstCard.fields);
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

  /**
   * KROK 3: Pobieranie słów z konkretnego pola z filtrowaniem.
   * @param targetField Nazwa pola wybrana przez użytkownika (np. "Word")
   * @param daysAgo Opcjonalnie: ile dni wstecz sprawdzano karty (np. 7 dni)
   */
  async getWordsFromDeck(
    url: string, 
    deckName: string, 
    targetField: string,
    daysAgo?: number
  ): Promise<AnkiWord[]> {
    // Budowanie zapytania: np. deck:'MojaTalia' rated:7
    // Używamy pojedynczych cudzysłowów dla kompatybilności z AnkiConnectAndroid
    let query = `deck:'${deckName}'`;
    if (daysAgo) {
      query += ` rated:${daysAgo}`;
    }

    let cardIds: number[] = [];
    let useNotesFallback = false;

    try {
      cardIds = await this.request(url, 'findCards', { query });
    } catch (e: any) {
      console.warn("findCards failed in getWordsFromDeck, falling back to findNotes", e);
      useNotesFallback = true;
      // Jeśli używamy fallbacku, usuwamy 'rated:' bo findNotes może go nie wspierać tak samo
      const fallbackQuery = `deck:'${deckName}'`;
      cardIds = await this.request(url, 'findNotes', { query: fallbackQuery });
    }

    if (!cardIds || cardIds.length === 0) return [];

    let allWords: AnkiWord[] = [];
    // Chunking po 50, aby nie przepełnić bufora Androida
    const chunks = this.chunkArray(cardIds, 50);
    const infoAction = useNotesFallback ? 'notesInfo' : 'cardsInfo';

    for (const chunk of chunks) {
      const infoParam = useNotesFallback ? { notes: chunk } : { cards: chunk };
      const cardsData = await this.request(url, infoAction, infoParam);
      
      const mapped = cardsData.map((card: any) => {
        // Wyciągamy czysty tekst z wybranego pola
        const rawContent = card.fields[targetField]?.value || "";
        const cleanWord = rawContent.replace(/<[^>]*>/g, '').trim();

        // Pełna mapa pól dla dodatkowego kontekstu (np. definicje)
        const allFields: Record<string, string> = {};
        Object.keys(card.fields).forEach(k => {
          allFields[k] = card.fields[k].value.replace(/<[^>]*>/g, '').trim();
        });

        const statusMap: Record<number, AnkiWord['status']> = {
          0: 'new',
          1: 'learning',
          2: 'review',
          3: 'relearning'
        };

        return {
          word: cleanWord,
          fields: allFields,
          interval: useNotesFallback ? 30 : (card.interval || 0),
          reps: useNotesFallback ? 5 : (card.reps || 0),
          status: useNotesFallback ? 'review' : (statusMap[card.type] || 'new'),
          lastReview: useNotesFallback ? Date.now() : (card.mod ? card.mod * 1000 : undefined)
        };
      });

      allWords = allWords.concat(mapped);
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