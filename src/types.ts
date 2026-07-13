export type Language = string;
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface SelectedTopic {
  title: string;
  levelInfo?: string[];
}

export interface UserSettings {
  name: string;
  avatar: string;
  showProfile: boolean;
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
  ankiFilterStatus: 'all' | 'learned' | 'learning' | 'reviewed';
  ankiCacheWords: boolean;
  aiModel: string;
  useParallelAI: boolean;
  translationModel: string;
  correctionModel: string;
  worldMemory: number;
  ankiAlgorithm: 'all' | 'interval' | 'reps' | 'learning' | 'review' | 'relearning';
  ankiSortField?: 'none' | 'lastReview' | 'interval' | 'reps' | 'word';
  ankiSortOrder?: 'asc' | 'desc';
  localModelPath: string | null;
  localModelSystemPrompt: string;
  useLocalLLM: boolean;
  restrictToKnownWords: boolean;
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
  id: string;
  role: 'user' | 'model';
  parts: { text: string }[];
  sentences?: ChatSentence[]; // For model responses
  correction?: string;
  correctedSentence?: string;
  explanation?: string;
  isPendingTranslation?: boolean;
  isPendingCorrection?: boolean;
  detailedExplanation?: string;
  usage?: { total_tokens: number; speed: number };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  isTitleEdited: boolean;
  mode: 'dialogue' | 'narrative';
}

export interface AnkiWord {
  word: string;
  fields: Record<string, string>;
  interval: number; // in days
  status: 'new' | 'learning' | 'review' | 'relearning';
  reps: number;
  lastReview?: number; // timestamp
}
