import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, CheckCircle2, XCircle, RefreshCw, Wifi, Send, Trash2, Bot, User, Sparkles, Clock, Zap } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from './GlassUI';
import { UserSettings } from '../types';

interface LocalAITabProps {
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
}

interface TestChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  latency?: number;
  tokens?: number;
}

export const LocalAITab: React.FC<LocalAITabProps> = ({ settings, setSettings }) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Test chat state
  const [messages, setMessages] = useState<TestChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Cześć! Jestem Twoim lokalnym modelem Gemma 4 E4B działającym na telefonie. Przetestuj moje działanie wysyłając wiadomość poniżej!',
      timestamp: Date.now()
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const testConnection = async () => {
    setTestStatus('testing');
    setErrorMessage('');
    
    try {
      let cleanUrl = (settings.phoneLLMUrl || 'http://localhost:9379/v1').trim().replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
      const modelsEndpoint = cleanUrl.endsWith('/v1') ? `${cleanUrl}/models` : `${cleanUrl}/v1/models`;
      
      const response = await fetch(modelsEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.data) {
        setTestStatus('success');
      } else {
        throw new Error('Invalid JSON format');
      }
    } catch (err: any) {
      setTestStatus('error');
      setErrorMessage("Nie można połączyć się z lokalnym AI. Sprawdź, czy telefon jest połączony i czy LiteRT-LM jest uruchomiony na http://localhost:9379/v1.");
    }
  };

  const sendChatMessage = async (customText?: string) => {
    const textToSend = customText || inputPrompt.trim();
    if (!textToSend || isGenerating) return;

    const userMsg: TestChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputPrompt('');
    setIsGenerating(true);

    const startTime = Date.now();

    try {
      let cleanUrl = (settings.phoneLLMUrl || 'http://localhost:9379/v1').trim().replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
      const chatEndpoint = cleanUrl.endsWith('/v1') ? `${cleanUrl}/chat/completions` : `${cleanUrl}/v1/chat/completions`;

      // Prepare conversation payload for OpenAI-compatible endpoint
      const payloadMessages = newMessages
        .filter(m => m.id !== 'welcome' && m.content && m.content.trim())
        .map(m => ({
          role: m.role,
          content: m.content.trim()
        }));

      const payload = {
        model: "gemma-4-E4B-it-gpu.litertlm",
        messages: payloadMessages,
        temperature: 0.3
      };

      const res = await fetch(chatEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Błąd HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const latency = Date.now() - startTime;
      let replyContent = data.choices?.[0]?.message?.content || "Brak odpowiedzi od modelu.";
      
      // Clean thinking tags if any
      replyContent = replyContent.replace(/<think>[\s\S]*?<\/think>/gi, '');
      replyContent = replyContent.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
      replyContent = replyContent.replace(/<think>[\s\S]*/gi, '');
      replyContent = replyContent.replace(/<thought>[\s\S]*/gi, '').trim();

      const assistantMsg: TestChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyContent,
        timestamp: Date.now(),
        latency,
        tokens: data.usage?.total_tokens
      };

      setMessages(prev => [...prev, assistantMsg]);
      setTestStatus('success');
    } catch (err: any) {
      const latency = Date.now() - startTime;
      const errorMsg: TestChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Błąd komunikacji z modelem: ${err.message || 'Nie można połączyć się z telefonem'}. Upewnij się, że serwer LiteRT-LM jest włączony.`,
        timestamp: Date.now(),
        latency
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Czat testowy został zresetowany. Możesz zadać nowe pytanie testowe.',
        timestamp: Date.now()
      }
    ]);
  };

  const quickPrompts = [
    'Cześć! Przedstaw się w 2 zdaniach.',
    'Wyjaśnij różnicę między Present Simple a Continuous.',
    'Popraw błąd: "She go to the shop yesterday".'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pb-10 pr-2 min-h-0"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Lokalne AI API
        </h1>
        {testStatus === 'success' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Połączono z Gemma 4 E4B
          </div>
        )}
      </div>

      <GlassCard className="p-6 space-y-6">
        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Smartphone className="text-blue-400" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Gemma 4 E4B (Telefon)</h2>
            <p className="text-xs text-white/50">Wymaga Termux + LiteRT-LM uruchomionego na telefonie</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
            <div className="space-y-1">
              <span className="font-bold text-white text-sm">Włącz połączenie z telefonem</span>
              <p className="text-xs text-white/50">Gdy aktywne, cała aplikacja użyje modelu Gemma 4 E4B z telefonu zamiast API Gemini.</p>
            </div>
            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
              <input 
                type="checkbox" 
                checked={settings.usePhoneLLM}
                onChange={(e) => setSettings({...settings, usePhoneLLM: e.target.checked})}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-600 appearance-none cursor-pointer"
              />
              <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"></label>
            </div>
          </label>

          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Adres IP telefonu (Endpoint URL)</span>
              <GlassInput 
                value={settings.phoneLLMUrl}
                onChange={(e) => setSettings({...settings, phoneLLMUrl: e.target.value})}
                placeholder="http://192.168.43.1:9379/v1"
                className="w-full"
              />
            </label>
            <p className="text-[10px] text-white/40">Zmień ten adres, jeśli twój hotspot Wi-Fi przydzieli telefonowi inne IP.</p>

            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <GlassButton 
                variant={testStatus === 'success' ? 'secondary' : 'primary'}
                onClick={testConnection}
                disabled={testStatus === 'testing' || !settings.phoneLLMUrl}
                className="w-full sm:w-auto px-6 py-2 rounded-xl flex items-center justify-center gap-2"
              >
                {testStatus === 'testing' ? (
                  <RefreshCw size={18} className="animate-spin text-blue-400" />
                ) : (
                  <Wifi size={18} />
                )}
                <span>Test połączenia</span>
              </GlassButton>

              {testStatus === 'success' && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                  <CheckCircle2 size={18} />
                  <span>Połączono z Gemma 4 E4B!</span>
                </div>
              )}
            </div>

            {testStatus === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex items-start gap-2">
                <XCircle size={18} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
      
      {/* Czat do testów z lokalnym modelem */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Bot className="text-purple-400" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Czat testowy z Gemma 4 E4B
                {isGenerating && (
                  <span className="text-[11px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full animate-pulse font-normal">
                    generowanie...
                  </span>
                )}
              </h3>
              <p className="text-xs text-white/50">Wysyłaj bezpośrednie zapytania do endpointu /chat/completions na telefonie</p>
            </div>
          </div>
          {messages.length > 1 && (
            <button
              onClick={clearChat}
              title="Wyczyść historię testu"
              className="p-2 hover:bg-white/10 text-white/60 hover:text-red-400 rounded-lg transition-colors flex items-center gap-1 text-xs"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Wyczyść</span>
            </button>
          )}
        </div>

        {/* Szybkie propozycje zapytań */}
        <div className="flex flex-wrap gap-2 pt-1">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              disabled={isGenerating}
              onClick={() => sendChatMessage(qp)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 text-left disabled:opacity-50"
            >
              <Sparkles size={12} className="text-blue-400 shrink-0" />
              <span>{qp}</span>
            </button>
          ))}
        </div>

        {/* Okno wiadomości */}
        <div className="bg-black/30 border border-white/10 rounded-2xl p-4 min-h-[220px] max-h-[400px] overflow-y-auto custom-scrollbar space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center shrink-0 mt-1">
                    <Bot size={16} className="text-purple-300" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20'
                      : 'bg-white/10 border border-white/10 text-white/90 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {(msg.latency !== undefined || msg.tokens !== undefined) && (
                    <div className="flex items-center gap-3 pt-1 text-[10px] text-white/40 border-t border-white/5">
                      {msg.latency !== undefined && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {msg.latency} ms
                        </span>
                      )}
                      {msg.tokens !== undefined && (
                        <span className="flex items-center gap-1">
                          <Zap size={11} />
                          {msg.tokens} tokenów
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center shrink-0 mt-1">
                    <User size={16} className="text-blue-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center shrink-0 mt-1">
                <Bot size={16} className="text-purple-300" />
              </div>
              <div className="bg-white/10 border border-white/10 text-white/70 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin text-blue-400" />
                <span>Gemma 4 E4B przetwarza zapytanie...</span>
              </div>
            </motion.div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Formularz wprowadzania wiadomości */}
        <div className="flex items-center gap-2">
          <GlassInput
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder="Napisz wiadomość testową do modelu Gemma na telefonie..."
            className="flex-1"
          />
          <GlassButton
            variant="primary"
            onClick={() => sendChatMessage()}
            disabled={isGenerating || !inputPrompt.trim()}
            className="px-4 py-2.5 rounded-xl shrink-0 flex items-center justify-center"
          >
            {isGenerating ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </GlassButton>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="font-bold mb-4 text-white/80">Instrukcja uruchomienia:</h3>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-white/60">
          <li>Włącz <strong>Hotspot Wi-Fi</strong> na telefonie (lub tablecie).</li>
          <li>Połącz oba urządzenia do tej samej sieci.</li>
          <li>Sprawdź adres IP telefonu w sieci (często jest to <code>192.168.43.1</code>).</li>
          <li>Uruchom Termux na telefonie.</li>
          <li>Odpal LiteRT-LM (np. poleceniem <code>./litert-lm --model gemma-4-E4B-it-gpu --host 0.0.0.0 --port 9379</code>).</li>
          <li>Wpisz poprawny adres powyżej, kliknij "Test połączenia" lub od razu wyślij wiadomość testową w czacie powyżej.</li>
        </ol>
      </GlassCard>
    </motion.div>
  );
};

