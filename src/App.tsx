/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Plus
} from 'lucide-react';
import { GlassCard, GlassButton } from './components/GlassUI';
import { BottomNav } from './components/BottomNav';
import { UserSettings, Message, AnkiWord } from './types';
import { GeminiEngine } from './services/GeminiEngine';
import { AnkiService } from './services/AnkiService';
import { GrammarTree } from './components/GrammarTree';
import { GERMAN_GRAMMAR, SPANISH_GRAMMAR, ENGLISH_GRAMMAR } from './data/grammar';

const DEFAULT_SETTINGS: UserSettings = {
  name: 'Użytkownik',
  avatar: 'https://picsum.photos/seed/user/200',
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
};

const ChatMessage: React.FC<{ message: Message; settings: UserSettings }> = ({ message, settings }) => {
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

        {isModel && (message.correction || message.explanation) && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-2"
          >
            {message.correction && (
              <div className="flex items-start gap-2 text-amber-200">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p className="text-xs font-bold">Poprawka: <span className="font-normal italic">{message.correction}</span></p>
              </div>
            )}
            {message.explanation && (
              <div className="flex items-start gap-2 text-white/60">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                <p className="text-[10px] leading-relaxed">{message.explanation}</p>
              </div>
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
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const engine = useRef<GeminiEngine | null>(null);
  const anki = useRef(new AnkiService());

  const [writingText, setWritingText] = useState('');
  const [writingTopic, setWritingTopic] = useState({ topic: 'Wybierz temat', description: 'Kliknij przycisk poniżej, aby wylosować temat.' });
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

  const getFilteredWords = () => {
    if (!knownWords.length) return [];
    
    return knownWords.map(word => ({
      ...word,
      word: settings.ankiFieldName ? (word.fields[settings.ankiFieldName] || word.word) : word.word
    })).filter(word => {
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
  };

  const filteredWordsList = getFilteredWords();

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

    const userMsg: Message = { role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await engine.current.chat(
        messages, 
        inputText, 
        settings, 
        chatMode,
        settings.ankiLimitToKnown ? filteredWordsList.map(w => w.word) : undefined
      );
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
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
      const topic = await engine.current.generateTopic(
        settings,
        settings.ankiLimitToKnown ? filteredWordsList.map(w => w.word) : undefined
      );
      setWritingTopic(topic);
      setWritingText('');
      setWritingSentenceFeedback(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  const startExercises = async () => {
    if (!engine.current || !exerciseConfig.topic) return;
    setIsGeneratingExercises(true);
    setActiveExercise(true);
    try {
      const exercises = await engine.current.generateExercises(
        settings, 
        exerciseConfig.topic, 
        exerciseConfig.type, 
        exerciseConfig.count,
        exerciseConfig.levelInfo,
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

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-500/10 blur-[100px] rounded-full" />
      </div>

      <main className="relative z-10 pb-32 pt-10 px-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col h-[80vh]"
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

              {showChatOptions && (
                <GlassCard className="mb-6 p-4 flex gap-4">
                  <button 
                    onClick={() => setChatMode('dialogue')}
                    className={`flex-1 p-4 rounded-2xl border transition-all ${chatMode === 'dialogue' ? 'bg-blue-500/20 border-blue-500/50' : 'border-white/10'}`}
                  >
                    <MessageSquare className="mx-auto mb-2" />
                    <span className="text-xs font-bold">Dialog</span>
                  </button>
                  <button 
                    onClick={() => setChatMode('narrative')}
                    className={`flex-1 p-4 rounded-2xl border transition-all ${chatMode === 'narrative' ? 'bg-purple-500/20 border-purple-500/50' : 'border-white/10'}`}
                  >
                    <Gamepad2 className="mx-auto mb-2" />
                    <span className="text-xs font-bold">Narracja</span>
                  </button>
                </GlassCard>
              )}

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <Languages size={48} />
                    <p>Rozpocznij naukę pisząc wiadomość...</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <ChatMessage key={i} message={msg} settings={settings} />
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

              <div className="mt-6 relative">
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
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Tryb Pisania</h1>
                <GlassButton variant="secondary" onClick={generateNewTopic} disabled={isGeneratingTopic}>
                  {isGeneratingTopic ? <RefreshCw className="animate-spin" size={18} /> : 'Losuj temat'}
                </GlassButton>
              </div>

              <GlassCard className="p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-blue-400">{writingTopic.topic}</h3>
                  <p className="text-sm text-white/60">{writingTopic.description}</p>
                </div>
                
                <div className="relative">
                  <textarea
                    value={writingText}
                    onChange={handleWritingChange}
                    className="w-full h-64 bg-black/20 border border-white/10 rounded-2xl p-6 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
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
                      className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
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
            </motion.div>
          )}

          {activeTab === 'exercises' && (
            <motion.div
              key="exercises"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-3xl font-bold mb-8">Ćwiczenia</h1>
              
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

                    <GlassButton onClick={startExercises} className="w-full" disabled={!exerciseConfig.topic}>
                      Generuj ćwiczenia
                    </GlassButton>
                  </GlassCard>

                  <div className="grid gap-4">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest px-2">Wybierz temat z programu</p>
                    <GrammarTree 
                      sections={settings.targetLanguage === 'de' ? GERMAN_GRAMMAR : settings.targetLanguage === 'es' ? SPANISH_GRAMMAR : ENGLISH_GRAMMAR}
                      cefrLevel={settings.cefrLevel}
                      onSelect={(item) => setExerciseConfig({
                        ...exerciseConfig, 
                        topic: item.title,
                        levelInfo: item.levelInfo?.[settings.cefrLevel]
                      })}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <img src={settings.avatar} className="w-24 h-24 rounded-[2rem] border-2 border-blue-500/50 p-1" alt="Avatar" />
                  <div className="absolute -bottom-2 -right-2 bg-blue-500 p-2 rounded-xl shadow-lg">
                    <Plus size={16} />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{settings.name}</h2>
                  <p className="text-white/40 font-medium">Poziom {settings.cefrLevel}</p>
                </div>
              </div>

              <GlassCard className="p-6 space-y-6">
                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Ustawienia Językowe</h3>
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
              </GlassCard>

              <GlassCard className="p-6 space-y-6">
                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Integracja Anki</h3>
                
                <div className="space-y-4">
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
                  <button 
                    onClick={syncAnki}
                    disabled={isSyncingAnki}
                    className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-500/30 transition-all disabled:opacity-50"
                  >
                    {isSyncingAnki ? 'Sync...' : 'Synchronizuj'}
                  </button>
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
                    <p className="text-[10px] text-white/40 italic">AI będzie budować zdania głównie z Twoich fiszek</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.ankiLimitToKnown}
                    onChange={(e) => setSettings({...settings, ankiLimitToKnown: e.target.checked})}
                    className="w-5 h-5 accent-blue-500"
                  />
                </div>
              </GlassCard>

              <GlassCard className="p-6 space-y-6">
                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">API Gemini</h3>
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
                  <input
                    type="password"
                    value={settings.geminiApiKey}
                    onChange={(e) => setSettings({...settings, geminiApiKey: e.target.value})}
                    placeholder="Wprowadź klucz API..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-blue-500/50"
                  />
                )}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
