var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.post("/api/evaluate-accent", async (req, res) => {
    try {
      const { targetText, transcribedText } = req.body;
      if (!targetText || !transcribedText) {
        return res.status(400).json({ error: "Missing targetText or transcribedText" });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Jeste\u015B ekspertem-fonetykiem oceniaj\u0105cym akcent i wymow\u0119 u\u017Cytkownika.
Oto tekst, kt\xF3ry u\u017Cytkownik mia\u0142 przeczyta\u0107: "${targetText}"
A oto co lokalny akustyczny model rozpozna\u0142 (tekst/fonemy): "${transcribedText}"

Model akustyczny m\xF3g\u0142 si\u0119 pomyli\u0107 (np. zapisa\u0107 inne s\u0142owo o zbli\u017Conym brzmieniu lub pope\u0142ni\u0107 b\u0142\u0105d fonetyczny).
Twoim zadaniem jest oceni\u0107, kt\xF3re s\u0142owa z tekstu wzorcowego mog\u0142y zosta\u0107 \u017Ale wym\xF3wione, bior\u0105c pod uwag\u0119 to, co zwr\xF3ci\u0142 model.
Zwr\xF3\u0107 odpowied\u017A WY\u0141\u0104CZNIE W FORMACIE JSON (zgodnie ze struktur\u0105 poni\u017Cej, bez \u017Cadnego dodatkowego tekstu ani formatowania markdown). 

Zwracana struktura JSON:
{
  "overallScore": 85,
  "feedback": "Kr\xF3tka, zach\u0119caj\u0105ca og\xF3lna ocena",
  "words": [
    {
      "word": "wzorcowe_slowo",
      "heard": "jak_zostalo_wymowione",
      "isCorrect": true, // lub false
      "feedback": "opcjonalny, kr\xF3tki komentarz co posz\u0142o nie tak"
    }
  ]
}
Analizuj dok\u0142adnie. B\u0105d\u017A wyrozumia\u0142y, ale wska\u017C oczywiste b\u0142\u0119dy, je\u015Bli zapis z modelu wyra\u017Anie odbiega od poprawnej wymowy.`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const jsonText = response.text;
      const result = JSON.parse(jsonText);
      res.json(result);
    } catch (err) {
      console.error("Error calling Gemini API:", err);
      res.status(500).json({ error: err.message || "Failed to evaluate accent" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
