import { GoogleGenAI } from "@google/genai";
import { UserSettings, Message } from "../types";

export class GeminiEngine {
  private ai: GoogleGenAI;
  private model: string = "gemini-3-flash-preview";

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async chat(
    history: Message[],
    userInput: string,
    settings: UserSettings,
    mode: 'dialogue' | 'narrative',
    knownWords?: string[]
  ): Promise<Message> {
    const vocabularyConstraint = settings.ankiLimitToKnown && knownWords && knownWords.length > 0
      ? `MANDATORY: Use ONLY words from this raw list: [${knownWords.join(', ')}]. Do not use any other words in ${settings.targetLanguage}. If you must use a word outside this list (like a preposition or extremely basic word), keep it to an absolute minimum.`
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
           "correction": "optional_correction_of_user_last_msg", 
           "explanation": "optional_explanation_of_correction" 
         }
      2. Split your response into logical sentences.
      3. If the user made a mistake in their last message, provide a correction and a brief explanation in ${settings.nativeLanguage}.
      4. ${vocabularyConstraint}
      5. Keep the conversation engaging.
    `;

    const contents = history.map(m => ({
      role: m.role,
      parts: [{ text: JSON.stringify(m) }]
    }));

    contents.push({ role: 'user', parts: [{ text: userInput }] });

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    try {
      const data = JSON.parse(response.text);
      const fullText = data.sentences.map((s: any) => s.text).join(' ');
      return {
        role: 'model',
        text: fullText,
        sentences: data.sentences,
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
      ? `The topic and description MUST encourage using ONLY these words: [${knownWords.join(', ')}].`
      : '';

    const prompt = `Generate a creative writing topic for a ${settings.targetLanguage} learner at ${settings.cefrLevel} level. 
    ${vocabularyConstraint}
    Return JSON: { "topic": "Short Title", "description": "Detailed instructions in ${settings.nativeLanguage}" }`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  }

  async checkSentence(settings: UserSettings, sentence: string) {
    const prompt = `Check this single sentence in ${settings.targetLanguage}: "${sentence}". 
    Is it grammatically correct for ${settings.cefrLevel} level?
    Return JSON: { "isCorrect": boolean, "corrected": "...", "explanation": "Brief explanation in ${settings.nativeLanguage}" }`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
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
      ? `MANDATORY: Use ONLY words from this raw list for the questions and answers: [${knownWords.join(', ')}]. Do not use any other words in ${settings.targetLanguage}.`
      : '';

    const prompt = `Generate ${count} exercises of type "${type}" for ${settings.targetLanguage} learners at ${settings.cefrLevel} level. 
    Focus on: ${grammarTopic}.
    ${levelInfo ? `Specific points to cover for this level: ${levelInfo.join(', ')}` : ''}
    ${vocabularyConstraint}
    Return as a JSON array of objects: { "question": "...", "answer": "...", "explanation": "..." }`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text);
  }

  async checkWriting(settings: UserSettings, text: string) {
    const prompt = `Check the following text in ${settings.targetLanguage}: "${text}". 
    Provide a correction and explanation for each sentence if needed.
    Return as JSON: { "sentences": [ { "original": "...", "corrected": "...", "explanation": "..." } ] }`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text);
  }
}
