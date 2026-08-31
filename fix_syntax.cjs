const fs = require('fs');
let code = fs.readFileSync('src/components/LocalAITab.tsx', 'utf8');

// There are extra closing tags right before "Test połączenia" button
// Let's just find the exact part and replace it.

const problem = `          </div>
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
          )}

            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">`;

// If we remove the extra `</div>` at the end of the `useLmStudio` wrapper, and wrap the button in something else or just leave it...
// Actually, originally:
// <div className="space-y-4"> // opened at top
//    <div className="space-y-3">... radio buttons ...</div>
//    <div className="space-y-3 pt-2"> ... settings ...
//       <div className="pt-4"> ... button ... </div>
//    </div>
// </div>

// We can just add `<div className="space-y-3 pt-2">` back for the button, or simply remove the two closing tags that are breaking it.
// Let's just wrap the button group in an empty fragment or div so it balances out, and we remove one `</div>` from the end of the file.

const fixed = `          </div>
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
          )}
          
          <div className="space-y-3 pt-2">
            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">`;

code = code.replace(problem, fixed);
fs.writeFileSync('src/components/LocalAITab.tsx', code);
