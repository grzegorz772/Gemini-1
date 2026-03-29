import { AnkiWord } from "../types";

/**
 * Service for interacting with AnkiConnectAndroid
 * https://github.com/KamWithK/AnkiconnectAndroid
 */
export class AnkiService {
  private async request(url: string, action: string, params?: any): Promise<any> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, version: 6, params })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(`AnkiConnect Error: ${data.error}`);
      }
      
      return data.result;
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message.includes('Failed to fetch')) {
        throw new Error(`Błąd połączenia (Failed to fetch). Upewnij się, że Anki jest włączone, port jest poprawny, a aplikacja ma uprawnienia CORS dla ${window.location.origin}. Jeśli używasz HTTPS, a Anki jest na HTTP, przeglądarka może blokować połączenie (Mixed Content).`);
      }
      throw e;
    }
  }

  async checkConnection(url: string): Promise<boolean> {
    try {
      await this.request(url, 'version');
      return true;
    } catch (e) {
      throw e; // Rzucamy błąd dalej, aby UI mogło go zalogować
    }
  }

  async getDeckNames(url: string): Promise<string[]> {
    const result = await this.request(url, 'deckNames');
    return result || [];
  }

  async getWordsFromDeck(url: string, deckName: string): Promise<AnkiWord[]> {
    const noteIds = await this.request(url, 'findNotes', { query: `deck:"${deckName}"` });
    if (!noteIds || noteIds.length === 0) return [];

    const notesData = await this.request(url, 'notesInfo', { notes: noteIds });
    
    return (notesData || []).map((note: any) => ({
      word: note.fields.Front?.value || note.fields.Word?.value || "",
      interval: 0, // Simplified
      status: 'known'
    }));
  }
}
