/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  ChevronRight, 
  Settings as SettingsIcon, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  Gamepad2,
  Languages,
  BookOpen,
  User as UserIcon,
  Plus,
  Activity,
  Terminal,
  Cpu
} from 'lucide-react';
import { GlassCard, GlassButton } from './components/GlassUI';
import { BottomNav } from './components/BottomNav';
import { UserSettings, Message, AnkiWord, SelectedTopic, GrammarSubsection } from './types';
import { GeminiEngine } from './services/GeminiEngine';
import { AnkiService } from './services/AnkiService';

const DEFAULT_SETTINGS: UserSettings = {
  name: 'Użytkownik',
  avatar: 'https://picsum.photos/seed/user/200',
  showProfile: true,
  nativeLanguage: 'pl',
  targetLanguage: 'en',
  cefrLevel: 'B1',
  geminiApiKey: '',
  useAnki: false,
  useStudioKey: true,
  ankiLimitToKnown: false,
  ankiIntervalDays: 4,
  ankiUrl: 'http://localhost:8765',
  ankiDeckName: '',
  ankiFieldName: '',
  ankiFilterDays: 30,
  ankiFilterStatus: 'all',
  aiModel: 'gemini-3-flash-preview',
  useParallelAI: true,
  translationModel: 'gemini-3-flash-preview',
  correctionModel: 'gemini-3-flash-preview',
};

