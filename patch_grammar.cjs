const fs = require('fs');
let code = fs.readFileSync('src/services/GeminiEngine.ts', 'utf8');

const detailedExplanationReplacement = `  async getDetailedExplanation(correction: string, original: string, corrected: string, settings: UserSettings): Promise<string> {

    const model = settings.aiModel || "gemini-3.5-flash";
    const prompt = \`Explain in detail the grammatical mistakes made in this sentence.
    Original: "\${original}"
    Corrected: "\${corrected}"
    Brief Correction: "\${correction}"
    
    Dla odpowiedzi dotyczących gramatyki:
    - nie wymyślaj reguł,
    - jeśli pytanie zawiera błędne założenie, wskaż błąd,
    - podawaj poprawne przykłady,
    - dostosowuj trudność do poziomu CEFR użytkownika (\${settings.cefrLevel}),
    - odpowiadaj w języku ustawionym przez użytkownika (\${settings.nativeLanguage}).\`;

    const request: any = { 
      model,
      contents: prompt
    };

    const { text: resText, usage, latency } = await this.executePrompt(request, prompt);
    this.trackUsage(usage, request, latency);
    return resText || "Brak szczegółowego wyjaśnienia.";
  }`;

const miniChatReplacement = `  async getExplanationMiniChat(history: any[], userMessage: string, messageToExplain: any, settings: any): Promise<string> {
    const model = settings.explainerModel || settings.aiModel || "gemini-3.1-flash-lite";
    const isGemma = model.toLowerCase().includes('gemma');

    let systemPrompt = \`You are a helpful language teacher. 
    A student (native language: \${settings.nativeLanguage}, learning: \${settings.targetLanguage}, level: \${settings.cefrLevel}) is asking for an explanation of a mistake they made or something they didn't understand.
    Original student message: "\${messageToExplain.originalText}"
    AI correction was: "\${messageToExplain.message?.correctedSentence}"
    AI explanation was: "\${messageToExplain.message?.explanation}"
    
    The student is now asking a follow-up question.
    
    Dla odpowiedzi dotyczących gramatyki:
    - nie wymyślaj reguł,
    - jeśli pytanie zawiera błędne założenie, wskaż błąd,
    - podawaj poprawne przykłady,
    - dostosowuj trudność do poziomu CEFR użytkownika (\${settings.cefrLevel}),
    - odpowiadaj w języku ustawionym przez użytkownika (\${settings.nativeLanguage}).\`;`;

code = code.replace(/async getDetailedExplanation[\s\S]*?Brak szczegółowego wyjaśnienia\.";\n  }/m, detailedExplanationReplacement);
code = code.replace(/async getExplanationMiniChat\([\s\S]*?friendly, and helpful\.\`;/m, miniChatReplacement);

fs.writeFileSync('src/services/GeminiEngine.ts', code);
