const fs = require('fs');
let code = fs.readFileSync('src/components/LocalAITab.tsx', 'utf8');

const targetStr = `<div className="space-y-3 pt-2">
            <h3 className="font-bold text-white text-sm border-t border-white/10 pt-4">Konfiguracja Lokalne API (Telefon)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Adres IP telefonu (Endpoint URL)</span>
                <GlassInput 
                  value={settings.phoneLLMUrl}
                  onChange={(e) => setSettings({...settings, phoneLLMUrl: e.target.value})}
                  placeholder="http://192.168.43.1:9379/v1"
                  className="w-full"
                />
              </label>
              
              <label className="block space-y-1">
                <span className="text-xs font-bold text-white/70 uppercase tracking-widest">ID Modelu</span>
                <GlassInput 
                  value={settings.phoneLLMModel || ''}
                  onChange={(e) => setSettings({...settings, phoneLLMModel: e.target.value})}
                  placeholder="gemma-4-E4B-it-gpu.litertlm"
                  className="w-full"
                />
              </label>
            </div>
            <p className="text-[10px] text-white/40">Zmień ten adres, jeśli twój hotspot Wi-Fi przydzieli telefonowi inne IP, lub id modelu, jeśli na serwerze używasz innego modelu.</p>`;

const replacement = `{settings.usePhoneLLM && (
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-white text-sm border-t border-white/10 pt-4">Konfiguracja Lokalne API (Telefon)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Adres IP telefonu (Endpoint URL)</span>
                <GlassInput 
                  value={settings.phoneLLMUrl}
                  onChange={(e) => setSettings({...settings, phoneLLMUrl: e.target.value})}
                  placeholder="http://192.168.43.1:9379/v1"
                  className="w-full"
                />
              </label>
              
              <label className="block space-y-1">
                <span className="text-xs font-bold text-white/70 uppercase tracking-widest">ID Modelu</span>
                <GlassInput 
                  value={settings.phoneLLMModel || ''}
                  onChange={(e) => setSettings({...settings, phoneLLMModel: e.target.value})}
                  placeholder="gemma-4-E4B-it-gpu.litertlm"
                  className="w-full"
                />
              </label>
            </div>
            <p className="text-[10px] text-white/40">Zmień ten adres, jeśli twój hotspot Wi-Fi przydzieli telefonowi inne IP, lub id modelu, jeśli na serwerze używasz innego modelu.</p>
          </div>
          )}
          
          {settings.useLmStudio && (
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-white text-sm border-t border-white/10 pt-4">Konfiguracja LM Studio (PC)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Adres lokalny (Endpoint URL)</span>
                <GlassInput 
                  value={settings.lmStudioUrl || 'http://localhost:1234/v1'}
                  onChange={(e) => setSettings({...settings, lmStudioUrl: e.target.value})}
                  placeholder="http://localhost:1234/v1"
                  className="w-full"
                />
              </label>
              
              <label className="block space-y-1">
                <span className="text-xs font-bold text-white/70 uppercase tracking-widest">ID Modelu</span>
                <GlassInput 
                  value={settings.lmStudioModel || 'local-model'}
                  onChange={(e) => setSettings({...settings, lmStudioModel: e.target.value})}
                  placeholder="local-model"
                  className="w-full"
                />
              </label>
            </div>
            <p className="text-[10px] text-white/40">LM Studio domyślnie uruchamia serwer na porcie 1234.</p>
          </div>
          )}`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('src/components/LocalAITab.tsx', code);
} else {
  console.log("Could not find target string.");
}