const ChatMessage: React.FC<{ 
  message: Message; 
  settings: UserSettings;
  onExplainMore?: (message: Message) => void;
}> = ({ message, settings, onExplainMore }) => {
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const isModel = message.role === 'model';

  return (
    <div className={`flex ${isModel ? 'justify-start' : 'justify-end'} w-full`}>
      <div className={`max-w-[85%] space-y-2`}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`
            p-4 rounded-2xl transition-all
            ${isModel 
              ? 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-tl-none' 
              : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none shadow-lg shadow-blue-500/20'}
          `}
        >
          {isModel && message.sentences ? (
            <div className="flex flex-wrap gap-x-1">
              {message.sentences.map((s, i) => (
                <span 
                  key={i}
                  onClick={() => setActiveSentenceIndex(activeSentenceIndex === i ? null : i)}
                  className={`
                    cursor-pointer rounded px-0.5 transition-all duration-300
                    ${activeSentenceIndex === i ? 'bg-blue-500/40 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'hover:bg-white/5'}
                  `}
                >
                  {s.text}
                </span>
              ))}
            </div>
          ) : isModel && message.isPendingTranslation ? (
            <div className="flex gap-1 items-center py-1">
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-[10px] text-white/40 ml-2 uppercase tracking-widest">Tłumaczenie...</span>
            </div>
          ) : (
            <p className="text-[15px] leading-relaxed font-medium">{message.text}</p>
          )}
          
          <AnimatePresence>
            {isModel && activeSentenceIndex !== null && message.sentences && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 pt-3 border-t border-white/10"
              >
                <p className="text-xs text-blue-300 font-bold mb-1 uppercase tracking-widest text-[8px]">Tłumaczenie frazy:</p>
                <p className="text-xs text-white/70 italic">{message.sentences[activeSentenceIndex].translation}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {isModel && (message.isPendingCorrection || message.correctedSentence || message.correction || message.explanation) && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-2"
          >
            {message.isPendingCorrection ? (
              <div className="flex items-center gap-2 text-amber-500/60">
                <RefreshCw size={12} className="animate-spin" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Sprawdzanie błędów...</span>
              </div>
            ) : (
              <>
                {message.correctedSentence && (
                  <div className="flex items-start gap-2 text-blue-300">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                    <p className="text-xs font-bold">Poprawione zdanie: <span className="font-normal italic text-white/90">{message.correctedSentence}</span></p>
                  </div>
                )}
                {message.correction && (
                  <div className="flex items-start gap-2 text-amber-200">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <p className="text-xs font-bold">Błędy: <span className="font-normal italic">{message.correction}</span></p>
                  </div>
                )}
                {message.explanation && (
                  <div className="flex items-start gap-2 text-white/60">
                    <div className="w-[14px] h-[14px] shrink-0" />
                    <p className="text-[10px] leading-relaxed">{message.explanation}</p>
                  </div>
                )}
                {(message.correction || message.explanation) && onExplainMore && (
                  <div className="pt-1 flex justify-end">
                    <button 
                      onClick={() => onExplainMore(message)}
                      className="text-[9px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest flex items-center gap-1"
                    >
                      Wyjaśnij jaśniej
                      <ChevronRight size={10} />
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('lingu_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState<'dialogue' | 'narrative'>('dialogue');
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [knownWords, setKnownWords] = useState<AnkiWord[]>([]);
  const [ankiApkgData, setAnkiApkgData] = useState<{
    decks: Record<string, { id: string, name: string }>,
    models: Record<string, { id: string, name: string, flds: {name: string}[] }>,
    db: any
  } | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const engine = useRef<GeminiEngine | null>(null);
  const anki = useRef(new AnkiService());

  const filteredWordsList = useMemo(() => {
    if (!knownWords.length) return [];
    
    return knownWords.map(word => {
      let displayWord = word.word || "";
      if (settings.ankiFieldName) {
        displayWord = word.fields[settings.ankiFieldName] || "";
        // If the selected field is empty, try to find the first non-empty field as fallback
        if (!displayWord || displayWord.trim().length === 0) {
          const firstNonEmpty = Object.values(word.fields).find(v => typeof v === 'string' && v.trim().length > 0) as string | undefined;
          displayWord = firstNonEmpty || "Empty";
        }
      }
      
      return {
        ...word,
        word: displayWord.trim()
      };
    }).filter(word => {
      // Filter out truly empty words if any
      const val = word.word;
      if (!val || val === "Empty" || val.trim().length === 0) return false;
      
      // Filter by status
      if (settings.ankiFilterStatus === 'learned' && word.status === 'new') return false;
      if (settings.ankiFilterStatus === 'reviewed' && word.status !== 'review') return false;
      
      // Filter by days since last review
      if (word.lastReview) {
        const diffDays = (Date.now() - word.lastReview) / (1000 * 60 * 60 * 24);
        if (diffDays > settings.ankiFilterDays) return false;
      }
      
      return true;
    });
  }, [knownWords, settings.ankiFieldName, settings.ankiFilterStatus, settings.ankiFilterDays]);

  // Auto-update fields and sync when deck changes
  useEffect(() => {
    if (!settings.ankiDeckName) return;

    const updateFieldsAndSync = async () => {
      if (ankiApkgData) {
        const deck = (Object.values(ankiApkgData.decks) as any[]).find(d => d.name === settings.ankiDeckName);
        if (deck) {
          try {
            const res = ankiApkgData.db.exec(`
              SELECT mid FROM notes n 
              JOIN cards c ON n.id = c.nid 
              WHERE c.did = ${deck.id} 
              LIMIT 1
            `);
            if (res.length > 0) {
              const mid = res[0].values[0][0];
              const model = ankiApkgData.models[mid];
              if (model && model.flds) {
                const fields = model.flds.map((f: any) => f.name);
                setAvailableFields(fields);
                // If current field is not in the new deck, reset to first field
                if (!fields.includes(settings.ankiFieldName)) {
                  setSettings(prev => ({ ...prev, ankiFieldName: fields[0] }));
                }
              }
            }
          } catch (e) {
            console.error("Error updating fields for deck:", e);
          }
        }
      } else if (settings.ankiUrl) {
        // For AnkiConnect, we also want to update fields when deck changes
        try {
          const structure = await anki.current.getDeckStructure(settings.ankiUrl, settings.ankiDeckName);
          setAvailableFields(structure.fields);
          if (!structure.fields.includes(settings.ankiFieldName)) {
            setSettings(prev => ({ ...prev, ankiFieldName: structure.fields[0] }));
          }
        } catch (e) {
          console.error("Error fetching deck structure:", e);
        }
      }
      
      // Trigger sync to get words for the new deck
      syncAnki();
    };

    updateFieldsAndSync();
  }, [settings.ankiDeckName, ankiApkgData]);

  // Also sync when field name changes
  useEffect(() => {
    if (settings.ankiDeckName && settings.ankiFieldName) {
      syncAnki();
    }
  }, [settings.ankiFieldName]);

  const [writingText, setWritingText] = useState('');
  const [writingTopicOptions, setWritingTopicOptions] = useState<{topic: string, description: string}[]>([]);
  const [writingTopic, setWritingTopic] = useState<{topic: string, description: string} | null>(null);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [lastCheckedSentence, setLastCheckedSentence] = useState('');
  const [writingSentenceFeedback, setWritingSentenceFeedback] = useState<any>(null);
  const [isCheckingSentence, setIsCheckingSentence] = useState(false);
  
  const [activeExercise, setActiveExercise] = useState<any>(null);
  const [exerciseList, setExerciseList] = useState<any[]>([]);
  const [isGeneratingExercises, setIsGeneratingExercises] = useState(false);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [exerciseFeedback, setExerciseFeedback] = useState<any>(null);
  const [exerciseConfig, setExerciseConfig] = useState<{
    topic: string;
    type: string;
    count: number;
    levelInfo?: string[];
  }>({ topic: '', type: 'fill in the blank', count: 5 });

  const [ankiLogs, setAnkiLogs] = useState<string[]>([]);
  const [isSyncingAnki, setIsSyncingAnki] = useState(false);
  const [availableDecks, setAvailableDecks] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [customTopics, setCustomTopics] = useState<string[]>(() => {
    const saved = localStorage.getItem('lingu_custom_topics');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedTopics, setSelectedTopics] = useState<SelectedTopic[]>([]);
  useEffect(() => {
    localStorage.setItem('lingu_custom_topics', JSON.stringify(customTopics));
  }, [customTopics]);

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showAnkiBrowser, setShowAnkiBrowser] = useState(false);
  const [ankiSearchQuery, setAnkiSearchQuery] = useState('');
  const [activeExplanation, setActiveExplanation] = useState<{
    message: Message;
    explanation: string;
    isLoading: boolean;
  } | null>(null);
  const [tokenStats, setTokenStats] = useState({ total: 0, tpm: 0 });

  const [customCode, setCustomCode] = useState(`// Możesz używać: ankiData, settings, knownWords
// Przykład: return ankiData ? Object.keys(ankiData.decks) : 'Brak danych APKG';

const response = await fetch('http://localhost:8765', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'deckNames',
    version: 6
  })
});
const data = await response.json();
return { ankiConnect: data, localKnownWords: knownWords.length };`);
  const [customCodeOutput, setCustomCodeOutput] = useState('');

  const runCustomCode = async () => {
    try {
      setCustomCodeOutput('Uruchamianie...');
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction('ankiData', 'settings', 'knownWords', customCode);
      const result = await fn(ankiApkgData, settings, knownWords);
      setCustomCodeOutput(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
    } catch (err) {
      setCustomCodeOutput(err instanceof Error ? err.toString() : String(err));
    }
  };

  const handleToggleTopic = (item: GrammarSubsection) => {
    setSelectedTopics(prev => {
      const exists = prev.some(t => t.title === item.title);
      if (exists) {
        return prev.filter(t => t.title !== item.title);
      } else {
        return [...prev, { title: item.title, levelInfo: item.levelInfo?.[settings.cefrLevel] }];
      }
    });
  };

  const getContextSizeInfo = () => {
    if (!settings.ankiLimitToKnown || filteredWordsList.length === 0) return null;
    const wordsString = filteredWordsList.map(w => w.word).join(',');
    const charCount = wordsString.length;
    const approxTokens = Math.ceil(charCount / 4);
    return { charCount, approxTokens };
  };

  const contextInfo = getContextSizeInfo();

  useEffect(() => {
    const interval = setInterval(() => {
      if (engine.current) {
        const usage = engine.current.usage;
        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;
        const recentTokens = usage.history
          .filter(h => h.timestamp > oneMinuteAgo)
          .reduce((sum, h) => sum + h.tokens, 0);
        
        setTokenStats({
          total: usage.totalTokens,
          tpm: recentTokens
        });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (msg: string) => {
    setAnkiLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  useEffect(() => {
    localStorage.setItem('lingu_settings', JSON.stringify(settings));
    const key = settings.useStudioKey ? process.env.GEMINI_API_KEY : settings.geminiApiKey;
    if (key) {
      engine.current = new GeminiEngine(key);
    }
  }, [settings]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !engine.current) return;

    const userMsgId = Date.now().toString();
    const userMsg: Message = { id: userMsgId, role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      if (settings.useParallelAI) {
        const aiMsgId = (Date.now() + 1).toString();
        
        // 1. Start Correction and Base Response in PARALLEL
        const correctionPromise = engine.current.getCorrection(inputText, settings);
        const baseResponsePromise = engine.current.getBaseResponse(messages, inputText, settings, chatMode);

        // Add placeholder message immediately to show progress
        const placeholderMsg: Message = {
          id: aiMsgId,
          role: 'model',
          text: '',
          isPendingTranslation: true,
          isPendingCorrection: true
        };
        setMessages(prev => [...prev, placeholderMsg]);
        setIsTyping(false);

        // Handle Correction as soon as it arrives
        correctionPromise.then(correctionData => {
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, ...correctionData, isPendingCorrection: false } : m));
        }).catch(() => {
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isPendingCorrection: false } : m));
        });

        // Handle Base Response, then trigger Translation
        baseResponsePromise.then(async (aiText) => {
          // Update message with the actual text
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: aiText } : m));
          
          // Now start Translation (needs aiText)
          try {
            const sentences = await engine.current!.getTranslation(aiText, settings);
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, sentences, isPendingTranslation: false } : m));
          } catch {
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isPendingTranslation: false } : m));
          }
        }).catch((err) => {
          console.error(err);
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: "Błąd generowania odpowiedzi.", isPendingTranslation: false, isPendingCorrection: false } : m));
        });

      } else {
        const response = await engine.current.chat(
          messages, 
          inputText, 
          settings, 
          chatMode,
          settings.ankiLimitToKnown ? filteredWordsList.map(w => w.word) : undefined
        );
        const aiMsg = { ...response, id: Date.now().toString() };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      }
    } catch (error) {
      console.error(error);
      setIsTyping(false);
    }
  };

  const handleExplainMore = async (message: Message) => {
    if (!engine.current || !message.correction) return;
    
    if (message.detailedExplanation) {
      setActiveExplanation({
        message,
        explanation: message.detailedExplanation,
        isLoading: false
      });
      setShowExplanationModal(true);
      return;
    }

    setActiveExplanation({
      message,
      explanation: '',
      isLoading: true
    });
    setShowExplanationModal(true);

    try {
      const detailed = await engine.current.getDetailedExplanation(
        message.correction,
        messages.find(m => m.id === (parseInt(message.id) - 1).toString())?.text || '',
        message.correctedSentence || '',
        settings
      );
      
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, detailedExplanation: detailed } : m));
      setActiveExplanation(prev => prev ? { ...prev, explanation: detailed, isLoading: false } : null);
    } catch (e) {
      setActiveExplanation(prev => prev ? { ...prev, explanation: 'Błąd podczas pobierania wyjaśnienia.', isLoading: false } : null);
    }
  };

  const handleWritingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setWritingText(val);

    // Check for sentence completion (dot)
    if (val.endsWith('.') && val !== lastCheckedSentence) {
      const sentences = val.split(/[.!?]/).filter(s => s.trim().length > 0);
      const lastSentence = sentences[sentences.length - 1];
      if (lastSentence && lastSentence !== lastCheckedSentence) {
        checkSentence(lastSentence);
      }
    }
  };

  const checkSentence = async (sentence: string) => {
    if (!engine.current) return;
    setIsCheckingSentence(true);
    setLastCheckedSentence(sentence);
    try {
      const feedback = await engine.current.checkSentence(settings, sentence);
      if (!feedback.isCorrect) {
        setWritingSentenceFeedback(feedback);
      } else {
        setWritingSentenceFeedback(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingSentence(false);
    }
  };

  const generateNewTopic = async () => {
    if (!engine.current) return;
    setIsGeneratingTopic(true);
    try {
      const topics = await engine.current.generateTopic(
        settings,
        settings.ankiLimitToKnown ? filteredWordsList.map(w => w.word) : undefined
      );
      setWritingTopicOptions(topics);
      setWritingTopic(null);
      setWritingText('');
      setWritingSentenceFeedback(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  const startExercises = async () => {
    const topics = selectedTopics.length > 0 
      ? selectedTopics.map(t => t.title).join(', ') 
      : exerciseConfig.topic;

    if (!engine.current || !topics) return;
    setIsGeneratingExercises(true);
    setActiveExercise(true);
    try {
      const combinedLevelInfo = selectedTopics.length > 0
        ? selectedTopics.flatMap(t => t.levelInfo || [])
        : exerciseConfig.levelInfo;

      const exercises = await engine.current.generateExercises(
        settings, 
        topics, 
        exerciseConfig.type, 
        exerciseConfig.count,
        combinedLevelInfo,
        settings.ankiLimitToKnown ? filteredWordsList.map(w => w.word) : undefined
      );
      setExerciseList(exercises);
      setExerciseIndex(0);
      setExerciseFeedback(null);
      setUserAnswer('');
    } catch (error) {
      console.error(error);
      setActiveExercise(null);
    } finally {
      setIsGeneratingExercises(false);
    }
  };

  const checkExercise = () => {
    const current = exerciseList[exerciseIndex];
    const isCorrect = userAnswer.toLowerCase().trim() === current.answer.toLowerCase().trim();
    setExerciseFeedback({
      isCorrect,
      correctAnswer: current.answer,
      explanation: current.explanation
    });
  };

  const nextExercise = () => {
    if (exerciseIndex < exerciseList.length - 1) {
      setExerciseIndex(prev => prev + 1);
      setUserAnswer('');
      setExerciseFeedback(null);
    } else {
      setActiveExercise(null);
      setExerciseList([]);
    }
  };

  const syncAnki = async () => {
    setIsSyncingAnki(true);
    
    if (ankiApkgData) {
      addLog(`Synchronizacja z zaimportowanego pliku .apkg...`);
      try {
        const deck = (Object.values(ankiApkgData.decks) as any[]).find(d => d.name === settings.ankiDeckName);
        if (!deck) throw new Error(`Nie znaleziono deku: ${settings.ankiDeckName}`);
        
        const words = await anki.current.getWordsFromDb(
          ankiApkgData.db,
          deck.id,
          settings.ankiFieldName,
          settings.ankiFilterDays,
          settings.ankiFilterStatus
        );
        setKnownWords(words);
        addLog(`Pobrano ${words.length} słów z pliku .apkg.`);
      } catch (e) {
        addLog(`Błąd synchronizacji z .apkg: ${e instanceof Error ? e.message : 'Nieznany błąd'}`);
      } finally {
        setIsSyncingAnki(false);
      }
      return;
    }

    addLog(`Rozpoczynanie synchronizacji z ${settings.ankiUrl}...`);
    try {
      const connected = await anki.current.checkConnection(settings.ankiUrl);
      if (connected) {
        addLog("Połączono pomyślnie z AnkiConnect.");
        const decks = await anki.current.getDeckNames(settings.ankiUrl);
        setAvailableDecks(decks);
        addLog(`Znaleziono deki: ${decks.join(', ')}`);
        
        const targetDeck = settings.ankiDeckName || decks[0];
        if (targetDeck) {
          addLog(`Pobieranie struktury deku: ${targetDeck}...`);
          const structure = await anki.current.getDeckStructure(settings.ankiUrl, targetDeck);
          setAvailableFields(structure.fields);
          
          let targetField = settings.ankiFieldName;
          if (!targetField || !structure.fields.includes(targetField)) {
            targetField = structure.fields[0];
            setSettings(prev => ({ ...prev, ankiFieldName: targetField }));
          }

          addLog(`Pobieranie słów z deku: ${targetDeck} (kolumna: ${targetField}, filtr: ${settings.ankiFilterStatus}, dni: ${settings.ankiFilterDays})...`);
          const words = await anki.current.getWordsFromDeck(
            settings.ankiUrl, 
            targetDeck, 
            targetField,
            settings.ankiFilterDays,
            settings.ankiFilterStatus
          );
          setKnownWords(words);
          
          addLog(`Pobrano ${words.length} słów z deku ${targetDeck}.`);
          if (!settings.ankiDeckName) {
            setSettings(prev => ({ ...prev, ankiDeckName: targetDeck }));
          }
        }
      }
    } catch (e) {
      addLog(`Błąd: ${e instanceof Error ? e.message : 'Nieznany błąd'}`);
    } finally {
      setIsSyncingAnki(false);
    }
  };

  const handleApkgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncingAnki(true);
    addLog(`Importowanie pliku .apkg: ${file.name}...`);
    try {
      const data = await anki.current.parseApkg(file);
      setAnkiApkgData(data);
      
      const deckNames = (Object.values(data.decks) as any[]).map(d => d.name);
      setAvailableDecks(deckNames);
      addLog(`Zaimportowano pomyślnie. Znaleziono deki: ${deckNames.join(', ')}`);
      
      const firstDeck = (Object.values(data.decks) as any[])[0];
      if (firstDeck) {
        setSettings(prev => ({ ...prev, ankiDeckName: firstDeck.name }));
        const firstModel = (Object.values(data.models) as any[])[0];
        if (firstModel) {
          const fields = (firstModel.flds as any[]).map(f => f.name);
          setAvailableFields(fields);
          setSettings(prev => ({ ...prev, ankiFieldName: fields[0] }));
        }
      }
    } catch (e) {
      addLog(`Błąd importu .apkg: ${e instanceof Error ? e.message : 'Nieznany błąd'}`);
    } finally {
      setIsSyncingAnki(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-500/10 blur-[100px] rounded-full" />
      </div>

      <main className="flex-1 relative z-10 overflow-hidden pt-6 px-4 sm:px-6 flex flex-col">
        <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col min-h-0"
              >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    LinguAnki
                  </h1>
                  <p className="text-white/40 text-sm font-medium uppercase tracking-widest">
                    {chatMode === 'dialogue' ? 'Tryb Dialogu' : 'Tryb Narracji'}
                  </p>
                </div>
                <GlassButton 
                  variant="secondary" 
                  className="p-3 rounded-full"
                  onClick={() => setShowChatOptions(!showChatOptions)}
                >
                  <SettingsIcon size={20} />
                </GlassButton>
              </div>

              <AnimatePresence>
                {showChatOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden shrink-0"
                  >
                    <GlassCard className="p-2">
                      <div className="flex flex-row gap-2 justify-center items-center w-full">
                        <button 
                          onClick={() => setChatMode('dialogue')}
                          className={`flex-1 p-3 rounded-2xl border transition-all flex flex-col items-center justify-center ${chatMode === 'dialogue' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'border-transparent hover:bg-white/5 text-white/60'}`}
                        >
                          <MessageSquare className="mb-1" size={20} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Dialog</span>
                        </button>
                        <button 
                          onClick={() => setChatMode('narrative')}
                          className={`flex-1 p-3 rounded-2xl border transition-all flex flex-col items-center justify-center ${chatMode === 'narrative' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'border-transparent hover:bg-white/5 text-white/60'}`}
                        >
                          <Gamepad2 className="mb-1" size={20} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Narracja</span>
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <Languages size={48} />
                    <p>Rozpocznij naukę pisząc wiadomość...</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <ChatMessage 
                    key={i} 
                    message={msg} 
                    settings={settings} 
                    onExplainMore={handleExplainMore}
                  />
                ))}
                {isTyping && (
                  <div className="flex gap-2 p-4 bg-white/5 rounded-2xl w-fit animate-pulse">
                    <div className="w-2 h-2 bg-white/40 rounded-full" />
                    <div className="w-2 h-2 bg-white/40 rounded-full" />
                    <div className="w-2 h-2 bg-white/40 rounded-full" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="mt-4 relative shrink-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Napisz coś..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 focus:outline-none focus:border-blue-500/50 backdrop-blur-xl transition-all"
                />
                <button
                  onClick={handleSendMessage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Send size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'writing' && (
            <motion.div
              key="writing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 flex-1 flex flex-col min-h-0"
            >
              <div className="flex justify-between items-center shrink-0">
                <h1 className="text-3xl font-bold">Tryb Pisania</h1>
                <GlassButton variant="secondary" onClick={generateNewTopic} disabled={isGeneratingTopic}>
                  {isGeneratingTopic ? <RefreshCw className="animate-spin" size={18} /> : 'Losuj tematy'}
                </GlassButton>
              </div>

              {!writingTopic && writingTopicOptions.length === 0 && (
                <GlassCard className="p-12 flex flex-col items-center justify-center text-center space-y-4 flex-1">
                  <BookOpen size={48} className="text-blue-400 opacity-50" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">Gotowy na pisanie?</h3>
                    <p className="text-white/60">Kliknij "Losuj tematy", aby otrzymać 3 propozycje dopasowane do Twojego poziomu.</p>
                  </div>
                  <GlassButton onClick={generateNewTopic} disabled={isGeneratingTopic} className="mt-4">
                    {isGeneratingTopic ? <RefreshCw className="animate-spin" size={18} /> : 'Losuj tematy'}
                  </GlassButton>
                </GlassCard>
              )}

              {!writingTopic && writingTopicOptions.length > 0 && (
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest px-2">Wybierz jeden z tematów:</h3>
                  <div className="grid gap-4 sm:grid-cols-1">
                    {writingTopicOptions.map((opt, i) => (
                      <GlassCard 
                        key={i} 
                        className="p-6 cursor-pointer hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95 flex flex-col"
                        onClick={() => setWritingTopic(opt)}
                      >
                        <h4 className="text-lg font-bold text-blue-400 mb-2">{opt.topic}</h4>
                        <p className="text-xs text-white/60 flex-1">{opt.description}</p>
                        <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-blue-400/50 flex items-center gap-1">
                          Wybierz <ChevronRight size={12} />
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}

              {writingTopic && (
                <GlassCard className="p-6 space-y-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start gap-4 shrink-0">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-blue-400">{writingTopic.topic}</h3>
                      <p className="text-sm text-white/60">{writingTopic.description}</p>
                    </div>
                    <button 
                      onClick={() => setWritingTopic(null)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white shrink-0"
                      title="Zmień temat"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  
                  <div className="relative flex-1 flex flex-col min-h-[200px]">
                    <textarea
                      value={writingText}
                      onChange={handleWritingChange}
                      className="w-full flex-1 bg-black/20 border border-white/10 rounded-2xl p-6 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                      placeholder="Zacznij pisać wypracowanie. Po każdej kropce AI sprawdzi Twoje zdanie..."
                    />
                    {isCheckingSentence && (
                      <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest">
                        <RefreshCw size={12} className="animate-spin" />
                        Sprawdzanie...
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {writingSentenceFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl shrink-0"
                      >
                        <div className="flex items-center gap-2 mb-2 text-amber-400">
                          <AlertCircle size={16} />
                          <span className="font-bold text-sm">Uwaga do ostatniego zdania:</span>
                        </div>
                        <p className="text-sm mb-1">Poprawnie: <span className="text-green-400">{writingSentenceFeedback.corrected}</span></p>
                        <p className="text-xs text-white/60">{writingSentenceFeedback.explanation}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              )}
            </motion.div>
          )}

          {activeTab === 'exercises' && (
            <motion.div
              key="exercises"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <h1 className="text-3xl font-bold mb-8 shrink-0">Ćwiczenia</h1>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {activeExercise ? (
                <div className="space-y-6">
                  <GlassButton variant="ghost" onClick={() => setActiveExercise(null)} className="mb-4">
                    ← Powrót do konfiguracji
                  </GlassButton>
                  
                  {isGeneratingExercises ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                      <RefreshCw size={48} className="animate-spin mb-4" />
                      <p>Generowanie zadań przez AI...</p>
                    </div>
                  ) : exerciseList.length > 0 ? (
                    <GlassCard className="p-8 space-y-8">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Zadanie {exerciseIndex + 1} z {exerciseList.length}</span>
                        <div className="h-1 w-32 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-500" 
                            style={{ width: `${((exerciseIndex + 1) / exerciseList.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-xl font-medium leading-relaxed">
                        {exerciseList[exerciseIndex].question}
                      </p>

                      <div className="space-y-4">
                        <input
                          type="text"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Twoja odpowiedź..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-blue-500/50"
                        />
                        {!exerciseFeedback ? (
                          <GlassButton onClick={checkExercise} className="w-full">Sprawdź</GlassButton>
                        ) : (
                          <div className="space-y-4">
                            <div className={`p-4 rounded-xl border ${exerciseFeedback.isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                {exerciseFeedback.isCorrect ? <CheckCircle2 className="text-green-400" /> : <AlertCircle className="text-red-400" />}
                                <span className="font-bold">{exerciseFeedback.isCorrect ? 'Dobrze!' : 'Błąd'}</span>
                              </div>
                              {!exerciseFeedback.isCorrect && (
                                <p className="text-sm mb-2">Poprawna odpowiedź: <span className="font-bold text-green-400">{exerciseFeedback.correctAnswer}</span></p>
                              )}
                              <p className="text-xs text-white/60">{exerciseFeedback.explanation}</p>
                            </div>
                            <GlassButton onClick={nextExercise} className="w-full">Dalej</GlassButton>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-6">
                  <GlassCard className="p-6 space-y-6">
                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Konfiguracja Ćwiczeń</h3>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60">Temat gramatyczny</label>
                      <input 
                        type="text"
                        value={exerciseConfig.topic}
                        onChange={(e) => setExerciseConfig({...exerciseConfig, topic: e.target.value})}
                        placeholder="np. Present Simple, Passive Voice..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-white/60">Typ zadania</label>
                        <select 
                          value={exerciseConfig.type}
                          onChange={(e) => setExerciseConfig({...exerciseConfig, type: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
                        >
                          <option value="fill in the blank">Luki</option>
                          <option value="sentence transformation">Transformacja</option>
                          <option value="translation">Tłumaczenie</option>
                          <option value="error correction">Poprawa błędów</option>
                          <option value="reorder sentence">Kolejność</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-white/60">Ilość zadań</label>
                        <input 
                          type="number"
                          value={exerciseConfig.count}
                          onChange={(e) => setExerciseConfig({...exerciseConfig, count: parseInt(e.target.value)})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
                        />
                      </div>
                    </div>

                    <GlassButton onClick={startExercises} className="w-full" disabled={!exerciseConfig.topic && selectedTopics.length === 0}>
                      Generuj ćwiczenia
                    </GlassButton>
                  </GlassCard>

                  <div className="grid gap-4">
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-widest px-2">Własne tematy</p>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          id="new-topic-input"
                          placeholder="Dodaj własny temat..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500/50 text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val && !customTopics.includes(val)) {
                                setCustomTopics([...customTopics, val]);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <GlassButton 
                          onClick={() => {
                            const input = document.getElementById('new-topic-input') as HTMLInputElement;
                            const val = input.value.trim();
                            if (val && !customTopics.includes(val)) {
                              setCustomTopics([...customTopics, val]);
                              input.value = '';
                            }
                          }}
                          className="px-4"
                        >
                          <Plus size={20} />
                        </GlassButton>
                      </div>
                      
                      {customTopics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {customTopics.map((topic, i) => {
                            const isSelected = selectedTopics.some(t => t.title === topic);
                            return (
                              <div key={i} className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedTopics(selectedTopics.filter(t => t.title !== topic));
                                    } else {
                                      setSelectedTopics([...selectedTopics, { title: topic }]);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${isSelected ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                                >
                                  {topic}
                                </button>
                                <button
                                  onClick={() => {
                                    setCustomTopics(customTopics.filter(t => t !== topic));
                                    setSelectedTopics(selectedTopics.filter(t => t.title !== topic));
                                  }}
                                  className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/10 transition-all"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pb-10 pr-2 min-h-0"
            >
              <div className="flex items-center gap-6 mb-8 shrink-0">
                <div className="relative group">
                  <img src={settings.avatar} className="w-24 h-24 rounded-[2rem] border-2 border-blue-500/50 p-1 object-cover" alt="Avatar" />
                </div>
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" 
                    value={settings.name}
                    onChange={(e) => setSettings({...settings, name: e.target.value})}
                    className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-white/20 focus:border-blue-500 focus:outline-none w-full"
                    placeholder="Twoje imię"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Poziom:</span>
                    <select 
                      value={settings.cefrLevel}
                      onChange={(e) => setSettings({...settings, cefrLevel: e.target.value as any})}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none"
                    >
                      {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <details className="group bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden transition-all" open>
                <summary className="p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <User size={20} className="text-blue-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Profil</h3>
                  </div>
                  <ChevronRight size={20} className="text-white/40 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="p-6 pt-0 space-y-2 border-t border-white/5 mt-2">
                  <label className="text-xs font-medium text-white/60">URL Avatara</label>
                  <input 
                    type="text"
                    value={settings.avatar}
                    onChange={(e) => setSettings({...settings, avatar: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500/50 text-xs"
                    placeholder="https://..."
                  />
                </div>
              </details>

              <details className="group bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden transition-all" open>
                <summary className="p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <BookOpen size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Ustawienia Językowe</h3>
                  </div>
                  <ChevronRight size={20} className="text-white/40 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="p-6 pt-0 space-y-6 border-t border-white/5 mt-2">
                  <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60">Native</label>
                    <select 
                      value={settings.nativeLanguage}
                      onChange={(e) => setSettings({...settings, nativeLanguage: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
                    >
                      <option value="pl">Polski</option>
                      <option value="en">Angielski</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60">Target</label>
                    <select 
                      value={settings.targetLanguage}
                      onChange={(e) => setSettings({...settings, targetLanguage: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
                    >
                      <option value="en">Angielski</option>
                      <option value="de">Niemiecki</option>
                      <option value="es">Hiszpański</option>
                    </select>
                  </div>
                </div>
                </div>
              </details>

              <details className="group bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden transition-all">
                <summary className="p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Cpu size={20} className="text-blue-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Model AI (Zaawansowane)</h3>
                  </div>
                  <ChevronRight size={20} className="text-white/40 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="p-6 pt-0 space-y-6 border-t border-white/5 mt-2">
                  <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-sm text-white/60 block">Równoległe zapytania AI</span>
                      <p className="text-[10px] text-white/40 italic">Osobne modele dla odpowiedzi, tłumaczenia i poprawek</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={settings.useParallelAI}
                      onChange={(e) => setSettings({...settings, useParallelAI: e.target.checked})}
                      className="w-5 h-5 accent-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60">Główny model (Odpowiedź)</label>
                    <select 
                      value={['gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemma-2-27b-it'].includes(settings.aiModel) ? settings.aiModel : 'custom'}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setSettings({...settings, aiModel: ''});
                        } else {
                          setSettings({...settings, aiModel: e.target.value});
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
                    >
                      <option value="gemini-3-flash-preview">Gemini 3 Flash (Default)</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                      <option value="gemma-2-27b-it">Gemma 2 27B</option>
                      <option value="custom">Własny model / Inny...</option>
                    </select>
                  </div>
                  {(!['gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemma-2-27b-it'].includes(settings.aiModel) || settings.aiModel === 'custom') && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60">Nazwa głównego modelu</label>
                      <input 
                        type="text"
                        value={settings.aiModel}
                        onChange={(e) => setSettings({...settings, aiModel: e.target.value})}
                        placeholder="np. gemini-1.5-pro-latest"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500/50"
                      />
                    </div>
                  )}

                  {settings.useParallelAI && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-white/60">Model do tłumaczeń</label>
                        <select 
                          value={['gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemma-2-27b-it'].includes(settings.translationModel) ? settings.translationModel : 'custom'}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setSettings({...settings, translationModel: ''});
                            } else {
                              setSettings({...settings, translationModel: e.target.value});
                            }
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
                        >
                          <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                          <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                          <option value="gemma-2-27b-it">Gemma 2 27B</option>
                          <option value="custom">Własny model / Inny...</option>
                        </select>
                      </div>
                      {(!['gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemma-2-27b-it'].includes(settings.translationModel) || settings.translationModel === 'custom') && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-white/60">Nazwa modelu do tłumaczeń</label>
                          <input 
                            type="text"
                            value={settings.translationModel}
                            onChange={(e) => setSettings({...settings, translationModel: e.target.value})}
                            placeholder="np. gemini-1.5-flash"
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500/50"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-white/60">Model do poprawek</label>
                        <select 
                          value={['gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemma-2-27b-it'].includes(settings.correctionModel) ? settings.correctionModel : 'custom'}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setSettings({...settings, correctionModel: ''});
                            } else {
                              setSettings({...settings, correctionModel: e.target.value});
                            }
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
                        >
                          <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                          <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                          <option value="gemma-2-27b-it">Gemma 2 27B</option>
                          <option value="custom">Własny model / Inny...</option>
                        </select>
                      </div>
                      {(!['gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemma-2-27b-it'].includes(settings.correctionModel) || settings.correctionModel === 'custom') && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-white/60">Nazwa modelu do poprawek</label>
                          <input 
                            type="text"
                            value={settings.correctionModel}
                            onChange={(e) => setSettings({...settings, correctionModel: e.target.value})}
                            placeholder="np. gemini-1.5-pro"
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500/50"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                </div>
              </details>

              <details className="group bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden transition-all" open>
                <summary className="p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <RefreshCw size={20} className="text-amber-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Integracja Anki</h3>
                  </div>
                  <ChevronRight size={20} className="text-white/40 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="p-6 pt-0 space-y-6 border-t border-white/5 mt-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60">Importuj plik .apkg (opcjonalnie)</label>
                    <div className="flex gap-2">
                      <input 
                        type="file"
                        accept=".apkg"
                        onChange={handleApkgUpload}
                        className="hidden"
                        id="apkg-upload"
                      />
                      <label 
                        htmlFor="apkg-upload"
                        className="flex-1 bg-white/5 border border-dashed border-white/20 rounded-xl p-3 text-center cursor-pointer hover:bg-white/10 transition-all text-xs text-white/40"
                      >
                        {ankiApkgData ? `Załadowano: ${Object.keys(ankiApkgData.decks).length} deki` : "Kliknij, aby wybrać plik .apkg"}
                      </label>
                      {ankiApkgData && (
                        <button 
                          onClick={() => {
                            setAnkiApkgData(null);
                            setAvailableDecks([]);
                            setAvailableFields([]);
                            addLog("Wyczyszczono dane z pliku .apkg.");
                          }}
                          className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"
                        >
                          <RefreshCw size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {!ankiApkgData && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60">Adres URL AnkiConnect</label>
                      <input 
                        type="text"
                        value={settings.ankiUrl}
                        onChange={(e) => setSettings({...settings, ankiUrl: e.target.value})}
                        placeholder="http://localhost:8765"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500/50 text-sm"
                      />
                      <p className="text-[10px] text-white/40">Domyślnie: http://localhost:8765 (PC) lub http://localhost:8080 (Android)</p>
                    </div>
                  )}

                  {availableDecks.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-white/60">Wybierz talię (Deck)</label>
                        <select 
                          value={settings.ankiDeckName}
                          onChange={(e) => setSettings({...settings, ankiDeckName: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none text-sm"
                        >
                          {availableDecks.map(deck => (
                            <option key={deck} value={deck}>{deck}</option>
                          ))}
                        </select>
                      </div>
                      {availableFields.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-white/60">Kolumna słówek</label>
                          <select 
                            value={settings.ankiFieldName}
                            onChange={(e) => setSettings({...settings, ankiFieldName: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none text-sm"
                          >
                            {availableFields.map(field => (
                              <option key={field} value={field}>{field}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {filteredWordsList.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60">Podgląd słówek ({filteredWordsList.length})</label>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-black/20 rounded-xl border border-white/5">
                        {filteredWordsList.slice(0, 50).map((w, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded-md text-white/60 border border-white/5">
                            {w.word}
                          </span>
                        ))}
                        {filteredWordsList.length > 50 && <span className="text-[9px] text-white/30">... i {filteredWordsList.length - 50} więcej</span>}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60">Status słówek</label>
                      <select 
                        value={settings.ankiFilterStatus}
                        onChange={(e) => setSettings({...settings, ankiFilterStatus: e.target.value as any})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none text-sm"
                      >
                        <option value="all">Wszystkie</option>
                        <option value="learned">Uczone (Learning+)</option>
                        <option value="reviewed">Powtórzone (Review)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60">Ostatnio widziane (dni)</label>
                      <input 
                        type="range"
                        min="1"
                        max="365"
                        value={settings.ankiFilterDays}
                        onChange={(e) => setSettings({...settings, ankiFilterDays: parseInt(e.target.value)})}
                        className="w-full accent-blue-500"
                      />
                      <div className="flex justify-between text-[10px] text-white/40">
                        <span>1d</span>
                        <span>{settings.ankiFilterDays}d</span>
                        <span>365d</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <RefreshCw size={20} className={`text-blue-400 ${isSyncingAnki ? 'animate-spin' : ''}`} />
                      <span className="font-medium">Synchronizacja Anki</span>
                    </div>
                    {knownWords.length > 0 && (
                      <span className="text-[10px] text-green-400 mt-1">
                        Pobrano {knownWords.length} słów ({filteredWordsList.length} po filtrze)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAnkiBrowser(true)}
                      disabled={filteredWordsList.length === 0}
                      className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-500/30 transition-all disabled:opacity-50"
                    >
                      Przeglądaj słówka
                    </button>
                    <button 
                      onClick={syncAnki}
                      disabled={isSyncingAnki}
                      className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-500/30 transition-all disabled:opacity-50"
                    >
                      {isSyncingAnki ? 'Sync...' : 'Synchronizuj'}
                    </button>
                  </div>
                </div>
                
                <div className="bg-black/20 rounded-xl p-3 h-32 overflow-y-auto custom-scrollbar font-mono text-[10px] text-white/60 space-y-2 break-words">
                  {ankiLogs.length === 0 ? (
                    <p className="italic text-white/40">Brak logów. Kliknij synchronizuj.</p>
                  ) : (
                    ankiLogs.map((log, i) => (
                      <p key={i} className={log.startsWith('Błąd') ? 'text-red-400 font-bold' : ''}>
                        {log}
                      </p>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm text-white/60 block">Ogranicz AI do znanych słów</span>
                    <p className="text-[10px] text-white/40 italic">AI będzie budować zdania wyłącznie z Twoich fiszek</p>
                    {contextInfo && (
                      <p className="text-[9px] text-blue-400 font-medium">
                        Kontekst: ~{contextInfo.approxTokens} tokenów ({contextInfo.charCount} znaków)
                      </p>
                    )}
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.ankiLimitToKnown}
                    onChange={(e) => setSettings({...settings, ankiLimitToKnown: e.target.checked})}
                    className="w-5 h-5 accent-blue-500"
                  />
                </div>
                </div>
              </details>

              <details className="group bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden transition-all">
                <summary className="p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <PenTool size={20} className="text-green-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Testowanie Skryptów (AnkiConnect / APKG)</h3>
                  </div>
                  <ChevronRight size={20} className="text-white/40 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="p-6 pt-0 space-y-4 border-t border-white/5 mt-2">
                  <p className="text-xs text-white/60">
                    Napisz własny skrypt JavaScript. Masz dostęp do <code>ankiData</code> (z pliku .apkg), <code>settings</code> oraz <code>knownWords</code>.
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCustomCode(`// Pobierz nazwy deków z pliku APKG
if (!ankiData) return 'Najpierw załaduj plik .apkg!';
return Object.values(ankiData.decks).map(d => d.name);`)}
                      className="text-[10px] px-2 py-1 bg-white/5 rounded border border-white/10 hover:bg-white/10"
                    >
                      Przykład APKG
                    </button>
                    <button 
                      onClick={() => setCustomCode(`// Sprawdź połączenie z AnkiConnect
const response = await fetch('http://localhost:8765', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'version', version: 6 })
});
return await response.json();`)}
                      className="text-[10px] px-2 py-1 bg-white/5 rounded border border-white/10 hover:bg-white/10"
                    >
                      Przykład AnkiConnect
                    </button>
                  </div>
                  <textarea
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-xs text-green-400 focus:outline-none focus:border-blue-500/50 transition-all resize-y"
                    spellCheck={false}
                  />
                  <div className="flex justify-end">
                    <GlassButton onClick={runCustomCode} className="px-6 py-2 text-xs">
                      Uruchom kod
                    </GlassButton>
                  </div>
                  {customCodeOutput && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Wynik:</span>
                      <pre className="w-full max-h-64 overflow-y-auto bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-[10px] text-white/80 whitespace-pre-wrap break-words custom-scrollbar">
                        {customCodeOutput}
                      </pre>
                    </div>
                  )}
                </div>
              </details>

              <details className="group bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden transition-all">
                <summary className="p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <Settings size={20} className="text-red-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Klucze API</h3>
                  </div>
                  <ChevronRight size={20} className="text-white/40 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="p-6 pt-0 space-y-6 border-t border-white/5 mt-2">
                  <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Użyj klucza AI Studio (Testy)</span>
                  <input 
                    type="checkbox" 
                    checked={settings.useStudioKey}
                    onChange={(e) => setSettings({...settings, useStudioKey: e.target.checked})}
                    className="w-5 h-5 accent-blue-500"
                  />
                </div>
                {!settings.useStudioKey && (
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={settings.geminiApiKey}
                      onChange={(e) => setSettings({...settings, geminiApiKey: e.target.value})}
                      placeholder="Wprowadź klucz API..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-blue-500/50"
                    />
                    <GlassButton 
                      onClick={async () => {
                        try {
                          const engine = new GeminiEngine(settings.geminiApiKey);
                          await engine.checkSentence(settings, "Hello");
                          alert("Klucz działa poprawnie!");
                        } catch (e) {
                          alert("Błąd: Klucz nie działa. Sprawdź czy jest poprawny.");
                        }
                      }}
                      className="w-full text-xs"
                    >
                      Testuj klucz
                    </GlassButton>
                  </div>
                )}

                <div className="pt-4 border-t border-white/5 flex gap-4">
                  <button 
                    onClick={() => setShowTokenModal(true)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-white/10 transition-all group"
                  >
                    <Activity size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Statystyki Tokenów & API</span>
                  </button>
                </div>
                </div>
              </details>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>

      {/* Detailed Explanation Modal */}
      <AnimatePresence>
        {showExplanationModal && activeExplanation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowExplanationModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <BookOpen size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Szczegółowe Wyjaśnienie</h2>
                    <p className="text-xs text-white/40">Analiza gramatyczna Twojego błędu</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowExplanationModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-1">Twoje zdanie:</span>
                    <p className="text-sm italic text-white/80">"{messages.find(m => m.id === (parseInt(activeExplanation.message.id) - 1).toString())?.text}"</p>
                  </div>
                  <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-2xl">
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider block mb-1">Poprawna wersja:</span>
                    <p className="text-sm font-bold text-white">"{activeExplanation.message.correctedSentence}"</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Analiza AI:</span>
                  {activeExplanation.isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                      <RefreshCw size={32} className="animate-spin text-blue-400" />
                      <p className="text-xs text-white/40 animate-pulse">Przygotowywanie głębokiej analizy...</p>
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed">
                      {activeExplanation.explanation.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end">
                <button 
                  onClick={() => setShowExplanationModal(false)}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  Rozumiem
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Token Usage Modal */}
      <AnimatePresence>
        {showTokenModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTokenModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Cpu size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Monitor Zużycia AI</h2>
                    <p className="text-xs text-white/40">Statystyki sesji i podgląd API</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowTokenModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <RefreshCw size={20} className="text-white/40" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Całkowite Tokeny</span>
                    <p className="text-3xl font-mono font-bold text-blue-400">{tokenStats.total.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Tokeny na Minutę (TPM)</span>
                    <p className="text-3xl font-mono font-bold text-green-400">{tokenStats.tpm.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white/40">
                    <Terminal size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Historia Zapytań (Sesja)</span>
                  </div>
                  <div className="space-y-2">
                    {engine.current?.usage.history && engine.current.usage.history.length > 0 ? (
                      [...engine.current.usage.history].reverse().map((h, i) => (
                        <details key={i} className="bg-black/40 border border-white/5 rounded-xl overflow-hidden group">
                          <summary className="p-3 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-white/40">{new Date(h.timestamp).toLocaleTimeString()}</span>
                              <span className="text-xs font-bold text-blue-400">{h.tokens} tokenów</span>
                              {h.latency && <span className="text-[10px] text-white/60">{h.latency}ms</span>}
                            </div>
                            <ChevronRight size={14} className="text-white/40 group-open:rotate-90 transition-transform" />
                          </summary>
                          <div className="p-4 border-t border-white/5 font-mono text-[10px] overflow-x-auto whitespace-pre custom-scrollbar text-blue-200/80 leading-relaxed">
                            {JSON.stringify(h.request, null, 2)}
                          </div>
                        </details>
                      ))
                    ) : (
                      <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-center">
                        <span className="italic text-white/20 text-xs">Brak wysłanych zapytań w tej sesji.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 items-start">
                  <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-200/70 leading-relaxed">
                    Dane o tokenach są szacunkowe (bazują na metadanych API lub długości tekstu). 
                    TPM jest liczony jako suma tokenów z ostatnich 60 sekund.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end">
                <button 
                  onClick={() => setShowTokenModal(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all"
                >
                  Zamknij
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anki Browser Modal */}
      <AnimatePresence>
        {showAnkiBrowser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowAnkiBrowser(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <BookOpen size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Przeglądarka Słówek Anki</h2>
                    <p className="text-xs text-white/40">Słówka z deku: {settings.ankiDeckName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAnkiBrowser(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
                <div className="mb-6 space-y-4 shrink-0">
                  <input
                    type="text"
                    value={ankiSearchQuery}
                    onChange={(e) => setAnkiSearchQuery(e.target.value)}
                    placeholder="Szukaj słówka..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                      Znaleziono: {filteredWordsList.filter(w => w.word.toLowerCase().includes(ankiSearchQuery.toLowerCase())).length} słówek
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pb-4">
                  {filteredWordsList
                    .filter(w => w.word.toLowerCase().includes(ankiSearchQuery.toLowerCase()))
                    .map((word, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2 hover:bg-white/10 transition-colors">
                      <span className="font-bold text-purple-400 text-lg">{word.word}</span>
                      <div className="text-[10px] text-white/40 space-y-1">
                        <p>Status: <span className="text-white/60">{word.status}</span></p>
                        {word.lastReview && (
                          <p>Ostatnia powtórka: <span className="text-white/60">{new Date(word.lastReview).toLocaleDateString()}</span></p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end">
                <button 
                  onClick={() => setShowAnkiBrowser(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all"
                >
                  Zamknij
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
