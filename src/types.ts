export type Language = 'pl' | 'de' | 'es' | 'en';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface SelectedTopic {
  title: string;
  levelInfo?: string[];
}

export interface UserSettings {
  name: string;
  avatar: string;
  nativeLanguage: Language;
  targetLanguage: Language;
  cefrLevel: CEFRLevel;
  geminiApiKey: string;
  useAnki: boolean;
  useStudioKey: boolean; // For testing with environment key
  ankiLimitToKnown: boolean;
  ankiIntervalDays: number;
  ankiUrl: string;
  ankiDeckName: string;
  ankiFieldName: string;
  ankiFilterDays: number;
  ankiFilterStatus: 'all' | 'learned' | 'reviewed';
  aiModel: string;
}

export interface GrammarSubsection {
  id: string;
  title: string;
  exercisesCount?: number;
  subsections?: GrammarSubsection[];
  levelInfo?: Record<string, string[]>;
}

export interface GrammarSection {
  id: string;
  title: string;
  subsections: GrammarSubsection[];
}

export interface ChatSentence {
  text: string;
  translation: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string; // Full text for user, or combined for model
  sentences?: ChatSentence[]; // For model responses
  correction?: string;
  correctedSentence?: string;
  explanation?: string;
}

export interface AnkiWord {
  word: string;
  fields: Record<string, string>;
  interval: number; // in days
  status: 'new' | 'learning' | 'review' | 'relearning';
  reps: number;
  lastReview?: number; // timestamp
}
