import { GoogleGenAI } from "@google/genai";
import { UserSettings, Message } from "../types";

export interface TokenUsage {
  totalTokens: number;
  lastRequest: any;
  history: { tokens: number; timestamp: number }[];
}

export class GeminiEngine {
  private ai: GoogleGenAI;
  public usage: TokenUsage = {
    totalTokens: 0,
    lastRequest: null,
    history: []
  };

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  private trackUsage(tokens: number, request: any) {
    this.usage.totalTokens += tokens;
    this.usage.lastRequest = request;
    this.usage.history.push({ tokens, timestamp: Date.now() });
    
    // Keep only last 60 minutes of history for TPM calculation
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.usage.history = this.usage.history.filter(h => h.timestamp > oneHourAgo);
  }

  async chat(
    history: Message[],
    userInput: string,
    settings: UserSettings,
    mode: 'dialogue' | 'narrative',
    knownWords?: string[]
  ): Promise<Message> {
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

    const contents = history.map(m => ({
      role: m.role,
      parts: [{ text: JSON.stringify(m) }]
    }));

    contents.push({ role: 'user', parts: [{ text: userInput }] });
    const model = settings.aiModel || "gemini-3-flash-preview";

    const request = {
      model,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    };

    const response = await this.ai.models.generateContent(request);

    // Estimate tokens if usageMetadata is missing
    const usage = response.usageMetadata?.totalTokenCount || 
                  Math.ceil((JSON.stringify(request).length + (response.text?.length || 0)) / 4);
    
    this.trackUsage(usage, request);

    try {
      const data = JSON.parse(response.text);
      const fullText = data.sentences.map((s: any) => s.text).join(' ');
      return {
        role: 'model',
        text: fullText,
        sentences: data.sentences,
        correctedSentence: data.correctedSentence,
        correction: data.correction,
        explanation: data.explanation
      };
    } catch (e) {
      return {
        role: 'model',
        text: response.text,
        sentences: [{ text: response.text, translation: "Error parsing" }]
      };
    }
  }

  async generateTopic(settings: UserSettings, knownWords?: string[]) {
    const vocabularyConstraint = settings.ankiLimitToKnown && knownWords && knownWords.length > 0
      ? `CRITICAL CONSTRAINT: The topic and description MUST encourage using ONLY these vocabulary words: ${knownWords.join(', ')}. You may use basic grammar words.`
      : '';

    const prompt = `Generate a creative writing topic for a ${settings.targetLanguage} learner at ${settings.cefrLevel} level. 
    ${vocabularyConstraint}
    Return JSON: { "topic": "Short Title", "description": "Detailed instructions in ${settings.nativeLanguage}" }`;

    const request = {
      model: settings.aiModel || "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    };

    const response = await this.ai.models.generateContent(request);
    const usage = response.usageMetadata?.totalTokenCount || 
                  Math.ceil((JSON.stringify(request).length + (response.text?.length || 0)) / 4);
    this.trackUsage(usage, request);
    return JSON.parse(response.text);
  }

  async checkSentence(settings: UserSettings, sentence: string) {
    const prompt = `Check this single sentence in ${settings.targetLanguage}: "${sentence}". 
    Is it grammatically correct for ${settings.cefrLevel} level?
    Return JSON: { "isCorrect": boolean, "corrected": "...", "explanation": "Brief explanation in ${settings.nativeLanguage}" }`;

    const request = {
      model: settings.aiModel || "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    };

    const response = await this.ai.models.generateContent(request);
    const usage = response.usageMetadata?.totalTokenCount || 
                  Math.ceil((JSON.stringify(request).length + (response.text?.length || 0)) / 4);
    this.trackUsage(usage, request);
    return JSON.parse(response.text);
  }

  async generateExercises(
    settings: UserSettings,
    grammarTopic: string,
    type: string,
    count: number,
    levelInfo?: string[],
    knownWords?: string[]
  ) {
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

    const request = {
      model: settings.aiModel || "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    };

    const response = await this.ai.models.generateContent(request);
    const usage = response.usageMetadata?.totalTokenCount || 
                  Math.ceil((JSON.stringify(request).length + (response.text?.length || 0)) / 4);
    this.trackUsage(usage, request);

    return JSON.parse(response.text);
  }

  async checkWriting(settings: UserSettings, text: string) {
    const prompt = `Check the following text in ${settings.targetLanguage}: "${text}". 
    Provide a correction and explanation for each sentence if needed.
    Return as JSON: { "sentences": [ { "original": "...", "corrected": "...", "explanation": "..." } ] }`;

    const request = {
      model: settings.aiModel || "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    };

    const response = await this.ai.models.generateContent(request);
    const usage = response.usageMetadata?.totalTokenCount || 
                  Math.ceil((JSON.stringify(request).length + (response.text?.length || 0)) / 4);
    this.trackUsage(usage, request);

    return JSON.parse(response.text);
  }
}
