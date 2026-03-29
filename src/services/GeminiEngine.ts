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
      4. ${settings.ankiLimitToKnown && knownWords ? `ONLY use words from this list: ${knownWords.join(', ')}. If you must use a word outside, keep it extremely simple.` : ''}
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

  async generateTopic(settings: UserSettings) {
    const prompt = `Generate a creative writing topic for a ${settings.targetLanguage} learner at ${settings.cefrLevel} level. 
    Return JSON: { "topic": "Short Title", "description": "Detailed instructions in ${settings.nativeLanguage}" }`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  }

  async checkSentence(settings: UserSettings, text: string) {
    const prompt = `Check this text in ${settings.targetLanguage}: "${text}". 
    Is it grammatically correct for ${settings.cefrLevel} level? If there are multiple sentences, check all of them.
    Return JSON: { "isCorrect": boolean, "corrected": "Corrected version of the whole text", "explanation": "Brief explanation of errors in ${settings.nativeLanguage}" }`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  }

  async generateExercises(
    settings: UserSettings,
    topics: { title: string; levelInfo?: string[] }[],
    type: string,
    count: number
  ) {
    const topicsStr = topics.map(t => t.title).join(', ');
    const levelInfoStr = topics.map(t => t.levelInfo ? `${t.title}: ${t.levelInfo.join(', ')}` : '').filter(Boolean).join('\n');

    const prompt = `Generate ${count} exercises of type "${type}" for ${settings.targetLanguage} learners at ${settings.cefrLevel} level. 
    Focus on these grammar topics: ${topicsStr}.
    ${levelInfoStr ? `Specific points to cover for this level:\n${levelInfoStr}` : ''}
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

  async generateTheory(
    settings: UserSettings,
    topics: { title: string; levelInfo?: string[] }[]
  ) {
    const topicsStr = topics.map(t => t.title).join(', ');
    const levelInfoStr = topics.map(t => t.levelInfo ? `${t.title}: ${t.levelInfo.join(', ')}` : '').filter(Boolean).join('\n');

    const prompt = `Generate a comprehensive grammar theory guide in ${settings.nativeLanguage} for ${settings.targetLanguage} learners at ${settings.cefrLevel} level.
    Cover the following topics: ${topicsStr}.
    ${levelInfoStr ? `Ensure you cover these specific points for this level:\n${levelInfoStr}` : ''}
    
    Return as a JSON array of chapters. Each chapter should correspond to a topic or subtopic.
    Format:
    [
      {
        "title": "Chapter Title",
        "content": "Detailed explanation using Markdown formatting. Include examples in ${settings.targetLanguage} with translations in ${settings.nativeLanguage}."
      }
    ]`;

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
