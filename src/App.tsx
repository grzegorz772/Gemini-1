/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
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
  Cpu,
  PenTool,
  Check,
  Search,
  Settings,
  User,
  X,
  Database,
  Menu,
  Edit2,
  Trash2,
  Volume2
} from 'lucide-react';
import { GlassCard, GlassButton } from './components/GlassUI';
import { BottomNav } from './components/BottomNav';
import { WebGPUSpeech } from './components/WebGPUSpeech';
import { UserSettings, Message, ChatSession, AnkiWord, SelectedTopic, GrammarSubsection } from './types';
import { GeminiEngine } from './services/GeminiEngine';
import { AnkiService } from './services/AnkiService';
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import JSZip from 'jszip';

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
  ankiFilterDays: 0,
  ankiFilterStatus: 'all',
  ankiCacheWords: true,
  aiModel: 'gemini-3.5-flash',
  useParallelAI: true,
  translationModel: 'gemini-3.5-flash',
  correctionModel: 'gemini-3.5-flash',
  worldMemory: 1000,
  ankiAlgorithm: 'all',
  ankiSortField: 'lastReview',
  ankiSortOrder: 'desc',
  localModelPath: null,
  localModelSystemPrompt: 'Jesteś pomocnym asystentem.',
  useLocalLLM: false,
  restrictToKnownWords: false,
};

