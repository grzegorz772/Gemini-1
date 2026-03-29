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
    const cardIds = await this.request(url, 'findCards', { query: `deck:"${deckName}"` });
    if (!cardIds || cardIds.length === 0) return [];

    const cardsData = await this.request(url, 'cardsInfo', { cards: cardIds });
    
    return (cardsData || []).map((card: any) => {
      // Extract all fields
      const fields: Record<string, string> = {};
      Object.keys(card.fields).forEach(key => {
        fields[key] = card.fields[key].value.replace(/<[^>]*>/g, '').trim();
      });

      // Default word (will be overridden by selected field in UI)
      const word = fields.Front || fields.Word || fields.Text || Object.values(fields)[0] || "";
      
      // Map Anki card types to our status
      // 0=new, 1=learning, 2=review, 3=relearning
      const statusMap: Record<number, AnkiWord['status']> = {
        0: 'new',
        1: 'learning',
        2: 'review',
        3: 'relearning'
      };

      return {
        word,
        fields,
        interval: card.interval || 0,
        reps: card.reps || 0,
        status: statusMap[card.type] || 'new',
        lastReview: card.mod * 1000 // Convert to timestamp
      };
    });
  }
}
