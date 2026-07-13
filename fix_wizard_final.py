with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

start_line = 3163
end_line = 3737

new_content = """              {/* Content Area */}
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
"""

new_lines = lines[:start_line-1] + [new_content] + lines[end_line:]

with open('src/App.tsx', 'w') as f:
    f.writelines(new_lines)
