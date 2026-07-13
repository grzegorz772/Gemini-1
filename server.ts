import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/evaluate-accent", async (req, res) => {
    try {
      const { targetText, transcribedText } = req.body;
      
      if (!targetText || !transcribedText) {
        return res.status(400).json({ error: "Missing targetText or transcribedText" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Jesteś ekspertem-fonetykiem oceniającym akcent i wymowę użytkownika.
Oto tekst, który użytkownik miał przeczytać: "${targetText}"
A oto co lokalny akustyczny model rozpoznał (tekst/fonemy): "${transcribedText}"

Model akustyczny mógł się pomylić (np. zapisać inne słowo o zbliżonym brzmieniu lub popełnić błąd fonetyczny).
Twoim zadaniem jest ocenić, które słowa z tekstu wzorcowego mogły zostać źle wymówione, biorąc pod uwagę to, co zwrócił model.
Zwróć odpowiedź WYŁĄCZNIE W FORMACIE JSON (zgodnie ze strukturą poniżej, bez żadnego dodatkowego tekstu ani formatowania markdown). 

Zwracana struktura JSON:
{
  "overallScore": 85,
  "feedback": "Krótka, zachęcająca ogólna ocena",
  "words": [
    {
      "word": "wzorcowe_slowo",
      "heard": "jak_zostalo_wymowione",
      "isCorrect": true, // lub false
      "feedback": "opcjonalny, krótki komentarz co poszło nie tak"
    }
  ]
}
Analizuj dokładnie. Bądź wyrozumiały, ale wskaż oczywiste błędy, jeśli zapis z modelu wyraźnie odbiega od poprawnej wymowy.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const jsonText = response.text;
      const result = JSON.parse(jsonText);
      res.json(result);
    } catch (err: any) {
      console.error("Error calling Gemini API:", err);
      res.status(500).json({ error: err.message || "Failed to evaluate accent" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
