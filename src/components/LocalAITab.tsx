import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Smartphone, CheckCircle2, XCircle, RefreshCw, Wifi } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from './GlassUI';
import { UserSettings } from '../types';

interface LocalAITabProps {
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
}

export const LocalAITab: React.FC<LocalAITabProps> = ({ settings, setSettings }) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const testConnection = async () => {
    setTestStatus('testing');
    setErrorMessage('');
    
    try {
      // Remove trailing slash if present, and /chat/completions if user accidentally added it
      let baseUrl = settings.phoneLLMUrl.trim();
      if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
      if (baseUrl.endsWith('/chat/completions')) baseUrl = baseUrl.replace('/chat/completions', '');
      
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        // timeout is not directly supported in fetch, but this works for basic testing
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
      setErrorMessage("Nie można połączyć się z lokalnym AI. Sprawdź, czy telefon jest połączony z hotspotem i czy Gemma jest uruchomiona.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pb-10 pr-2 min-h-0"
    >
      <h1 className="text-3xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
        Lokalne AI API
      </h1>

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
              <p className="text-xs text-white/50">Gdy aktywne, aplikacja użyje modelu Gemma 4 E4B przez lokalne API zamiast wbudowanych usług.</p>
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

          <div className={`space-y-3 transition-all ${settings.usePhoneLLM ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
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
      
      <GlassCard className="p-6">
        <h3 className="font-bold mb-4 text-white/80">Instrukcja uruchomienia:</h3>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-white/60">
          <li>Włącz <strong>Hotspot Wi-Fi</strong> na telefonie (lub tablecie).</li>
          <li>Połącz oba urządzenia do tej samej sieci.</li>
          <li>Sprawdź adres IP telefonu w sieci (często jest to <code>192.168.43.1</code>).</li>
          <li>Uruchom Termux na telefonie.</li>
          <li>Odpal LiteRT-LM (np. poleceniem <code>./litert-lm --model gemma-4-E4B-it-gpu --host 0.0.0.0 --port 9379</code>).</li>
          <li>Wpisz poprawny adres powyżej i kliknij "Test połączenia".</li>
        </ol>
      </GlassCard>
    </motion.div>
  );
};