const TOP_20_LANGUAGES = [
  { code: 'pl', name: 'Polski (Polish)', flag: '🇵🇱' },
  { code: 'en', name: 'English (Angielski)', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch (Niemiecki)', flag: '🇩🇪' },
  { code: 'es', name: 'Español (Hiszpański)', flag: '🇪🇸' },
  { code: 'fr', name: 'Français (Francuski)', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano (Włoski)', flag: '🇮🇹' },
  { code: 'pt', name: 'Português (Portugalski)', flag: '🇵🇹' },
  { code: 'nl', name: 'Nederlands (Holenderski)', flag: '🇳🇱' },
  { code: 'ru', name: 'Русский (Rosyjski)', flag: '🇷🇺' },
  { code: 'uk', name: 'Українська (Ukraiński)', flag: '🇺🇦' },
  { code: 'zh', name: '中文 (Chiński)', flag: '🇨🇳' },
  { code: 'ja', name: '日本語 (Japoński)', flag: '🇯🇵' },
  { code: 'ko', name: '한국어 (Koreański)', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية (Arabski)', flag: '🇸🇦' },
  { code: 'tr', name: 'Türkçe (Turecki)', flag: '🇹🇷' },
  { code: 'sv', name: 'Svenska (Szwedzki)', flag: '🇸🇪' },
  { code: 'no', name: 'Norsk (Norweski)', flag: '🇳🇴' },
  { code: 'da', name: 'Dansk (Duński)', flag: '🇩🇰' },
  { code: 'fi', name: 'Suomi (Fiński)', flag: '🇫🇮' },
  { code: 'cs', name: 'Čeština (Czeski)', flag: '🇨🇿' }
];

const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  pl: {
    settingsTitle: "Ustawienia",
    tutorialTitle: "Kreator Konfiguracji i Samouczek",
    tutorialDesc: "Przejdź przez interaktywną konfigurację krok po kroku. Ustaw języki, połącz talię Anki i poznaj funkcje programu.",
    openWizard: "Uruchom Interaktywny Kreator 🚀",
    chatTab: "Czat z AI",
    grammarTab: "Gramatyka",
    vocabularyTab: "Słownik Anki",
    settingsTab: "Ustawienia",
    ankiSettings: "Połączenie z Anki",
    knownWordsCount: "Załadowane słówka",
    close: "Zamknij",
    next: "Dalej",
    prev: "Wstecz",
    finish: "Zakończ i Zapisz",
    nativeLangLabel: "Twój Język Ojczysty (Natywny / UI)",
    targetLangLabel: "Język, którego się Uczysz (Target)",
    stepsHeader: "KROK {step} z 4",
    step1Title: "Witaj w LinguAnki! 👋",
    step1Desc: "To rewolucyjne narzędzie łączy naukę języka z Twoją osobistą talią słówek Anki. AI uczy Cię, korzystając wyłącznie ze słówek, które już znasz lub właśnie powtarzasz!",
    step2Title: "Wybór Języków 🗺️",
    step2Desc: "Zacznijmy od podstaw - wybierz języki oraz swój poziom zaawansowania (CEFR).",
    step3Title: "Połączenie z Anki 🗂️",
    step3Desc: "Możesz zaimportować plik .apkg ze swojej talii Anki. Jeśli nie masz, możesz pominąć ten krok.",
    step4Title: "Filtry i Sortowanie ⚙️",
    step4Desc: "Ustaw preferowane filtry i limit słówek pobieranych z Anki. Możesz dostosować, które z Twoich słówek mają być aktywnie wykorzystywane przez AI.",
  },
  en: {
    settingsTitle: "Settings",
    tutorialTitle: "Setup Wizard & Tutorial",
    tutorialDesc: "Walk through the interactive step-by-step setup. Configure languages, link your Anki deck, and learn program features.",
    openWizard: "Launch Interactive Wizard 🚀",
    chatTab: "AI Chat",
    grammarTab: "Grammar",
    vocabularyTab: "Anki Vocab",
    settingsTab: "Settings",
    ankiSettings: "Anki Connection",
    knownWordsCount: "Loaded words",
    close: "Close",
    next: "Next",
    prev: "Back",
    finish: "Finish and Save",
    nativeLangLabel: "Your Native Language (UI)",
    targetLangLabel: "Language You Are Learning",
    stepsHeader: "STEP {step} of 4",
    step1Title: "Welcome to LinguAnki! 👋",
    step1Desc: "This revolutionary tool blends language learning with your personal Anki flashcards. The AI teaches you using only words you already know or are currently reviewing!",
    step2Title: "Language Selection 🗺️",
    step2Desc: "Let's start with the basics - select your languages and your proficiency level (CEFR).",
    step3Title: "Anki Connection 🗂️",
    step3Desc: "You can import an .apkg file of your Anki deck. If you don't have one, you can skip this step.",
    step4Title: "Filters & Limits ⚙️",
    step4Desc: "Configure your desired filters and word limit for Anki. You can adjust which of your words the AI will actively use.",
  },
  de: {
    settingsTitle: "Einstellungen",
    tutorialTitle: "Setup-Assistent & Anleitung",
    tutorialDesc: "Gehen Sie das interaktive Setup Schritt für Schritt durch. Konfigurieren Sie Sprachen, verknüpfen Sie Ihr Anki-Deck und lernen Sie die Funktionen kennen.",
    openWizard: "Interaktiven Assistenten starten 🚀",
    chatTab: "KI-Chat",
    grammarTab: "Grammatik",
    vocabularyTab: "Anki-Vokabeln",
    settingsTab: "Einstellungen",
    ankiSettings: "Anki-Verbindung",
    knownWordsCount: "Geladene Wörter",
    close: "Schließen",
    next: "Weiter",
    prev: "Zurück",
    finish: "Abschließen und Speichern",
    nativeLangLabel: "Ihre Muttersprache",
    targetLangLabel: "Zielsprache",
    stepsHeader: "SCHRITT {step} von 4",
    step1Title: "Willkommen bei LinguAnki! 👋",
    step1Desc: "Dieses revolutionäre Tool verbindet das Sprachenlernen mit Ihren persönlichen Anki-Lernkarten. Die KI unterrichtet Sie ausschließlich mit Wörtern, die Sie bereits kennen oder gerade wiederholen!",
    step2Title: "Sprachauswahl 🗺️",
    step2Desc: "Wählen Sie Ihre Muttersprache (für die Benutzeroberfläche, Erklärungen und Übersetzungen) und die Zielsprache, die Sie lernen möchten.",
    step3Title: "Anki-Konfiguration 🗂️",
    step3Desc: "Sie können eine .apkg-Datei importieren oder eine Verbindung über AnkiConnect herstellen. Wählen Sie Ihr Deck und das Kartenfeld aus.",
    step4Title: "Filter & Sortierung ⚙️",
    step4Desc: "Konfigurieren Sie Ihre Wortfilter. Sie können Wörter nach Anki-Status filtern (z. B. nur Wörter im Lernprozess) und sortieren.",
  },
  es: {
    settingsTitle: "Ajustes",
    tutorialTitle: "Asistente de Configuración",
    tutorialDesc: "Siga la configuración interactiva paso a paso. Configure los idiomas, conecte su mazo de Anki y descubra las funciones.",
    openWizard: "Iniciar Asistente Interactivo 🚀",
    chatTab: "Chat con IA",
    grammarTab: "Gramática",
    vocabularyTab: "Vocabulario Anki",
    settingsTab: "Ajustes",
    ankiSettings: "Conexión Anki",
    knownWordsCount: "Palabras cargadas",
    close: "Cerrar",
    next: "Siguiente",
    prev: "Atrás",
    finish: "Finalizar y Guardar",
    nativeLangLabel: "Tu Idioma Nativo",
    targetLangLabel: "Idioma que Aprendes",
    stepsHeader: "PASO {step} de 4",
    step1Title: "¡Bienvenido a LinguAnki! 👋",
    step1Desc: "Esta herramienta revolucionaria une el aprendizaje de idiomas con tus tarjetas de Anki. La IA te enseña usando solo palabras que ya conoces o estás repasando.",
    step2Title: "Selección de Idiomas 🗺️",
    step2Desc: "Elige tu idioma nativo (usado para la interfaz, explicaciones y traductions) y el idioma que deseas aprender.",
    step3Title: "Configuración de Anki 🗂️",
    step3Desc: "Puedes importar un archivo .apkg de tu mazo o conectarte mediante AnkiConnect. Selecciona tu mazo y campo de tarjeta.",
    step4Title: "Filtros y Ordenamiento ⚙️",
    step4Desc: "Configura tus filtros de palabras. Filtra según su estado en Anki (p. ej., palabras en aprendizaje) y su orden de aparición.",
  },
  fr: {
    settingsTitle: "Paramètres",
    tutorialTitle: "Assistant de Configuration",
    tutorialDesc: "Suivez la configuration interactive étape par étape. Configurez les langues, connectez votre paquet Anki et découvrez les fonctionnalités.",
    openWizard: "Lancer l'Assistant Interactif 🚀",
    chatTab: "Chat IA",
    grammarTab: "Grammaire",
    vocabularyTab: "Vocabulaire Anki",
    settingsTab: "Paramètres",
    ankiSettings: "Connexion Anki",
    knownWordsCount: "Mots chargés",
    close: "Fermer",
    next: "Suivant",
    prev: "Précédent",
    finish: "Terminer et Enregistrer",
    nativeLangLabel: "Votre Langue Maternelle",
    targetLangLabel: "Langue Apprise",
    stepsHeader: "ÉTAPE {step} sur 4",
    step1Title: "Bienvenue sur LinguAnki ! 👋",
    step1Desc: "Cet outil révolutionnaire associe l'apprentissage des langues à vos cartes mémoire Anki. L'IA vous enseigne en utilisant uniquement des mots que vous connaissez déjà !",
    step2Title: "Sélection des Langues 🗺️",
    step2Desc: "Choisissez votre langue maternelle (utilisée pour l'interface, les explications et les traductions) et la langue que vous souhaitez apprendre.",
    step3Title: "Configuration Anki 🗂️",
    step3Desc: "Vous pouvez importer un fichier .apkg de votre paquet ou vous connecter via AnkiConnect. Sélectionnez votre paquet et le champ correspondant.",
    step4Title: "Filtres & Tri ⚙️",
    step4Desc: "Configurez vos filtres de mots. Vous pouvez les filtrer selon leur statut Anki (ex: uniquement en cours d'apprentissage) et définir le tri.",
  },
  it: {
    settingsTitle: "Impostazioni",
    tutorialTitle: "Configurazione Guidata",
    tutorialDesc: "Segui la configurazione interattiva passo dopo passo. Configura le lingue, collega il tuo mazzo Anki e scopri le funzioni.",
    openWizard: "Avvia Configurazione Guidata 🚀",
    chatTab: "Chat IA",
    grammarTab: "Grammatica",
    vocabularyTab: "Vocabolario Anki",
    settingsTab: "Impostazioni",
    ankiSettings: "Connessione Anki",
    knownWordsCount: "Parole caricate",
    close: "Chiudi",
    next: "Avanti",
    prev: "Indietro",
    finish: "Salva e Chiudi",
    nativeLangLabel: "La tua Lingua Madre",
    targetLangLabel: "Lingua da Imparare",
    stepsHeader: "PASSO {step} di 4",
    step1Title: "Benvenuto su LinguAnki! 👋",
    step1Desc: "Questo strumento rivoluzionario combina l'apprendimento delle lingue con le tue carte Anki. L'IA ti insegna usando solo parole che conosci già o che stai ripassando!",
    step2Title: "Selezione Lingue 🗺️",
    step2Desc: "Scegli la tua lingua madre (usata per l'interfaccia, le spiegazioni e le traduzioni) e la lingua che desideri imparare.",
    step3Title: "Configurazione Anki 🗂️",
    step3Desc: "Puoi importare un file .apkg o connetterti tramite AnkiConnect. Seleziona il mazo e il campo desiderato.",
    step4Title: "Filtri e Ordinamento ⚙️",
    step4Desc: "Configura i filtri. Puoi filtrare le parole in base allo stato in Anki (es: solo in fase di apprendimento) e ordinarle.",
  },
  ru: {
    settingsTitle: "Настройки",
    tutorialTitle: "Мастер Настройки и Руководство",
    tutorialDesc: "Пройдите пошаговую интерактивную настройку. Укажите языки, подключите колоду Anki и изучите возможности программы.",
    openWizard: "Запустить Мастер Настройки 🚀",
    chatTab: "Чат с ИИ",
    grammarTab: "Грамматика",
    vocabularyTab: "Словарь Anki",
    settingsTab: "Настройки",
    ankiSettings: "Подключение Anki",
    knownWordsCount: "Загружено слов",
    close: "Закрыть",
    next: "Далее",
    prev: "Назад",
    finish: "Завершить и Сохранить",
    nativeLangLabel: "Ваш Родной Язык",
    targetLangLabel: "Изучаемый Язык",
    stepsHeader: "ШАГ {step} из 4",
    step1Title: "Добро пожаловать в LinguAnki! 👋",
    step1Desc: "Этот революционный инструмент связывает изучение языка с вашими карточками Anki. ИИ обучает вас, используя только те слова, которые вы уже знаете или повторяете!",
    step2Title: "Выбор Языков 🗺️",
    step2Desc: "Выберите родной язык (на нем будет интерфейс, подсказки и перевод) и язык, который хотите выучить.",
    step3Title: "Настройка Anki 🗂️",
    step3Desc: "Вы можете импортировать файл .apkg или подключиться через AnkiConnect. Выберите колоду и целевое поле карты.",
    step4Title: "Фильтры и Сортировка ⚙️",
    step4Desc: "Настройте фильтрацию слов. Можно выбрать слова по статусу в Anki (например, только изучаемые карточки) и настроить их сортировку.",
  }
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
          ) : (
            <div>
              {message.parts.map(p => p.text).join('') ? (
                <p className="text-[15px] leading-relaxed font-medium">{message.parts.map(p => p.text).join('')}</p>
              ) : (
                <div className="flex gap-1 items-center py-1">
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[10px] text-white/40 ml-2 uppercase tracking-widest">Generowanie odpowiedzi...</span>
                </div>
              )}
              {isModel && message.isPendingTranslation && message.parts.map(p => p.text).join('') !== "" && (
                <div className="flex gap-1 items-center mt-2 pt-2 border-t border-white/5">
                  <div className="w-1 h-1 bg-white/30 rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-white/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 bg-white/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">Przygotowywanie tłumaczenia...</span>
                </div>
              )}
            </div>
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
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const t = (key: string, step?: number): string => {
    const lang = settings.nativeLanguage || 'pl';
    const dict = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS['en'];
    let val = dict[key] || UI_TRANSLATIONS['en'][key] || key;
    if (step !== undefined) {
      val = val.replace('{step}', step.toString());
    }
    return val;
  };
  
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('lingu_chat_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionTitle, setEditSessionTitle] = useState('');

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState<'dialogue' | 'narrative'>('dialogue');
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [knownWords, setKnownWords] = useState<AnkiWord[]>(() => {
    const saved = localStorage.getItem('lingu_known_words');
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    if (settings.ankiCacheWords) {
      localStorage.setItem('lingu_known_words', JSON.stringify(knownWords));
    } else {
      localStorage.removeItem('lingu_known_words');
    }
  }, [knownWords, settings.ankiCacheWords]);

  const [ankiApkgData, setAnkiApkgData] = useState<{
    decks: Record<string, { id: string, name: string }>,
    models: Record<string, { id: string, name: string, flds: {name: string}[] }>,
    db: any
  } | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const engine = useRef<GeminiEngine | null>(null);
  const localEngineRef = useRef<any>(null);
  const percentRef = useRef<string>("0");
  const [localModelLogs, setLocalModelLogs] = useState<string[]>([]);
  const anki = useRef(new AnkiService());

  const addLog = (msg: string) => {
    setAnkiLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  const filteredWordsList = useMemo(() => {
    if (!knownWords.length) return [];
    
    let filtered = knownWords.map(word => {
      let displayWord = (settings.ankiFieldName ? word.fields[settings.ankiFieldName] : word.word) || "";
      
      // If the selected field is empty, try to find the first non-empty field as fallback
      if (!displayWord || displayWord.trim().length === 0) {
        const firstNonEmpty = Object.values(word.fields).find(v => typeof v === 'string' && v.trim().length > 0) as string | undefined;
        displayWord = firstNonEmpty || "Empty";
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
      if (settings.ankiFilterStatus === 'learned') {
        // Keep everything that is not new
        if (word.status === 'new') return false;
      } else if (settings.ankiFilterStatus === 'learning') {
        if (word.status !== 'learning' && word.status !== 'relearning') return false;
      } else if (settings.ankiFilterStatus === 'reviewed') {
        // Only keep review status
        if (word.status !== 'review') return false;
      }
      
      // DEBUG:
      console.log(`Word: ${word.word}, Status: ${word.status}, Filter: ${settings.ankiFilterStatus}`);

      
      // Filter by days since last review (only apply to words that have been learned/reviewed)
      if (settings.ankiFilterDays > 0 && word.status !== 'new' && word.lastReview) {
        const diffDays = (Date.now() - word.lastReview) / (1000 * 60 * 60 * 24);
        if (diffDays > settings.ankiFilterDays) return false;
      }
      
      return true;
    });

    // Zastosuj algorytm wyboru słówek
    if (settings.ankiAlgorithm === 'interval') {
      // Najstarsze powtórki jako pierwsze (najdalszy czas)
      filtered.sort((a, b) => (a.lastReview || 0) - (b.lastReview || 0));
    } else if (settings.ankiAlgorithm === 'reps') {
      // Najwięcej powtórzeń jako pierwsze (problematic)
      filtered.sort((a, b) => (b.reps || 0) - (a.reps || 0));
    } else if (settings.ankiAlgorithm === 'learning') {
      filtered = filtered.filter(w => (w.status || '') === 'learning' || (w.status || '') === 'relearning');
    } else if (settings.ankiAlgorithm === 'review') {
      filtered = filtered.filter(w => (w.status || '') === 'review');
    } else if (settings.ankiAlgorithm === 'relearning') {
      filtered = filtered.filter(w => (w.status || '') === 'relearning');
    }

    // Zastosuj sortowanie użytkownika
    const sortField = settings.ankiSortField || 'none';
    const sortOrder = settings.ankiSortOrder || 'desc';

    if (sortField !== 'none') {
      filtered.sort((a, b) => {
        let valA: any = 0;
        let valB: any = 0;

        if (sortField === 'lastReview') {
          valA = a.lastReview || 0;
          valB = b.lastReview || 0;
        } else if (sortField === 'interval') {
          valA = a.interval || 0;
          valB = b.interval || 0;
        } else if (sortField === 'reps') {
          valA = a.reps || 0;
          valB = b.reps || 0;
        } else if (sortField === 'word') {
          return sortOrder === 'asc' 
            ? a.word.localeCompare(b.word) 
            : b.word.localeCompare(a.word);
        }

        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
    }

    // Limit wyników do WorldMemory
    if (settings.worldMemory > 0) {
      filtered = filtered.slice(0, settings.worldMemory);
    }

    return filtered;
  }, [knownWords, settings.ankiFieldName, settings.ankiFilterStatus, settings.ankiFilterDays, settings.ankiAlgorithm, settings.worldMemory, settings.ankiSortField, settings.ankiSortOrder]);

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
          console.warn("Error fetching deck structure:", e instanceof Error ? e.message : e);
          addLog(`Błąd pobierania struktury talii: ${e instanceof Error ? e.message : 'Nieznany błąd'}`);
        }
      }
      
      // Trigger sync to get words for the new deck
      syncAnki();
    };

    updateFieldsAndSync();
  }, [settings.ankiDeckName, ankiApkgData]);

  // Also sync when field name, filter status or filter days changes
  useEffect(() => {
    if (settings.ankiDeckName && settings.ankiFieldName) {
      syncAnki();
    }
  }, [settings.ankiFieldName, settings.ankiFilterStatus, settings.ankiFilterDays]);

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
  const [localModelChat, setLocalModelChat] = useState<Message[]>([]);
  const [isLocalModelLoading, setIsLocalModelLoading] = useState(false);
  const [localModelInput, setLocalModelInput] = useState('');

  // Watchdog for local model loading
  useEffect(() => {
    let timer: any;
    let lastPercent = percentRef.current;
    
    if (isLocalModelLoading) {
      timer = setInterval(() => {
        if (percentRef.current === lastPercent && percentRef.current !== "100.0") {
          setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] INFO: Pobieranie wydaje się stać w miejscu (${percentRef.current}%). Jeśli trwa to długo, odśwież stronę lub użyj 'Wyczyść Cache'.`, ...prev]);
        }
        lastPercent = percentRef.current;
      }, 20000); // Check every 20 seconds
    }
    
    return () => clearInterval(timer);
  }, [isLocalModelLoading]);
  const [availableDecks, setAvailableDecks] = useState<string[]>(() => {
    const saved = localStorage.getItem('lingu_available_decks');
    return saved ? JSON.parse(saved) : [];
  });
  const [availableFields, setAvailableFields] = useState<string[]>(() => {
    const saved = localStorage.getItem('lingu_available_fields');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (settings.ankiCacheWords) {
      localStorage.setItem('lingu_available_decks', JSON.stringify(availableDecks));
    } else {
      localStorage.removeItem('lingu_available_decks');
    }
  }, [availableDecks, settings.ankiCacheWords]);

  useEffect(() => {
    if (settings.ankiCacheWords) {
      localStorage.setItem('lingu_available_fields', JSON.stringify(availableFields));
    } else {
      localStorage.removeItem('lingu_available_fields');
    }
  }, [availableFields, settings.ankiCacheWords]);
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
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);
  const [showAnkiBrowser, setShowAnkiBrowser] = useState(false);
  const [ankiSearchQuery, setAnkiSearchQuery] = useState('');
  const [activeExplanation, setActiveExplanation] = useState<{
    message: Message;
    explanation: string;
    isLoading: boolean;
    originalText?: string;
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

  const checkWebGPULimits = async (): Promise<{ ok: boolean; message: string; limits?: any }> => {
    if (!(navigator as any).gpu) {
      return { ok: false, message: "Twoja przeglądarka nie obsługuje WebGPU. Upewnij się, że używasz Chrome, Brave lub Edge w najnowszej wersji." };
    }
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (!adapter) {
        return { ok: false, message: "Nie udało się uzyskać adaptera WebGPU. Sprawdź, czy Twoja karta graficzna obsługuje WebGPU i czy masz zainstalowane najnowsze sterowniki." };
      }
      const limits = adapter.limits;
      const maxStorageBuffer = limits.maxStorageBufferBindingSize; // w bajtach
      const maxStorageBufferMB = maxStorageBuffer / (1024 * 1024);
      
      const isBrave = !!(navigator as any).brave;
      
      // Domyślny sfałszowany limit w Brave to 128MB lub 256MB
      if (maxStorageBufferMB <= 256) {
        if (isBrave) {
          return {
            ok: false,
            limits,
            message: `WYKRYTO RESTRYKCJE BRAVE SHIELDS! Limity pamięci WebGPU są zablokowane na ${maxStorageBufferMB.toFixed(0)}MB (wymagane min 1024MB dla większych modeli). Ochrona przed fingerprintingiem (Brave Shields) blokuje WebGPU! Kliknij ikonę lwa (Brave Shields) w pasku adresu i wyłącz tarcze dla tej witryny, lub zmień 'Fingerprinting protection' na 'Disabled' w ustawieniach tarcz.`
          };
        } else {
          return {
            ok: false,
            limits,
            message: `Niskie limity WebGPU (maxStorageBufferBindingSize: ${maxStorageBufferMB.toFixed(0)}MB). Może to uniemożliwić ładowanie większych modeli. Upewnij się, że nie korzystasz z trybu Incognito / prywatnego.`
          };
        }
      }
      return { ok: true, message: `WebGPU jest gotowe i ma pełne limity (maks. bufor: ${maxStorageBufferMB.toFixed(0)}MB).`, limits };
    } catch (err: any) {
      return { ok: false, message: `Błąd sprawdzania WebGPU: ${err.message}` };
    }
  };

  useEffect(() => {
    if (engine.current) {
      engine.current.localEngine = localEngineRef.current;
      engine.current.useLocalLLM = settings.useLocalLLM;
    }
  }, [settings.useLocalLLM, localEngineRef.current]);

  useEffect(() => {
    const runCheck = async () => {
      const gpuStatus = await checkWebGPULimits();
      setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Sprawdzenie WebGPU: ${gpuStatus.message}`, ...prev]);
    };
    runCheck();
  }, []);

  const loadModelFromCache = async () => {
    setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Przeszukiwanie cache...`, ...prev]);
    setIsLocalModelLoading(true);
    try {
      const gpuStatus = await checkWebGPULimits();
      if (!gpuStatus.ok) {
        setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] OSTRZEŻENIE / PROBLEM: ${gpuStatus.message}`, ...prev]);
      } else {
        setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Status WebGPU: ${gpuStatus.message}`, ...prev]);
      }

      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const availableGB = ((estimate.quota || 0) - (estimate.usage || 0)) / (1024 * 1024 * 1024);
        if (availableGB < 7) {
          setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] OSTRZEŻENIE: Masz tylko ${availableGB.toFixed(1)}GB wolnego miejsca w przeglądarce. Modele LLM wymagają min. 7-10GB.`, ...prev]);
        }
      }
      let configUrl = null;
      let modelBaseUrl = null;
      let wasmUrl = null;
      
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
         if (cacheName.includes('webllm') || cacheName.includes('tvmjs')) {
             const cache = await caches.open(cacheName);
             const keys = await cache.keys();
             for (const request of keys) {
                 if (request.url.includes('mlc-chat-config.json')) {
                     configUrl = request.url;
                     modelBaseUrl = configUrl.replace('mlc-chat-config.json', '');
                 }
                 if (request.url.endsWith('.wasm')) {
                     wasmUrl = request.url;
                 }
             }
         }
      }
      
      if (!configUrl || !modelBaseUrl) {
         throw new Error("Nie znaleziono konfiguracji modelu w cache.");
      }
      if (!wasmUrl) {
         throw new Error("Nie znaleziono pliku WASM w cache. Upewnij się, że wyeksportowany zip zawiera .wasm");
      }

      setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Znaleziono konfigurację: ${configUrl}`, ...prev]);
      setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Znaleziono WASM: ${wasmUrl}`, ...prev]);

      const appConfig = {
          model_list: [{
              model: modelBaseUrl,
              model_id: "local-model",
              model_type: "llm",
              model_lib: wasmUrl
          }]
      };

      const mlcEngine = await CreateMLCEngine("local-model", {
          appConfig: appConfig as any,
          initProgressCallback: (report) => {
              let log = report.text;
              if (report.progress !== undefined) {
                  const percent = (report.progress * 100).toFixed(1);
                  log = `[${percent}%] ${log}`;
              }
              setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] ${log}`, ...prev]);
          }
      });
      localEngineRef.current = mlcEngine;
      if (engine.current) engine.current.localEngine = mlcEngine;
      setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Sukces: Model z cache gotowy.`, ...prev]);
    } catch (err: any) {
        let errorMsg = err.message;
        if (errorMsg.includes('Cache.add') || errorMsg.includes('network error') || errorMsg.includes('fetch')) {
            errorMsg += " (Błąd pobierania. Upewnij się, że masz min. 10GB wolnego miejsca i nie jesteś w trybie incognito. Spróbuj 'Wyczyść Cache').";
        }
        setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] ERROR: ${errorMsg}`, ...prev]);
    } finally {
        setIsLocalModelLoading(false);
    }
  };

  const loadLocalModel = async (modelId: string) => {
    setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Rozpoczynanie ładowania modelu: ${modelId}...`, ...prev]);
    setIsLocalModelLoading(true);
    try {
        const gpuStatus = await checkWebGPULimits();
        if (!gpuStatus.ok) {
          setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] OSTRZEŻENIE / PROBLEM: ${gpuStatus.message}`, ...prev]);
        } else {
          setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Status WebGPU: ${gpuStatus.message}`, ...prev]);
        }

        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            const availableGB = ((estimate.quota || 0) - (estimate.usage || 0)) / (1024 * 1024 * 1024);
            if (availableGB < 7) {
                setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] OSTRZEŻENIE: Masz tylko ${availableGB.toFixed(1)}GB wolnego miejsca w przeglądarce. Modele LLM wymagają min. 7-10GB.`, ...prev]);
            }
        }

        let finalModelId = modelId;
        let engineConfig: any = {
            initProgressCallback: (report: any) => {
                let log = report.text;
                if (report.progress !== undefined) {
                    const percent = (report.progress * 100).toFixed(1);
                    percentRef.current = percent;
                    log = `[${percent}%] ${log}`;
                }
                setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] ${log}`, ...prev]);
            }
        };

        if (modelId.startsWith("HF://") || modelId.startsWith("https://huggingface.co/")) {
            const repo = modelId.startsWith("HF://") ? `https://huggingface.co/${modelId.slice(5)}` : modelId;
            const repoParts = repo.split('/');
            const modelName = repoParts[repoParts.length - 1];
            finalModelId = modelName;
            
            engineConfig.appConfig = {
              model_list: [
                {
                  model: repo,
                  model_id: modelName,
                  model_lib: `${repo}/resolve/main/libs/${modelName}-webgpu.wasm`,
                  required_features: ["shader-f16"],
                  overrides: {
                    sliding_window_size: 512,
                    context_window_size: -1
                  }
                }
              ]
            };
            setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Użyto niestandardowej konfiguracji dla repozytorium: ${repo}`, ...prev]);
        }

        const mlcEngine = await CreateMLCEngine(finalModelId, engineConfig);
        localEngineRef.current = mlcEngine;
        if (engine.current) engine.current.localEngine = mlcEngine;
        setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Sukces: Model ${modelId} gotowy.`, ...prev]);
    } catch (err: any) {
        let errorMsg = err.message;
        if (errorMsg.includes('Cache.add') || errorMsg.includes('network error') || errorMsg.includes('fetch')) {
            errorMsg += " (Błąd pobierania. Sprawdź miejsce na dysku (min. 10GB) i tryb Incognito. Użyj 'Wyczyść Cache' jeśli pobieranie stoi w miejscu).";
        }
        setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] ERROR: ${errorMsg}`, ...prev]);
    } finally {
        setIsLocalModelLoading(false);
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

  // ----- Chat Session Management -----
  useEffect(() => {
    localStorage.setItem('lingu_chat_sessions', JSON.stringify(chatSessions));
  }, [chatSessions]);

  // Sync messages to current session
  useEffect(() => {
    if (messages.length === 0) return;
    setChatSessions(prev => {
      let sessionId = currentSessionId;
      if (!sessionId) {
        // Create new session if none is active
        sessionId = Date.now().toString();
        setCurrentSessionId(sessionId);
        return [{
          id: sessionId,
          title: "Nowy Czat",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages,
          isTitleEdited: false,
          mode: chatMode
        }, ...prev];
      }

      return prev.map(session => {
        if (session.id === sessionId) {
          return { ...session, messages, updatedAt: Date.now(), mode: chatMode };
        }
        return session;
      });
    });
  }, [messages]);

  // Title generation effect
  useEffect(() => {
    const handleTitleGeneration = async () => {
      if (!currentSessionId || messages.length === 0 || !engine.current) return;
      
      const currentSession = chatSessions.find(s => s.id === currentSessionId);
      if (!currentSession || currentSession.isTitleEdited) return;

      if (messages.length === 2 && currentSession.title === "Nowy Czat") {
         // Generate based on first message
         try {
            const firstMsg = messages[0].parts[0]?.text || "";
            const newTitle = await engine.current.generateSessionTitle(settings, firstMsg);
            setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: newTitle } : s));
         } catch(e) {
            console.error("Title gen failed", e);
         }
      } else if (messages.length > 2 && messages.length % 30 === 0) {
         // Update based on history every 30 messages
         try {
            const newTitle = await engine.current.updateSessionTitleFromHistory(settings, messages);
            setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: newTitle } : s));
         } catch(e) {
            console.error("Title history gen failed", e);
         }
      }
    };
    handleTitleGeneration();
  }, [messages, currentSessionId]);

  const loadSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setChatMode(session.mode);
      setIsChatHistoryOpen(false);
    }
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setIsChatHistoryOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      startNewSession();
    }
  };

  const saveEditedTitle = (sessionId: string) => {
    if (!editSessionTitle.trim()) return;
    setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: editSessionTitle.trim(), isTitleEdited: true } : s));
    setEditingSessionId(null);
  };
  // ------------------------------------
  useEffect(() => {
    localStorage.setItem('lingu_settings', JSON.stringify(settings));
    const key = settings.useStudioKey ? process.env.GEMINI_API_KEY : settings.geminiApiKey;
    
    // Tylko utwórz nowy engine jeśli go nie ma, lub klucz się zmienił (najlepiej zaktualizować zamiast rekreować, ale ok)
    // Zeby nie tracic lokalnego LLM przy byle zmianie settings:
    if (!engine.current || (key && engine.current.apiKey !== key)) {
        if (key || settings.useLocalLLM) {
           engine.current = new GeminiEngine(key || "dummy-key-for-local-llm");
        }
    }
    
    if (engine.current) {
       engine.current.localEngine = localEngineRef.current;
       engine.current.useLocalLLM = settings.useLocalLLM;
    }
  }, [settings]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !engine.current) return;

    const userMsgId = Date.now().toString();
    const userMsg: Message = { id: userMsgId, role: 'user', parts: [{ text: inputText }] };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      if (settings.useParallelAI) {
        const aiMsgId = (Date.now() + 1).toString();
        
        // 1. Start Correction and Base Response in PARALLEL
        const correctionPromise = engine.current.getCorrection(inputText, settings);
        const baseResponsePromise = engine.current.getBaseResponse(
          messages, 
          inputText, 
          settings, 
          chatMode,
          settings.ankiLimitToKnown ? filteredWordsList.map(w => w.word) : undefined
        );

        // Add placeholder message immediately to show progress
        const placeholderMsg: Message = {
          id: aiMsgId,
          role: 'model',
          parts: [{ text: '' }],
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
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, parts: [{ text: aiText }] } : m));
          
          // Now start Translation (needs aiText)
          try {
            const sentences = await engine.current!.getTranslation(aiText, settings);
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, sentences, isPendingTranslation: false } : m));
          } catch {
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isPendingTranslation: false } : m));
          }
        }).catch((err) => {
          console.error(err);
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, parts: [{ text: "Błąd generowania odpowiedzi." }], isPendingTranslation: false, isPendingCorrection: false } : m));
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
    
    const messageIndex = messages.findIndex(m => m.id === message.id);
    const originalText = messageIndex > 0 ? messages[messageIndex - 1].parts[0].text : '';

    if (message.detailedExplanation) {
      setActiveExplanation({
        message,
        explanation: message.detailedExplanation,
        isLoading: false,
        originalText
      });
      setShowExplanationModal(true);
      return;
    }

    setActiveExplanation({
      message,
      explanation: '',
      isLoading: true,
      originalText
    });
    setShowExplanationModal(true);

    try {
      const detailed = await engine.current.getDetailedExplanation(
        message.correction,
        originalText,
        message.correctedSentence || '',
        settings
      );
      
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, detailedExplanation: detailed } : m));
      setActiveExplanation(prev => prev ? { ...prev, explanation: detailed, isLoading: false } : null);
    } catch (e) {
      setActiveExplanation(prev => prev ? { ...prev, explanation: 'Błąd podczas pobierania wyjaśnienia.', isLoading: false } : null);
    }
  };

  const handleAcceptCorrection = () => {
    if (writingSentenceFeedback) {
      setWritingText(writingSentenceFeedback.corrected);
      setWritingSentenceFeedback(null);
    }
  };

  const handleWritingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setWritingText(val);

    // Check for sentence completion (dot, question mark, exclamation mark, comma)
    if ((val.endsWith('.') || val.endsWith('?') || val.endsWith('!') || val.endsWith(',')) && val !== lastCheckedSentence) {
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

      <main className="flex-1 relative z-10 overflow-hidden pt-6 pb-8 px-4 sm:px-6 flex flex-col">
        <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col min-h-0 relative"
              >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <GlassButton 
                    variant="secondary" 
                    className="p-3 rounded-full"
                    onClick={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
                  >
                    <Menu size={20} />
                  </GlassButton>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                      {chatSessions.find(s => s.id === currentSessionId)?.title || "LinguAnki"}
                    </h1>
                    <p className="text-white/40 text-sm font-medium uppercase tracking-widest">
                      {chatMode === 'dialogue' ? 'Tryb Dialogu' : 'Tryb Narracji'}
                    </p>
                  </div>
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
                {isChatHistoryOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                      onClick={() => setIsChatHistoryOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      className="absolute inset-y-0 left-0 w-72 bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <span className="font-bold text-white/80 uppercase tracking-widest text-xs">Historia Czatów</span>
                        <button onClick={startNewSession} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white" title="Nowy Czat">
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {chatSessions.length === 0 && (
                          <div className="p-4 text-center text-white/40 text-sm">Brak zapisanych czatów.</div>
                        )}
                        {chatSessions.map(session => (
                          <div 
                            key={session.id}
                            onClick={() => loadSession(session.id)}
                            className={`p-3 rounded-2xl cursor-pointer group transition-all flex items-center gap-3 ${currentSessionId === session.id ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-white/60 hover:text-white'}`}
                          >
                            <MessageSquare size={16} className="shrink-0" />
                            {editingSessionId === session.id ? (
                              <input 
                                autoFocus
                                value={editSessionTitle}
                                onChange={e => setEditSessionTitle(e.target.value)}
                                onBlur={() => saveEditedTitle(session.id)}
                                onKeyDown={e => { if (e.key === 'Enter') saveEditedTitle(session.id); }}
                                onClick={e => e.stopPropagation()}
                                className="flex-1 bg-black/50 border border-white/20 rounded-lg px-2 py-1 text-sm text-white outline-none"
                              />
                            ) : (
                              <div className="flex-1 truncate text-sm font-medium">{session.title}</div>
                            )}
                            <div className="flex items-center gap-1 opacity-100 transition-opacity">
                              <button 
                                onClick={e => { e.stopPropagation(); setEditingSessionId(session.id); setEditSessionTitle(session.title); }}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={e => deleteSession(e, session.id)}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-red-400/60 hover:text-red-400"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

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
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
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
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Tryb Pisania</h1>
              </div>

              {!writingTopic && writingTopicOptions.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="w-full max-w-2xl text-center space-y-8">
                    <div className="inline-flex items-center justify-center p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-[2.5rem] mb-4 ring-1 ring-white/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
                      <BookOpen size={56} className="text-blue-400" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-5">
                      <p className="text-base text-white/60 max-w-lg mx-auto leading-relaxed">
                        Szlifuj swój język obcy. Otrzymasz 3 spersonalizowane tematy. AI będzie analizować Twoje zdania na żywo i uczyć Cię poprawności w trakcie pisania.
                      </p>
                    </div>
                    <button 
                      onClick={generateNewTopic} 
                      disabled={isGeneratingTopic} 
                      className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-semibold rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl"
                    >
                      {isGeneratingTopic ? (
                        <>
                          <RefreshCw className="animate-spin text-black/70" size={20} />
                          <span>Analizowanie poziomu...</span>
                        </>
                      ) : (
                        <>
                          <span>Wylosuj tematy wypracowań</span>
                          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform opacity-70" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {!writingTopic && writingTopicOptions.length > 0 && (
                <div className="flex-1 flex flex-col space-y-8 max-w-5xl mx-auto w-full pt-4 md:pt-12 h-full min-h-0 overflow-hidden">
                  <div className="text-center shrink-0">
                    <h3 className="text-3xl font-bold mb-3 text-white/90">Wybierz wyzwanie</h3>
                    <p className="text-white/50 text-lg">Oto tematy dopasowane do Twojego poziomu {settings.cefrLevel}</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar pb-12 px-4">
                    <div className="grid gap-6 md:grid-cols-3 auto-rows-fr">
                      {writingTopicOptions.map((opt, i) => (
                        <div 
                          key={i}
                          onClick={() => setWritingTopic(opt)}
                          className="group relative p-8 bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-[2rem] cursor-pointer overflow-hidden transition-all duration-300 hover:from-white/15 hover:to-white/10 hover:-translate-y-2 hover:border-blue-500/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col"
                        >
                          <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                            <BookOpen size={160} />
                          </div>
                          
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 mb-6 font-bold shadow-inner ring-1 ring-white/5 overflow-hidden">
                            <span className="relative z-10">{i + 1}</span>
                          </div>
                          
                          <h4 className="text-xl font-bold mb-4 leading-snug group-hover:text-blue-300 transition-colors text-white/90">{opt.topic}</h4>
                          <p className="text-sm text-white/50 leading-relaxed flex-1">{opt.description}</p>
                          
                          <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between text-blue-400/80 text-sm font-semibold group-hover:text-blue-400">
                            <span>Rozpocznij pisanie</span>
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {writingTopic && (
                <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 h-full overflow-hidden p-2">
                  {/* Edytor - Lewa strona */}
                  <div className="flex-1 flex flex-col bg-white/[0.02] border border-white/10 rounded-[2rem] overflow-hidden relative shadow-2xl backdrop-blur-sm">
                    {/* Minimalistyczny Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 shrink-0">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 shrink-0 ring-1 ring-blue-500/20">
                          <BookOpen size={18} />
                        </div>
                        <div className="truncate">
                          <div className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-0.5">Aktualny Temat</div>
                          <h3 className="font-medium text-white/90 truncate text-sm">{writingTopic.topic}</h3>
                        </div>
                      </div>
                      <button 
                        onClick={() => setWritingTopic(null)}
                        className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white shrink-0 ml-4 ring-1 ring-transparent hover:ring-white/10"
                        title="Zmień temat"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                    
                    {/* Pole tekstowe */}
                    <div className="flex-1 relative overflow-hidden group">
                      <textarea
                        value={writingText}
                        onChange={handleWritingChange}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        className="absolute inset-0 w-full h-full p-6 md:p-8 bg-transparent text-base md:text-lg leading-relaxed focus:outline-none resize-none custom-scrollbar placeholder:text-white/20 text-white/90 transition-colors focus:bg-white/[0.01]"
                        placeholder="Rozpocznij swoje wypracowanie tutaj. Postaraj się używać słownictwa ze swojego poziomu. Po postawieniu kropki, Twoje zdanie zostanie natychmiast sprawdzone..."
                      />
                    </div>
                    
                    {/* Wskaźnik ładowania jako subtelny element na dole */}
                    <div className="h-14 shrink-0 border-t border-white/5 px-6 flex items-center bg-black/20">
                      <AnimatePresence mode="wait">
                        {isCheckingSentence ? (
                          <motion.div 
                            key="loading"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-3 text-xs font-semibold text-blue-400 capitalize tracking-wide"
                          >
                            <div className="w-3.5 h-3.5 border-[2px] border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <span>AI analizuje zdanie...</span>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="idle"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-2 text-xs font-medium text-white/20 tracking-wide"
                          >
                            <div className="w-2 h-2 rounded-full bg-green-500/30" />
                            <span>Oczekuję na wprowadzenie...</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Panel Feedbacku - Prawa strona */}
                  <AnimatePresence mode="popLayout">
                    {writingSentenceFeedback && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: 'auto' }}
                        exit={{ opacity: 0, x: 20, width: 0 }}
                        className="w-full md:w-80 shrink-0"
                      >
                        <div className="bg-gradient-to-br from-amber-500/10 to-amber-900/20 border border-amber-500/30 rounded-[2rem] p-6 shadow-2xl backdrop-blur-md h-full overflow-y-auto custom-scrollbar">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-amber-400">
                              <AlertCircle size={20} />
                              <h4 className="font-bold text-sm">Korekta AI</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={handleAcceptCorrection}
                                className="text-white/60 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-white/5 rounded-lg border border-white/10"
                              >
                                Akceptuj
                              </button>
                              <button 
                                onClick={() => setWritingSentenceFeedback(null)}
                                className="text-white/40 hover:text-white transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold mb-1">
                                Sugerowana poprawka
                              </p>
                              <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                <p className="text-white/95 font-medium text-sm leading-relaxed">
                                  {writingSentenceFeedback.corrected}
                                </p>
                              </div>
                            </div>

                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold mb-1">
                                Wyjaśnienie
                              </p>
                              <p className="text-xs text-white/70 leading-relaxed">
                                {writingSentenceFeedback.explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-8 shrink-0">Ćwiczenia</h1>
              
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
                    <GlassCard className="p-8 space-y-8" noShine>
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
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
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
                  <GlassCard className="p-8 space-y-8" noShine noTint>
                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Konfiguracja Ćwiczeń</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-white/60">Temat gramatyczny</label>
                        <input 
                          type="text"
                          value={exerciseConfig.topic}
                          onChange={(e) => setExerciseConfig({...exerciseConfig, topic: e.target.value})}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
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
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <GlassButton onClick={startExercises} className="w-full" disabled={!exerciseConfig.topic && selectedTopics.length === 0}>
                        Generuj ćwiczenia
                      </GlassButton>
                    </div>
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

          {activeTab === 'phonetics' && (
            <motion.div
              key="phonetics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pb-10 pr-2 min-h-0"
            >
              <div className="flex-1 min-h-0 flex flex-col">
                <WebGPUSpeech 
                  onInsertTextIntoChat={(text) => {
                    setInputText(text);
                    setActiveTab('chat');
                  }}
                  accentLanguage={settings.targetLanguage}
                />
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
              <h1 className="text-3xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Ustawienia</h1>

              {/* Sekcja Samouczka / Wprowadzenia */}
              <GlassCard className="p-6 border-blue-500/20 shadow-lg shadow-blue-500/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500 pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                        Samouczek & Tutorial
                      </span>
                      <span className="text-[10px] font-bold text-white/40">v2.0</span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {t('tutorialTitle')}
                    </h2>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {t('tutorialDesc')}
                    </p>
                  </div>
                  <GlassButton 
                    onClick={() => setShowTutorialModal(true)}
                    className="shrink-0 bg-blue-600/20 border-blue-500/30 hover:bg-blue-600/40 text-blue-300 font-bold px-6 py-3 flex items-center gap-2 group/btn"
                  >
                    <BookOpen size={16} className="group-hover/btn:rotate-12 transition-transform" />
                    <span>{t('openWizard')}</span>
                  </GlassButton>
                </div>
              </GlassCard>

              <details className="group bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden transition-all">
                <summary className="p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <BookOpen size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Język</h3>
                  </div>
                  <ChevronRight size={20} className="text-white/40 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="p-6 pt-0 space-y-6 border-t border-white/5 mt-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Poziom zaawansowania</label>
                      <select 
                        value={settings.cefrLevel}
                        onChange={(e) => setSettings({...settings, cefrLevel: e.target.value as any})}
                        className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none"
                      >
                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-white/60">Native (UI)</label>
                        <select 
                          value={settings.nativeLanguage}
                          onChange={(e) => setSettings({...settings, nativeLanguage: e.target.value as any})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none [&>option]:bg-[#151515] [&>option]:text-white"
                        >
                          {TOP_20_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>
                              {lang.flag} {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-white/60">Target</label>
                        <select 
                          value={settings.targetLanguage}
                          onChange={(e) => setSettings({...settings, targetLanguage: e.target.value as any})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none [&>option]:bg-[#151515] [&>option]:text-white"
                        >
                          {TOP_20_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>
                              {lang.flag} {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
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
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Model AI</h3>
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
                      value={settings.aiModel}
                      onChange={(e) => setSettings({...settings, aiModel: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none [&>option]:bg-[#151515] [&>option]:text-white"
                    >
                      <option value="gemini-3.5-flash">Gemini 3 Flash (Domyślny)</option>
                      <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                      <option value="gemma-2-27b-it">Gemma 2 27B</option>
                      <option value="gemma-4-31b-it">Gemma 4 31B</option>
                    </select>
                  </div>

                  {settings.useParallelAI && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-white/60">Model do tłumaczeń</label>
                        <select 
                          value={settings.translationModel}
                          onChange={(e) => setSettings({...settings, translationModel: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none [&>option]:bg-[#151515] [&>option]:text-white"
                        >
                          <option value="gemini-3.5-flash">Gemini 3 Flash</option>
                          <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                          <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                          <option value="gemma-2-27b-it">Gemma 2 27B</option>
                          <option value="gemma-4-31b-it">Gemma 4 31B</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-white/60">Model do poprawek</label>
                        <select 
                          value={settings.correctionModel}
                          onChange={(e) => setSettings({...settings, correctionModel: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none [&>option]:bg-[#151515] [&>option]:text-white"
                        >
                          <option value="gemini-3.5-flash">Gemini 3 Flash</option>
                          <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                          <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                          <option value="gemma-2-27b-it">Gemma 2 27B</option>
                          <option value="gemma-4-31b-it">Gemma 4 31B</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
                </div>
              </details>

              <details className="group bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden transition-all">
                <summary className="p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <RefreshCw size={20} className="text-amber-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Anki</h3>
                  </div>
                  <ChevronRight size={20} className="text-white/40 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="p-6 pt-0 space-y-6 border-t border-white/5 mt-2">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-200/80 leading-relaxed">
                    <p className="font-bold mb-1">Jak używać Anki?</p>
                    <p>Wybierz talię i kolumnę, która zawiera słówka. Następnie wybierz status słówek (np. "Uczone"), aby filtrować to, co aplikacja ma analizować.</p>
                  </div>
                  
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


                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60">Talia (Deck)</label>
                      {availableDecks.length > 0 ? (
                        <select 
                          value={settings.ankiDeckName}
                          onChange={(e) => setSettings({...settings, ankiDeckName: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none text-sm [&>option]:bg-[#151515] [&>option]:text-white"
                        >
                          {availableDecks.map(deck => (
                            <option key={deck} value={deck}>{deck}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type="text"
                          value={settings.ankiDeckName}
                          onChange={(e) => setSettings({...settings, ankiDeckName: e.target.value})}
                          placeholder="np. English"
                          className="w-full bg-[#151515]/30 border border-white/10 rounded-xl p-3 outline-none text-sm placeholder:text-white/25"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60">Kolumna słówek (Field)</label>
                      {availableFields.length > 0 ? (
                        <select 
                          value={settings.ankiFieldName}
                          onChange={(e) => setSettings({...settings, ankiFieldName: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none text-sm [&>option]:bg-[#151515] [&>option]:text-white"
                        >
                          {availableFields.map(field => (
                            <option key={field} value={field}>{field}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type="text"
                          value={settings.ankiFieldName}
                          onChange={(e) => setSettings({...settings, ankiFieldName: e.target.value})}
                          placeholder="np. Front"
                          className="w-full bg-[#151515]/30 border border-white/10 rounded-xl p-3 outline-none text-sm placeholder:text-white/25"
                        />
                      )}
                    </div>
                  </div>

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
                        className="w-full bg-[#151515]/30 border border-white/10 rounded-xl p-3 outline-none text-sm [&>option]:bg-[#151515] [&>option]:text-white"
                      >
                        <option value="all">Wszystkie</option>
                        <option value="learned">Uczone (Learning+)</option>
                        <option value="learning">Uczone (Learning)</option>
                        <option value="reviewed">Powtórzone (Review)</option>
                      </select>
                    </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60">Limit słówek (World Memory)</label>
                    <input 
                      type="number"
                      value={settings.worldMemory}
                      onChange={(e) => setSettings({...settings, worldMemory: parseInt(e.target.value) || 1000})}
                      className="w-full bg-[#151515]/30 border border-white/10 rounded-xl p-3 outline-none text-sm focus:border-blue-500/50"
                    />
                  </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60">Ostatnio widziane (dni)</label>
                      <input 
                        type="range"
                        min="0"
                        max="365"
                        value={settings.ankiFilterDays}
                        onChange={(e) => setSettings({...settings, ankiFilterDays: parseInt(e.target.value)})}
                        className="w-full accent-blue-500"
                      />
                      <div className="flex justify-between text-[10px] text-white/40">
                        <span>Bez limitu</span>
                        <span>{settings.ankiFilterDays === 0 ? 'Bez limitu' : `${settings.ankiFilterDays} dni`}</span>
                        <span>365 dni</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60">Sortowanie słówek według</label>
                      <select 
                        value={settings.ankiSortField || 'none'}
                        onChange={(e) => setSettings({...settings, ankiSortField: e.target.value as any})}
                        className="w-full bg-[#151515]/30 border border-white/10 rounded-xl p-3 outline-none text-sm [&>option]:bg-[#151515] [&>option]:text-white"
                      >
                        <option value="none">Brak (Domyślny algorytm)</option>
                        <option value="lastReview">Data ostatniego powtórzenia</option>
                        <option value="interval">Interwał powtórki (Interval)</option>
                        <option value="reps">Ilość powtórzeń (Reps)</option>
                        <option value="word">Alfabetycznie (A-Z)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60">Kierunek sortowania</label>
                      <select 
                        value={settings.ankiSortOrder || 'desc'}
                        onChange={(e) => setSettings({...settings, ankiSortOrder: e.target.value as any})}
                        className="w-full bg-[#151515]/30 border border-white/10 rounded-xl p-3 outline-none text-sm [&>option]:bg-[#151515] [&>option]:text-white"
                        disabled={settings.ankiSortField === 'none'}
                      >
                        <option value="asc">Rosnąco (Najstarsze jako pierwsze)</option>
                        <option value="desc">Malejąco (Najnowsze jako pierwsze)</option>
                      </select>
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
                  </div>
                </div>
                
                <div className="bg-black/20 rounded-xl p-3 h-32 overflow-y-auto custom-scrollbar font-mono text-[10px] text-white/60 space-y-2 break-words">
                  {ankiLogs.length === 0 ? (
                    <p className="italic text-white/40">Logi synchronizacji (automatyczna w tle)...</p>
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
                    <span className="text-sm text-white/60 block">Zapisuj słówka i konfigurację w Cache</span>
                    <p className="text-[10px] text-white/40 italic">Zachowuj pobrane fiszki i deki po odświeżeniu strony</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.ankiCacheWords}
                    onChange={(e) => setSettings({...settings, ankiCacheWords: e.target.checked})}
                    className="w-5 h-5 accent-blue-500"
                  />
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
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <Terminal size={20} className="text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Lokalny LLM</h3>
                  </div>
                  <ChevronRight size={20} className="text-white/40 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="p-6 pt-0 space-y-6 border-t border-white/5 mt-2">
                  <label className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="relative flex items-center pt-1">
                      <input 
                        type="checkbox" 
                        className="peer sr-only"
                        checked={settings.useLocalLLM}
                        onChange={(e) => {
                          if (e.target.checked && !localEngineRef.current) {
                            setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] OSTRZEŻENIE: Model nie jest załadowany! Proszę go najpierw uruchomić.`, ...prev]);
                            return;
                          }
                          setSettings({...settings, useLocalLLM: e.target.checked});
                          setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Zmiana: Używanie lokalnego LLM = ${e.target.checked ? 'TAK' : 'NIE'}`, ...prev]);
                        }}
                      />
                      <div className="w-5 h-5 border-2 border-white/30 rounded flex items-center justify-center peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all">
                        <Check size={14} className="text-white opacity-0 peer-checked:opacity-100" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">Użyj LLM zamiast API</p>
                      <p className="text-xs text-white/50">
                        Wszystkie zapytania AI będą obsługiwane przez lokalny model. Model musi być najpierw załadowany!
                      </p>
                    </div>
                  </label>

                    <div className="space-y-4">
                      <label className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                        <div className="relative flex items-center pt-1">
                          <input 
                            type="checkbox" 
                            className="peer sr-only"
                            checked={settings.restrictToKnownWords}
                            onChange={(e) => setSettings({...settings, restrictToKnownWords: e.target.checked})}
                          />
                          <div className="w-5 h-5 border-2 border-white/30 rounded flex items-center justify-center peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all">
                            <Check size={14} className="text-white opacity-0 peer-checked:opacity-100" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-white">Ogranicz do znanych słów</p>
                          <p className="text-xs text-white/50">
                            LLM będzie używał tylko słówek, które już znasz, lub ograniczy zasób do zdefiniowanego limitu memory.
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60">Wybierz Model</label>
                      <select
                        value={
                          settings.localModelPath === 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC' ||
                          settings.localModelPath === 'Llama-3.1-8B-Instruct-q4f32_1-MLC' ||
                          settings.localModelPath === 'HF://welcoma/gemma-4-E2B-it-q4f16_1-MLC' ||
                          !settings.localModelPath
                            ? (settings.localModelPath || '')
                            : 'custom'
                        }
                        onChange={(e) => {
                          if (e.target.value !== 'custom') {
                            setSettings({...settings, localModelPath: e.target.value});
                          }
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-indigo-500/50 [&>option]:bg-[#151515] [&>option]:text-white"
                      >
                        <option value="">-- Wybierz model --</option>
                        <option value="Qwen2.5-0.5B-Instruct-q4f32_1-MLC">Qwen 2.5 (0.5B) - Szybki, mniejszy</option>
                        <option value="Llama-3.1-8B-Instruct-q4f32_1-MLC">Llama 3.1 (8B) - Większy, dokładniejszy</option>
                        <option value="HF://welcoma/gemma-4-E2B-it-q4f16_1-MLC">Gemma 4 E2B IT (q4f16) - Nowy WebGPU</option>
                        <option value="custom">Inny (własny URL / ID)</option>
                      </select>
                      
                      {(settings.localModelPath && 
                        settings.localModelPath !== 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC' && 
                        settings.localModelPath !== 'Llama-3.1-8B-Instruct-q4f32_1-MLC' && 
                        settings.localModelPath !== 'HF://welcoma/gemma-4-E2B-it-q4f16_1-MLC') || 
                        (!['Qwen2.5-0.5B-Instruct-q4f32_1-MLC', 'Llama-3.1-8B-Instruct-q4f32_1-MLC', 'HF://welcoma/gemma-4-E2B-it-q4f16_1-MLC', ''].includes(settings.localModelPath || '')) ? (
                        <input 
                          type="text"
                          value={settings.localModelPath || ''}
                          onChange={(e) => setSettings({...settings, localModelPath: e.target.value})}
                          placeholder="Wpisz ID modelu lub link HF://..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-indigo-500/50 mt-2"
                        />
                      ) : null}
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            const modelId = settings.localModelPath;
                            if (!modelId) {
                                setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] ERROR: Wybierz model!`, ...prev]);
                                return;
                            }
                            await loadLocalModel(modelId);
                          }}
                          disabled={isLocalModelLoading}
                          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition-all disabled:opacity-50"
                        >
                          {isLocalModelLoading ? 'Ładowanie...' : 'Pobierz i Uruchom'}
                        </button>

                        <button
                          onClick={async () => {
                            await loadModelFromCache();
                          }}
                          disabled={isLocalModelLoading}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition-all disabled:opacity-50"
                        >
                          Uruchom Załadowany
                        </button>
                      </div>

                      <button
                        onClick={async () => {
                          if (confirm("Czy na pewno chcesz wyczyścić wszystkie załadowane modele z pamięci przeglądarki? Naprawia to błędy 'Cache.add' i zawieszone pobieranie.")) {
                            const keys = await window.caches.keys();
                            for (const key of keys) {
                              await window.caches.delete(key);
                            }
                            setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Cache został wyczyszczony. Odśwież stronę.`, ...prev]);
                          }
                        }}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2 px-4 rounded-xl text-[10px] transition-all border border-red-500/20 uppercase tracking-widest"
                      >
                        Wyczyść Cache (Reset pobierania)
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-white/60">Logi diagnostyczne</label>
                        <div className="flex gap-3">
                          <button 
                            onClick={async () => {
                              const gpuStatus = await checkWebGPULimits();
                              alert(`Status WebGPU:\n\n${gpuStatus.message}`);
                            }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                          >
                            Sprawdź WebGPU
                          </button>
                          <button 
                            onClick={async () => {
                               if (navigator.storage && navigator.storage.estimate) {
                                 const estimate = await navigator.storage.estimate();
                                 const total = (estimate.quota || 0) / (1024**3);
                                 const used = (estimate.usage || 0) / (1024**3);
                                 const free = total - used;
                                 alert(`Miejsce w przeglądarce:\nWolne: ${free.toFixed(2)} GB\nUżyte: ${used.toFixed(2)} GB\nLimit: ${total.toFixed(2)} GB\n\nJeśli wolne < 7 GB, pobieranie modelu może się nie udać.`);
                               }
                            }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                          >
                            Sprawdź miejsce
                          </button>
                        </div>
                      </div>
                      <div className="h-32 overflow-y-auto bg-black/40 rounded-xl p-3 text-[10px] font-mono text-white/60 border border-white/5 custom-scrollbar">
                        {localModelLogs.map((log, i) => <div key={i}>{log}</div>)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60">Testowy Czat (Local LLM)</label>
                      <div className="h-48 overflow-y-auto bg-black/40 border border-white/10 rounded-xl p-3 space-y-3 custom-scrollbar">
                        {localModelChat.length === 0 ? (
                          <div className="text-[10px] text-white/30 text-center mt-10">Zainicjuj model, aby rozpocząć czat.</div>
                        ) : (
                          localModelChat.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`p-2 rounded-xl text-xs max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-500/20 text-indigo-100 rounded-tr-sm' : 'bg-white/10 text-white/90 rounded-tl-sm'}`}>
                                {msg.parts.map(p => p.text).join('')}
                                {msg.usage && (
                                  <div className="text-[9px] text-white/40 mt-1">
                                    Tokens: {msg.usage.total_tokens}, Speed: {msg.usage.speed?.toFixed(2) || 0} t/s
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                        {isLocalModelLoading && localModelChat.length > 0 && (
                          <div className="flex justify-start">
                            <div className="p-2 rounded-xl text-xs bg-white/10 text-white/90 rounded-tl-sm animate-pulse">Pisze...</div>
                          </div>
                        )}
                      </div>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!localModelInput.trim() || !localEngineRef.current || isLocalModelLoading) return;
                        
                        const userInput = localModelInput;
                        setLocalModelInput('');
                        const newUserMsg: Message = { id: Date.now().toString(), role: 'user', parts: [{ text: userInput }] };
                        setLocalModelChat(prev => [...prev, newUserMsg]);
                        setIsLocalModelLoading(true);
                        
                        const startTime = Date.now();
                        try {
                          const d = await localEngineRef.current.chat.completions.create({
                            messages: [...localModelChat, newUserMsg].map(m => ({ 
                              role: m.role === 'user' ? 'user' : 'assistant', 
                              content: m.parts[0].text 
                            })),
                            temperature: 0.7,
                          });
                          const endTime = Date.now();
                          const durationSeconds = (endTime - startTime) / 1000;
                          const rawAiText = d.choices[0].message.content || "";
                          const aiText = rawAiText
                            .replace(/<think>[\s\S]*?<\/think>/gi, '')
                            .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
                            .replace(/<think>[\s\S]*/gi, '')
                            .replace(/<thought>[\s\S]*/gi, '')
                            .trim();
                          const totalTokens = (d.usage?.total_tokens || 0);
                          const speed = totalTokens / durationSeconds;
                          
                          setLocalModelChat(prev => [...prev, { 
                            id: Date.now().toString(), 
                            role: 'model', 
                            parts: [{ text: aiText }],
                            usage: { total_tokens: totalTokens, speed: speed }
                          }]);
                        } catch (err: any) {
                          setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] CHAT ERROR: ${err.message}`, ...prev]);
                        } finally {
                          setIsLocalModelLoading(false);
                        }
                      }} className="flex gap-2">
                        <input
                          type="text"
                          value={localModelInput}
                          onChange={(e) => setLocalModelInput(e.target.value)}
                          placeholder="Napisz do modelu..."
                          disabled={!localEngineRef.current || isLocalModelLoading}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
                        />
                        <button type="submit" disabled={!localEngineRef.current || isLocalModelLoading} className="bg-indigo-500/20 text-indigo-400 p-2 rounded-xl hover:bg-indigo-500/30 transition-colors disabled:opacity-50">
                          <Send size={18} />
                        </button>
                      </form>
                      
                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={async () => {
                            try {
                              if (!('showDirectoryPicker' in window)) {
                                throw new Error("Do eksportu dużych modeli wymagana jest przeglądarka z obsługą File System Access API (np. Chrome, Edge).");
                              }
                              
                              setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Wybierz pusty folder na zapis modelu...`, ...prev]);
                              const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
                              
                              const cacheNames = await caches.keys();
                              const webLlmCaches = cacheNames.filter(name => name.includes('webllm') || name.includes('tvmjs'));
                              
                              if (webLlmCaches.length === 0) {
                                setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Cache jest pusty! Brak modelu do eksportu.`, ...prev]);
                                return;
                              }
                              
                              setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Rozpoczęto zapis plików modelu...`, ...prev]);
                              
                              const index: Record<string, any> = {};
                              let fileId = 0;
                              
                              for (const cacheName of webLlmCaches) {
                                const cache = await caches.open(cacheName);
                                const keys = await cache.keys();
                                for (const request of keys) {
                                  const response = await cache.match(request);
                                  if (!response) continue;
                                  const blob = await response.blob();
                                  const filename = `file_${fileId}`;
                                  
                                  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
                                  const writable = await fileHandle.createWritable();
                                  await writable.write(blob);
                                  await writable.close();
                                  
                                  index[filename] = {
                                    cacheName: cacheName,
                                    url: request.url,
                                    headers: [...response.headers.entries()]
                                  };
                                  fileId++;
                                  
                                  if (fileId % 10 === 0) {
                                    setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Zapisano ${fileId} plików...`, ...prev]);
                                  }
                                }
                              }
                              
                              const indexHandle = await dirHandle.getFileHandle('index.json', { create: true });
                              const indexWritable = await indexHandle.createWritable();
                              await indexWritable.write(JSON.stringify(index));
                              await indexWritable.close();

                              setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Zakończono eksport! Zapisano ${fileId} plików w folderze.`, ...prev]);
                            } catch (e: any) {
                              setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Błąd eksportu: ${e.message}`, ...prev]);
                            }
                          }}
                          className="text-xs bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 py-1.5 px-3 rounded-lg border border-indigo-500/20"
                        >
                          Eksportuj (Folder)
                        </button>
                        
                        <button 
                          onClick={async () => {
                            try {
                              if (!('showDirectoryPicker' in window)) {
                                throw new Error("Do importu dużych modeli wymagana jest przeglądarka z obsługą File System Access API (np. Chrome, Edge).");
                              }
                              
                              setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Wybierz folder z modelem...`, ...prev]);
                              const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
                              
                              setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Wczytywanie modelu z folderu...`, ...prev]);
                              
                              const indexHandle = await dirHandle.getFileHandle('index.json');
                              const indexFile = await indexHandle.getFile();
                              const indexText = await indexFile.text();
                              const index = JSON.parse(indexText);
                              let count = 0;
                              
                              for (const [filename, meta] of Object.entries(index)) {
                                try {
                                  const fileHandle = await dirHandle.getFileHandle(filename);
                                  const metaData = meta as any;
                                  const cache = await caches.open(metaData.cacheName || 'tvmjs');
                                  const file = await fileHandle.getFile();
                                  
                                  const options = { headers: new Headers(metaData.headers) };
                                  const response = new Response(file, options);
                                  const request = new Request(metaData.url);
                                  await cache.put(request, response);
                                  count++;
                                  
                                  if (count % 10 === 0) {
                                    setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Zaimportowano ${count} plików...`, ...prev]);
                                  }
                                } catch (fileErr) {
                                  console.warn('Skipping file', filename, fileErr);
                                }
                              }
                              
                              setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Zakończono import ${count} plików z folderu!`, ...prev]);
                            } catch (err: any) {
                              setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Błąd importu: ${err.message}`, ...prev]);
                            }
                          }}
                          className="text-xs bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 py-1.5 px-3 rounded-lg border border-indigo-500/20"
                        >
                          Importuj (Folder)
                        </button>

                        <button 
                          onClick={async () => {
                            try {
                              setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Czyszczenie cache...`, ...prev]);
                              const cacheNames = await caches.keys();
                              const webLlmCaches = cacheNames.filter(name => name.includes('webllm') || name.includes('tvmjs'));
                              
                              if (webLlmCaches.length === 0) {
                                setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Brak cache do wyczyszczenia.`, ...prev]);
                                return;
                              }
                              
                              for (const cacheName of webLlmCaches) {
                                await caches.delete(cacheName);
                              }
                              setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Cache wyczyszczony.`, ...prev]);
                            } catch (e: any) {
                              setLocalModelLogs(prev => [`[${new Date().toLocaleTimeString()}] Błąd czyszczenia: ${e.message}`, ...prev]);
                            }
                          }}
                          className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 py-1.5 px-3 rounded-lg"
                        >
                          Wyczyść Cache
                        </button>
                      </div>
                      
                    </div>
                  </div>
              </details>

              <details className="group bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden transition-all">
                <summary className="p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <SettingsIcon size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Ustawienia: Algorytm</h3>
                  </div>
                  <ChevronRight size={20} className="text-white/40 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="p-6 pt-0 space-y-6 border-t border-white/5 mt-2">
                  <div className="space-y-4">
                    

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60">Algorytm wyboru słówek</label>
                      <select 
                        value={settings.ankiAlgorithm}
                        onChange={(e) => setSettings({...settings, ankiAlgorithm: e.target.value as any})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
                      >
                        <option value="all">Wszystkie ze zbioru</option>
                        <option value="interval">Najdalszy czas powtórki (Interval)</option>
                        <option value="reps">Najbardziej problematyczne (Reps)</option>
                        <option value="learning">Nowo uczone (Learning)</option>
                        <option value="review">Powtarzane (Review)</option>
                        <option value="relearning">Ponownie uczone (Relearning)</option>
                      </select>
                      {settings.ankiAlgorithm === 'all' && <p className="text-[10px] text-white/40">Zwraca wszystkie słówka zachowując ich oryginalną kolejność.</p>}
                      {settings.ankiAlgorithm === 'interval' && <p className="text-[10px] text-white/40">Słówka analizowane i sortowane są po przewidywanym czasie do kolejnej powtórki (wybierane te najbardziej oddalone w czasie).</p>}
                      {settings.ankiAlgorithm === 'reps' && <p className="text-[10px] text-white/40">Wybierane są słówka z największą ilością dotychczasowych powtórzeń (te, które są najtrudniejsze i wymagają najwięcej uwagi).</p>}
                      {settings.ankiAlgorithm === 'learning' && <p className="text-[10px] text-white/40">Słówka, które niedawno poznałeś i jesteś w fazie pierwszego zapamiętywania.</p>}
                      {settings.ankiAlgorithm === 'review' && <p className="text-[10px] text-white/40">Słówka już opanowane, które przypominasz sobie po dłuższym czasie.</p>}
                      {settings.ankiAlgorithm === 'relearning' && <p className="text-[10px] text-white/40">Słówka, które zapomniałeś podczas przeglądu i uczysz się ich na nowo.</p>}
                    </div>


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
                      <SettingsIcon size={20} className="text-red-400" />
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
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
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
                    <p className="text-sm italic text-white/80">"{activeExplanation.originalText}"</p>
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
                      <ReactMarkdown>{activeExplanation.explanation}</ReactMarkdown>
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

      {!isInputFocused && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}

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
                    <div key={i} className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5 flex flex-col gap-2 hover:border-purple-500/30 transition-all shadow-lg hover:shadow-purple-500/10">
                      <span className="font-bold text-white text-lg tracking-tight">{word.word}</span>
                      <div className="flex flex-wrap gap-1">
                          {Object.entries(word.fields).filter(([k,v]) => k !== 'word' && v.length > 0 && v.length < 50).slice(0,2).map(([k,v]) => (
                            <span key={k} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/60">{v}</span>
                          ))}
                      </div>
                      <div className="mt-auto pt-3 border-t border-white/5 text-[10px] text-white/40 grid grid-cols-2 gap-2">
                        <p>Status: <span className="text-white/60 capitalize">{word.status}</span></p>
                        <p>Reps: <span className="text-white/60">{word.reps}</span></p>
                        {word.lastReview && (
                          <p className="col-span-2">Ostatnia powtórka: <span className="text-white/60">{new Date(word.lastReview).toLocaleDateString()}</span></p>
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

      {/* Onboarding Interactive Tutorial Modal */}
      <AnimatePresence>
        {showTutorialModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => {
              setShowTutorialModal(false);
              setTutorialStep(1);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#161616] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <BookOpen size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{t('tutorialTitle')}</h2>
                    <p className="text-xs text-blue-400 font-semibold">{t('stepsHeader', tutorialStep)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowTutorialModal(false);
                    setTutorialStep(1);
                  }}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/5 h-1">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: `${(tutorialStep / 4) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  className="bg-blue-500 h-full"
                />
              </div>
              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                
                {tutorialStep === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-3 py-4">
                      <div className="inline-flex p-4 bg-blue-500/10 text-blue-400 rounded-3xl border border-blue-500/20 animate-pulse">
                        <Languages size={48} />
                      </div>
                      <h3 className="text-2xl font-extrabold tracking-tight text-white">{t('step1Title')}</h3>
                      <p className="text-sm text-white/70 leading-relaxed max-w-md mx-auto">
                        {t('step1Desc')}
                      </p>
                    </div>

                    <div className="space-y-6 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest block">{t('nativeLangLabel')}</label>
                        <select 
                          value={settings.nativeLanguage}
                          onChange={(e) => setSettings({...settings, nativeLanguage: e.target.value as any})}
                          className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 outline-none text-sm text-white [&>option]:bg-[#151515] [&>option]:text-white"
                        >
                          {TOP_20_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>
                              {lang.flag} {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest block">{t('targetLangLabel')}</label>
                        <select 
                          value={settings.targetLanguage}
                          onChange={(e) => setSettings({...settings, targetLanguage: e.target.value as any})}
                          className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 outline-none text-sm text-white [&>option]:bg-[#151515] [&>option]:text-white"
                        >
                          {TOP_20_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>
                              {lang.flag} {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest block">Poziom zaawansowania (CEFR)</label>
                        <select 
                          value={settings.cefrLevel}
                          onChange={(e) => setSettings({...settings, cefrLevel: e.target.value as any})}
                          className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 outline-none text-sm text-white [&>option]:bg-[#151515] [&>option]:text-white"
                        >
                          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {tutorialStep === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">{t('step2Title')}</h3>
                      <p className="text-xs text-white/60 leading-relaxed">
                        {t('step2Desc')}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center space-y-2 hover:bg-white/[0.04] transition-all">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mx-auto font-bold text-xs">1</div>
                        <h4 className="text-xs font-bold text-white/80">Importuj talię</h4>
                        <p className="text-[10px] text-white/40 leading-relaxed">Załaduj swój plik APKG z taliami Anki.</p>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center space-y-2 hover:bg-white/[0.04] transition-all">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mx-auto font-bold text-xs">2</div>
                        <h4 className="text-xs font-bold text-white/80">Ćwicz, generuj ćwiczenia i sprawdzaj błędy</h4>
                        <p className="text-[10px] text-white/40 leading-relaxed">Filtruj słówka według poziomu nauki i ustaw pożądaną kolejność.</p>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center space-y-2 hover:bg-white/[0.04] transition-all">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mx-auto font-bold text-xs">3</div>
                        <h4 className="text-xs font-bold text-white/80">Rozmawiaj i ćwicz</h4>
                        <p className="text-[10px] text-white/40 leading-relaxed">AI zadba o to, by używać tylko i wyłącznie słówek z Twojej własnej talii.</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {tutorialStep === 3 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">{t('step3Title')}</h3>
                      <p className="text-xs text-white/60 leading-relaxed">
                        {t('step3Desc')}
                      </p>
                    </div>

                    <div className="space-y-4 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest block">Prześlij plik APKG</label>
                        <div 
                          className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-blue-500/50 hover:bg-white/[0.01] transition-all cursor-pointer relative group"
                          onClick={() => document.getElementById('tutorial-apkg-upload')?.click()}
                        >
                          <input 
                            type="file" 
                            id="tutorial-apkg-upload" 
                            accept=".apkg" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsSyncingAnki(true);
                              try {
                                const buffer = await file.arrayBuffer();
                                const JSZip = (window as any).JSZip;
                                const zip = await JSZip.loadAsync(buffer);
                                const dbFile = zip.file("collection.anki2") || zip.file("collection.anki21");
                                if (!dbFile) throw new Error("Brak bazy danych collection.anki2 w pliku apkg.");
                                const dbBuffer = await dbFile.async("arraybuffer");
                                const SQL = await (window as any).initSqlJs({
                                  locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
                                });
                                const db = new SQL.Database(new Uint8Array(dbBuffer));
                                const decksResult = db.exec("SELECT decks FROM col");
                                const decks = JSON.parse(decksResult[0].values[0][0] as string);
                                const modelsResult = db.exec("SELECT models FROM col");
                                const models = JSON.parse(modelsResult[0].values[0][0] as string);
                                setAnkiApkgData({ decks, models, db });
                                const deckNames = Object.values(decks).map((d: any) => d.name);
                                setAvailableDecks(deckNames);
                                if (deckNames.length > 0) {
                                  setSettings(prev => ({ ...prev, ankiDeckName: deckNames[0], useAnki: true }));
                                }
                                addLog(`Zaimportowano bazę danych z pliku APKG.`);
                                alert("Pomyślnie zaimportowano talię APKG!");
                              } catch (err: any) {
                                console.error(err);
                                alert(`Błąd importu pliku APKG: ${err.message}`);
                              } finally {
                                setIsSyncingAnki(false);
                              }
                            }}
                          />
                          <Database size={32} className="mx-auto text-blue-400 group-hover:scale-110 transition-transform mb-2" />
                          <p className="text-xs font-bold text-white/80">Przeciągnij plik .apkg lub kliknij, aby wybrać</p>
                          <p className="text-[10px] text-white/30 mt-1">Obsługuje standardowe pakiety wyeksportowane z Anki</p>
                        </div>
                      </div>

                      {availableDecks.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 mt-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Aktywna Talia</label>
                            <select 
                              value={settings.ankiDeckName}
                              onChange={(e) => setSettings({...settings, ankiDeckName: e.target.value})}
                              className="w-full bg-[#151515] border border-white/10 rounded-xl p-2.5 text-xs text-white [&>option]:bg-[#151515]"
                            >
                              {availableDecks.map(deck => (
                                <option key={deck} value={deck}>{deck}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Pole Słówka (Field)</label>
                            {availableFields.length > 0 ? (
                              <select 
                                value={settings.ankiFieldName}
                                onChange={(e) => setSettings({...settings, ankiFieldName: e.target.value})}
                                className="w-full bg-[#151515] border border-white/10 rounded-xl p-2.5 text-xs text-white [&>option]:bg-[#151515]"
                              >
                                {availableFields.map(f => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                            ) : (
                              <input 
                                type="text"
                                value={settings.ankiFieldName}
                                onChange={(e) => setSettings({...settings, ankiFieldName: e.target.value})}
                                placeholder="np. Front"
                                className="w-full bg-[#151515] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {tutorialStep === 4 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">{t('step4Title')}</h3>
                      <p className="text-xs text-white/60 leading-relaxed">
                        {t('step4Desc')}
                      </p>
                    </div>

                    <div className="space-y-4 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Status słówek</label>
                          <select 
                            value={settings.ankiFilterStatus}
                            onChange={(e) => setSettings({...settings, ankiFilterStatus: e.target.value as any})}
                            className="w-full bg-[#151515] border border-white/10 rounded-xl p-2.5 text-xs text-white [&>option]:bg-[#151515] [&>option]:text-white"
                          >
                            <option value="all">Wszystkie</option>
                            <option value="learned">Uczone (Learning+)</option>
                            <option value="learning">Uczone (Learning)</option>
                            <option value="reviewed">Powtórzone (Review)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Limit Słówek (World Memory)</label>
                          <input 
                            type="number"
                            value={settings.worldMemory}
                            onChange={(e) => setSettings({...settings, worldMemory: parseInt(e.target.value) || 1000})}
                            className="w-full bg-[#151515] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500/50"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Sortowanie według</label>
                          <select 
                            value={settings.ankiSortField || 'none'}
                            onChange={(e) => setSettings({...settings, ankiSortField: e.target.value as any})}
                            className="w-full bg-[#151515] border border-white/10 rounded-xl p-2.5 text-xs text-white [&>option]:bg-[#151515] [&>option]:text-white"
                          >
                            <option value="none">Brak (Domyślny algorytm)</option>
                            <option value="lastReview">Data ostatniego powtórzenia</option>
                            <option value="interval">Interwał powtórki (Interval)</option>
                            <option value="reps">Ilość powtórzeń (Reps)</option>
                            <option value="word">Alfabetycznie (A-Z)</option>
                          </select>
                        </div>
                      </div>

                      {/* Section Guide illustration */}
                      <div className="pt-4 border-t border-white/5 space-y-3">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest block">PRZEWODNIK PO PROGRAMIE</span>
                        
                        <div className="flex gap-3 items-start p-3 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                          <MessageSquare size={16} className="text-blue-400 mt-0.5 shrink-0" />
                          <div className="space-y-0.5 text-left">
                            <h4 className="text-xs font-bold text-white/80">Czat z AI (Dialogue)</h4>
                            <p className="text-[10px] text-white/50 leading-relaxed">Prowadź rozmowę z AI. Asystent poprawia każdy błąd i analizuje Twoją gramatykę.</p>
                          </div>
                        </div>

                        <div className="flex gap-3 items-start p-3 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                          <PenTool size={16} className="text-purple-400 mt-0.5 shrink-0" />
                          <div className="space-y-0.5 text-left">
                            <h4 className="text-xs font-bold text-white/80">Gramatyka i Ćwiczenia</h4>
                            <p className="text-[10px] text-white/50 leading-relaxed">Generuj zadania bazujące na Twoich słówkach z Anki – od prostych luk do tłumaczeń.</p>
                          </div>
                        </div>

                        <div className="flex gap-3 items-start p-3 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                          <Database size={16} className="text-green-400 mt-0.5 shrink-0" />
                          <div className="space-y-0.5 text-left">
                            <h4 className="text-xs font-bold text-white/80">Słownik (Anki Vocab)</h4>
                            <p className="text-[10px] text-white/50 leading-relaxed">Przeglądaj, przeszukuj i sortuj zsynchronizowane słówka oraz sprawdzaj ich postęp.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              {/* Footer */}
              <div className="p-6 bg-[#1f1f1f]/80 border-t border-white/5 flex justify-between">
                <button 
                  onClick={() => setTutorialStep(prev => Math.max(1, prev - 1))}
                  disabled={tutorialStep === 1}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all text-white"
                >
                  {t('prev')}
                </button>

                {tutorialStep < 4 ? (
                  <button 
                    onClick={() => setTutorialStep(prev => Math.min(4, prev + 1))}
                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 text-white"
                  >
                    {t('next')}
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setShowTutorialModal(false);
                      setTutorialStep(1);
                      syncAnki();
                    }}
                    className="px-6 py-2.5 bg-green-500 hover:bg-green-600 rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-500/20 text-white"
                  >
                    {t('finish')} 🎉
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
