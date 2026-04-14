import { GoogleGenAI } from "@google/genai";
import { UserSettings, Message, ChatSentence } from "../types";

export interface TokenUsage {
  totalTokens: number;
  lastRequest: any;
  history: { tokens: number; timestamp: number; latency: number; request: any }[];
}

export class GeminiEngine {
  public ai: GoogleGenAI;
  public usage: TokenUsage = {
    totalTokens: 0,
    lastRequest: null,
    history: []
  };

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  public trackUsage(tokens: number, request: any, latency: number) {
    this.usage.totalTokens += tokens;
    this.usage.lastRequest = request;
    this.usage.history.push({ tokens, timestamp: Date.now(), latency, request });
    
    // Keep only last 60 minutes of history for TPM calculation
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.usage.history = this.usage.history.filter(h => h.timestamp > oneHourAgo);
  }

  private parseJson(text: string): any {
    try {
      // Remove markdown code blocks if present
      const cleaned = text.replace(/```json\n?|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse JSON response:", text);
      // Fallback for non-JSON responses if possible, or rethrow
      throw e;
    }
  }

  async chat(
    history: Message[],
    userInput: string,
    settings: UserSettings,
    mode: 'dialogue' | 'narrative',
    knownWords?: string[]
  ): Promise<Message> {
    const model = settings.aiModel || "gemini-3-flash-preview";
    const isGemma = model.toLowerCase().includes('gemma');

    const vocabularyConstraint = settings.ankiLimitToKnown && knownWords && knownWords.length > 0
      ? `CRITICAL CONSTRAINT: You MUST ONLY use vocabulary words from the following list in your ${settings.targetLanguage} responses. 
         You MAY use basic grammar words (articles, prepositions, pronouns, basic conjunctions, auxiliary verbs) even if they are not in the list.
         However, for nouns, main verbs, adjectives, and adverbs, you MUST strictly stick to the allowed words.
         If you cannot express something using only these words, simplify the sentence.
         LIST OF ALLOWED VOCABULARY: ${knownWords.join(', ')}`
      : '';

    const systemInstruction = `
      You are a language learning assistant. 
      Native Language: ${settings.nativeLanguage}
      Target Language: ${settings.targetLanguage}
      CEFR Level: ${settings.cefrLevel}
      Mode: ${mode === 'dialogue' ? 'Casual Dialogue' : 'Text Adventure Narrator'}
      
      RULES:
      1. Respond in a JSON format: 
         { 
           "sentences": [ { "text": "sentence in target lang", "translation": "translation in native lang" } ],
           "correctedSentence": "the full corrected version of user's last message",
           "correction": "brief summary of specific mistakes found", 
           "explanation": "optional_explanation_of_correction" 
         }
      2. Split your response into logical sentences.
      3. If the user made a mistake in their last message, provide a correctedSentence, a correction summary and a brief explanation in ${settings.nativeLanguage}.
      4. ${vocabularyConstraint}
      5. Keep the conversation engaging.
    `;

    const request: any = { model };

    if (isGemma) {
      // For Gemma, combine everything into a single prompt string
      let prompt = `INSTRUCTIONS:\n${systemInstruction}\n\n`;
      if (history.length > 0) {
        prompt += `CONVERSATION HISTORY:\n`;
        history.forEach(m => {
          prompt += `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}\n`;
        });
      }
      prompt += `User: ${userInput}\nAssistant:`;
      request.contents = prompt;
    } else {
      request.contents = history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      request.contents.push({ role: 'user', parts: [{ text: userInput }] });
      request.config = {
        systemInstruction,
        responseMimeType: "application/json"
      };
    }

    const startTime = Date.now();
    const response = await this.ai.models.generateContent(request);
    const latency = Date.now() - startTime;

    // Estimate tokens if usageMetadata is missing
    const usage = response.usageMetadata?.totalTokenCount || 
                  Math.ceil((JSON.stringify(request).length + (response.text?.length || 0)) / 4);
    
    this.trackUsage(usage, request, latency);

    try {
      const data = this.parseJson(response.text || "");
      const fullText = data.sentences.map((s: any) => s.text).join(' ');
      return {
        id: Date.now().toString(),
        role: 'model',
        text: fullText,
        sentences: data.sentences,
        correctedSentence: data.correctedSentence,
        correction: data.correction,
        explanation: data.explanation
      };
    } catch (e) {
      return {
        id: Date.now().toString(),
        role: 'model',
        text: response.text || "Error",
        sentences: [{ text: response.text || "Error", translation: "Error parsing" }]
      };
    }
  }

  async generateTopic(settings: UserSettings, knownWords?: string[]) {
    const model = settings.aiModel || "gemini-3-flash-preview";
    const isGemma = model.toLowerCase().includes('gemma');

    const vocabularyConstraint = settings.ankiLimitToKnown && knownWords && knownWords.length > 0
      ? `CRITICAL CONSTRAINT: The topic and description MUST encourage using ONLY these vocabulary words: ${knownWords.join(', ')}. You may use basic grammar words.`
      : '';

    const prompt = `Generate a creative writing topic for a ${settings.targetLanguage} learner at ${settings.cefrLevel} level. 
    ${vocabularyConstraint}
    Return JSON: { "topic": "Short Title", "description": "Detailed instructions in ${settings.nativeLanguage}" }`;

    const request: any = { model };

    if (isGemma) {
      request.contents = prompt;
    } else {
      request.contents = prompt;
      request.config = { responseMimeType: "application/json" };
    }

    const startTime = Date.now();
    const response = await this.ai.models.generateContent(request);
    const latency = Date.now() - startTime;
    const usage = response.usageMetadata?.totalTokenCount || 
                  Math.ceil((JSON.stringify(request).length + (response.text?.length || 0)) / 4);
    this.trackUsage(usage, request, latency);
    return this.parseJson(response.text || "");
  }

  async checkSentence(settings: UserSettings, sentence: string) {
    const model = settings.aiModel || "gemini-3-flash-preview";
    const isGemma = model.toLowerCase().includes('gemma');

    const prompt = `Check this single sentence in ${settings.targetLanguage}: "${sentence}". 
    Is it grammatically correct for ${settings.cefrLevel} level?
    Return JSON: { "isCorrect": boolean, "corrected": "...", "explanation": "Brief explanation in ${settings.nativeLanguage}" }`;

    const request: any = { model };

    if (isGemma) {
      request.contents = prompt;
    } else {
      request.contents = prompt;
      request.config = { responseMimeType: "application/json" };
    }

    const startTime = Date.now();
    const response = await this.ai.models.generateContent(request);
    const latency = Date.now() - startTime;
    const usage = response.usageMetadata?.totalTokenCount || 
                  Math.ceil((JSON.stringify(request).length + (response.text?.length || 0)) / 4);
    this.trackUsage(usage, request, latency);
    return this.parseJson(response.text || "");
  }

  async generateExercises(
    settings: UserSettings,
    grammarTopic: string,
    type: string,
    count: number,
    levelInfo?: string[],
    knownWords?: string[]
  ) {
    const model = settings.aiModel || "gemini-3-flash-preview";
    const isGemma = model.toLowerCase().includes('gemma');

    const vocabularyConstraint = settings.ankiLimitToKnown && knownWords && knownWords.length > 0
      ? `CRITICAL CONSTRAINT: You MUST ONLY use vocabulary words from the following list for the questions and answers in ${settings.targetLanguage}. 
         You MAY use basic grammar words (articles, prepositions, pronouns, basic conjunctions, auxiliary verbs) even if they are not in the list.
         However, for nouns, main verbs, adjectives, and adverbs, you MUST strictly stick to the allowed words.
         LIST OF ALLOWED VOCABULARY: ${knownWords.join(', ')}`
      : '';

    const prompt = `Generate ${count} exercises of type "${type}" for ${settings.targetLanguage} learners at ${settings.cefrLevel} level. 
    Focus on: ${grammarTopic}.
    ${levelInfo ? `Specific points to cover for this level: ${levelInfo.join(', ')}` : ''}
    ${vocabularyConstraint}
    Return as a JSON array of objects: { "question": "...", "answer": "...", "explanation": "..." }`;

    const request: any = { model };

    if (isGemma) {
      request.contents = prompt;
    } else {
      request.contents = prompt;
      request.config = {
        responseMimeType: "application/json"
      };
    }

    const startTime = Date.now();
    const response = await this.ai.models.generateContent(request);
    const latency = Date.now() - startTime;
    const usage = response.usageMetadata?.totalTokenCount || 
                  Math.ceil((JSON.stringify(request).length + (response.text?.length || 0)) / 4);
    this.trackUsage(usage, request, latency);

    return this.parseJson(response.text || "");
  }

  async getTranslation(text: string, settings: UserSettings): Promise<ChatSentence[]> {
    const model = settings.translationModel || settings.aiModel || "gemini-3-flash-preview";
    const isGemma = model.toLowerCase().includes('gemma');
    const prompt = `Translate the following sentences from ${settings.targetLanguage} to ${settings.nativeLanguage}.
    TEXT: "${text}"
    Return JSON: { "sentences": [ { "text": "original sentence", "translation": "translated sentence" } ] }`;

    const request: any = { model };
    if (isGemma) {
      request.contents = prompt;
    } else {
      request.contents = prompt;
      request.config = { responseMimeType: "application/json" };
    }

    const startTime = Date.now();
    const response = await this.ai.models.generateContent(request);
    const latency = Date.now() - startTime;
    const usage = response.usageMetadata?.totalTokenCount || 
                  Math.ceil((JSON.stringify(request).length + (response.text?.length || 0)) / 4);
    this.trackUsage(usage, request, latency);
    const data = this.parseJson(response.text || "");
    return data.sentences;
  }

  async getCorrection(userText: string, settings: UserSettings): Promise<{ correctedSentence?: string; correction?: string; explanation?: string }> {
    const model = settings.correctionModel || settings.aiModel || "gemini-3-flash-preview";
    const isGemma = model.toLowerCase().includes('gemma');
    const prompt = `Check the following text in ${settings.targetLanguage} for mistakes: "${userText}".
    If there are mistakes, provide a corrected version and a brief explanation in ${settings.nativeLanguage}.
    Return JSON: { "correctedSentence": "...", "correction": "...", "explanation": "..." }
    If no mistakes, return empty strings for these fields.`;

    const request: any = { model };
    if (isGemma) {
      request.contents = prompt;
    } else {
      request.contents = prompt;
      request.config = { responseMimeType: "application/json" };
    }

    const startTime = Date.now();
    const response = await this.ai.models.generateContent(request);
    const latency = Date.now() - startTime;
    const usage = response.usageMetadata?.totalTokenCount || 
                  Math.ceil((JSON.stringify(request).length + (response.text?.length || 0)) / 4);
    this.trackUsage(usage, request, latency);
    return this.parseJson(response.text || "");
  }

  async getDetailedExplanation(correction: string, original: string, corrected: string, settings: UserSettings): Promise<string> {
    const model = settings.aiModel || "gemini-3-flash-preview";
    const prompt = `Explain in detail the grammatical mistakes made in this sentence.
    Original: "${original}"
    Corrected: "${corrected}"
    Brief Correction: "${correction}"
    Explain clearly in ${settings.nativeLanguage} why these changes were made and what the grammar rules are.`;

    const request: any = { 
      model,
      contents: prompt
    };

    const startTime = Date.now();
    const response = await this.ai.models.generateContent(request);
    const latency = Date.now() - startTime;
    const usage = response.usageMetadata?.totalTokenCount || 
                  Math.ceil((JSON.stringify(request).length + (response.text?.length || 0)) / 4);
    this.trackUsage(usage, request, latency);
    return response.text || "Brak szczegółowego wyjaśnienia.";
  }

  async checkWriting(settings: UserSettings, text: string) {
    const model = settings.aiModel || "gemini-3-flash-preview";
    const isGemma = model.toLowerCase().includes('gemma');

    const prompt = `Check the following text in ${settings.targetLanguage}: "${text}". 
    Provide a correction and explanation for each sentence if needed.
    Return as JSON: { "sentences": [ { "original": "...", "corrected": "...", "explanation": "..." } ] }`;

    const request: any = { model };

    if (isGemma) {
      request.contents = prompt;
    } else {
      request.contents = prompt;
      request.config = {
        responseMimeType: "application/json"
      };
    }

    const startTime = Date.now();
    const response = await this.ai.models.generateContent(request);
    const latency = Date.now() - startTime;
    const usage = response.usageMetadata?.totalTokenCount || 
                  Math.ceil((JSON.stringify(request).length + (response.text?.length || 0)) / 4);
    this.trackUsage(usage, request, latency);

    return this.parseJson(response.text || "");
  }
}
