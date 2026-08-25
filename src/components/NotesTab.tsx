import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  FileText, 
  Trash2, 
  Plus, 
  Cpu, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  Layers, 
  RefreshCw,
  Database,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from './GlassUI';
import bm25 from 'wink-bm25-text-search';
import { 
  EmbeddingEngine, 
  EMBEDDING_MODELS, 
  cosineSimilarity, 
  ModelProgress, 
  EmbeddingModelOption 
} from '../services/EmbeddingEngine';

interface NoteParagraphEmbedding {
  text: string;
  vector: number[];
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  embeddings?: NoteParagraphEmbedding[];
  embeddedModelId?: string;
}

export const NotesTab: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('lingu_notes');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'hybrid' | 'semantic' | 'bm25'>('hybrid');

  // Local AI Model State
  const [selectedModelId, setSelectedModelId] = useState<string>('Xenova/multilingual-e5-small');
  const [selectedDevice, setSelectedDevice] = useState<'webgpu' | 'wasm'>('webgpu');
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<ModelProgress | null>(null);
  const [isEmbeddingProcessing, setIsEmbeddingProcessing] = useState(false);
  const [embeddingProgressText, setEmbeddingProgressText] = useState('');
  const [showModelSettings, setShowModelSettings] = useState(false);

  // Check if WebGPU is supported
  const webGpuAvailable = typeof navigator !== 'undefined' && !!(navigator as any).gpu;

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('lingu_notes', JSON.stringify(notes));
  }, [notes]);

  // BM25 setup for current active note
  const bm25Engine = useMemo(() => {
    const bm = bm25();
    const prepTask = (text: string) => {
      if (typeof text !== 'string') return [];
      return text.toLowerCase().split(/[\s\W]+/).filter(w => w.length > 0);
    };
    bm.defineConfig({ fldWeights: { text: 1 } });
    bm.definePrepTasks([prepTask]);

    if (activeNote && activeNote.content) {
      const paragraphs = activeNote.content.split(/\n+/).filter(p => p.trim().length > 0);
      paragraphs.forEach((p, idx) => {
        bm.addDoc({ text: p }, idx);
      });
      bm.consolidate();
    }
    return bm;
  }, [activeNote]);

  // Load and cache embedding model
  const loadEmbeddingModel = async () => {
    setIsModelLoading(true);
    setDownloadProgress({ status: 'initing', progress: 0 });
    try {
      await EmbeddingEngine.getExtractor(selectedModelId, selectedDevice, (p) => {
        setDownloadProgress(p);
      });
      setIsModelReady(true);
    } catch (err) {
      console.error('Error loading embedding model:', err);
    } finally {
      setIsModelLoading(false);
    }
  };

  // Generate vector embeddings for active note paragraphs
  const generateEmbeddingsForActiveNote = async () => {
    if (!activeNote || !activeNote.content.trim()) return;
    setIsEmbeddingProcessing(true);

    try {
      if (!isModelReady) {
        await loadEmbeddingModel();
      }

      const paragraphs = activeNote.content.split(/\n+/).filter(p => p.trim().length > 0);
      const newEmbeddings: NoteParagraphEmbedding[] = [];

      for (let i = 0; i < paragraphs.length; i++) {
        const text = paragraphs[i];
        setEmbeddingProgressText(`Indeksowanie akapitu ${i + 1}/${paragraphs.length}...`);
        
        const vector = await EmbeddingEngine.embedText(
          text,
          selectedModelId,
          selectedDevice,
          false
        );

        newEmbeddings.push({ text, vector });
      }

      const updatedNote = {
        ...activeNote,
        embeddings: newEmbeddings,
        embeddedModelId: selectedModelId
      };

      setActiveNote(updatedNote);
      setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
    } catch (err) {
      console.error('Embedding generation failed:', err);
    } finally {
      setIsEmbeddingProcessing(false);
      setEmbeddingProgressText('');
    }
  };

  // Search logic state (Semantic + BM25 + Hybrid)
  const [queryVector, setQueryVector] = useState<number[] | null>(null);
  const [isQueryEmbeddingLoading, setIsQueryEmbeddingLoading] = useState(false);

  // Re-embed search query when it changes in semantic or hybrid search mode
  useEffect(() => {
    if (!searchQuery.trim() || !activeNote || searchMode === 'bm25') {
      setQueryVector(null);
      return;
    }

    let isMounted = true;
    const timeoutId = setTimeout(async () => {
      if (!isModelReady) return;
      setIsQueryEmbeddingLoading(true);
      try {
        const vector = await EmbeddingEngine.embedText(
          searchQuery,
          selectedModelId,
          selectedDevice,
          true
        );
        if (isMounted) setQueryVector(vector);
      } catch (err) {
        console.error('Error embedding query:', err);
      } finally {
        if (isMounted) setIsQueryEmbeddingLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, activeNote, searchMode, isModelReady, selectedModelId, selectedDevice]);

  // Calculate search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !activeNote) return [];
    const paragraphs = activeNote.content.split(/\n+/).filter(p => p.trim().length > 0);
    if (paragraphs.length === 0) return [];

    // 1. BM25 search scores
    const bm25RawResults = bm25Engine.search(searchQuery);
    const bm25ScoreMap = new Map<number, number>();
    let maxBm25Score = 0.0001;

    bm25RawResults.forEach((r: any) => {
      const idx = r[0];
      const score = r[1];
      bm25ScoreMap.set(idx, score);
      if (score > maxBm25Score) maxBm25Score = score;
    });

    // 2. Vector search scores
    const results = paragraphs.map((text, idx) => {
      let semanticScore = 0;
      const embeddingItem = activeNote.embeddings?.[idx];

      if (queryVector && embeddingItem && embeddingItem.vector) {
        semanticScore = cosineSimilarity(queryVector, embeddingItem.vector);
        // Normalize cosine similarity [-1..1] to [0..1]
        semanticScore = Math.max(0, semanticScore);
      }

      const bm25Raw = bm25ScoreMap.get(idx) || 0;
      const bm25Norm = bm25Raw / maxBm25Score;

      // Calculate final combined score based on active search mode
      let finalScore = 0;
      if (searchMode === 'bm25') {
        finalScore = bm25Norm;
      } else if (searchMode === 'semantic') {
        finalScore = semanticScore;
      } else {
        // Hybrid: 60% Semantic + 40% BM25
        finalScore = (semanticScore * 0.6) + (bm25Norm * 0.4);
      }

      return {
        idx,
        text,
        semanticScore,
        bm25Raw,
        finalScore
      };
    });

    // Filter out zero-relevance items and sort descending by finalScore
    return results
      .filter(r => r.finalScore > 0.01 || r.bm25Raw > 0)
      .sort((a, b) => b.finalScore - a.finalScore);
  }, [searchQuery, activeNote, bm25Engine, queryVector, searchMode]);

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Nowa Notatka',
      content: '',
      createdAt: Date.now()
    };
    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(notes.filter(n => n.id !== id));
    if (activeNote?.id === id) setActiveNote(null);
  };

  const updateActiveNote = (updates: Partial<Note>) => {
    if (!activeNote) return;
    const updated = { ...activeNote, ...updates };
    setActiveNote(updated);
    setNotes(notes.map(n => n.id === updated.id ? updated : n));
  };

  const currentModelInfo = EMBEDDING_MODELS.find(m => m.id === selectedModelId);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col min-h-0 relative h-full"
    >
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            Notatki & Baza Wektorowa
          </h1>
          <p className="text-white/40 text-xs font-medium uppercase tracking-widest mt-0.5">
            Wyszukiwanie Hybrydowe (BM25 + WebGPU Embeddings)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton 
            variant="secondary" 
            onClick={() => setShowModelSettings(!showModelSettings)}
            className="px-3 py-2 rounded-xl flex items-center gap-2 text-xs"
          >
            <Cpu size={16} className={isModelReady ? "text-emerald-400" : "text-amber-400"} />
            <span className="hidden sm:inline">Model AI</span>
            {showModelSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </GlassButton>

          <GlassButton variant="primary" onClick={createNote} className="px-4 py-2 rounded-xl flex items-center gap-2 text-xs">
            <Plus size={16} />
            <span className="hidden sm:inline">Nowa Notatka</span>
          </GlassButton>
        </div>
      </div>

      {/* Model & WebGPU Settings Panel */}
      <AnimatePresence>
        {showModelSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden shrink-0"
          >
            <GlassCard className="p-4 bg-white/5 border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="text-blue-400" size={18} />
                  <div>
                    <h3 className="text-sm font-bold text-white">Lokalne Modele Embeddingowe (ONNX)</h3>
                    <p className="text-[11px] text-white/50">Model zapisuje się w Cache przeglądarki do pracy w 100% offline.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
                    webGpuAvailable 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {webGpuAvailable ? '● WebGPU Aktywne' : '▲ WASM CPU Fallback'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Select Model */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/60">Wybierz Model Wektorowy</label>
                  <select 
                    value={selectedModelId}
                    onChange={(e) => {
                      setSelectedModelId(e.target.value);
                      setIsModelReady(false);
                    }}
                    disabled={isModelLoading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none [&>option]:bg-[#151515]"
                  >
                    {EMBEDDING_MODELS.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.size}) {m.recommended ? '★ Zalecany' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hardware Execution */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/60">Acelerator Sprzętowy</label>
                  <select 
                    value={selectedDevice}
                    onChange={(e) => {
                      setSelectedDevice(e.target.value as any);
                      setIsModelReady(false);
                    }}
                    disabled={isModelLoading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none [&>option]:bg-[#151515]"
                  >
                    <option value="webgpu" disabled={!webGpuAvailable}>WebGPU (Najszybszy GPU)</option>
                    <option value="wasm">WASM CPU (Kompatybilny)</option>
                  </select>
                </div>

                {/* Download / Status Action */}
                <div className="space-y-1 flex flex-col justify-end">
                  <GlassButton
                    variant={isModelReady ? "secondary" : "primary"}
                    onClick={loadEmbeddingModel}
                    disabled={isModelLoading}
                    className="w-full py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
                  >
                    {isModelLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin text-blue-400" />
                        <span>Pobieranie ONNX...</span>
                      </>
                    ) : isModelReady ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span>Model Gotowy w Cache</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        <span>Pobierz Model do Cache</span>
                      </>
                    )}
                  </GlassButton>
                </div>
              </div>

              {/* Download Progress Bar */}
              {isModelLoading && downloadProgress && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-white/60">
                    <span>{downloadProgress.file ? `Plik: ${downloadProgress.file}` : 'Przygotowywanie...'}</span>
                    <span>{Math.round(downloadProgress.progress || 0)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${downloadProgress.progress || 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              {currentModelInfo && (
                <p className="text-[11px] text-white/50 italic border-t border-white/5 pt-2">
                  {currentModelInfo.description}
                </p>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main View */}
      {!activeNote ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pb-20 custom-scrollbar pr-2 flex-1">
          {notes.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 h-64 flex flex-col items-center justify-center text-white/40 space-y-3">
              <FileText size={48} className="opacity-50" />
              <p className="text-sm font-medium">Brak notatek. Kliknij "Nowa Notatka" aby dodać tekst.</p>
            </div>
          ) : (
            notes.map(note => {
              const hasEmbeddings = note.embeddings && note.embeddings.length > 0;
              return (
                <GlassCard 
                  key={note.id} 
                  className="p-5 cursor-pointer hover:bg-white/10 transition-colors group relative flex flex-col justify-between"
                  onClick={() => setActiveNote(note)}
                >
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => deleteNote(note.id, e)} 
                      className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2 pr-10">
                      <h3 className="font-bold text-lg text-white truncate">{note.title}</h3>
                    </div>

                    <p className="text-white/50 text-xs line-clamp-3 leading-relaxed mb-4">
                      {note.content || "Pusta notatka..."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] text-white/40">
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    {hasEmbeddings ? (
                      <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Zap size={10} /> {note.embeddings?.length} wektorów AI
                      </span>
                    ) : (
                      <span className="text-white/30">Brak indeksu wektorowego</span>
                    )}
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-hidden gap-3 pb-20 flex-1">
          {/* Note Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              <button 
                onClick={() => setActiveNote(null)}
                className="text-white/60 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest px-2 py-1 bg-white/5 rounded-lg border border-white/10"
              >
                ← Wróć
              </button>
              <input 
                type="text"
                value={activeNote.title}
                onChange={(e) => updateActiveNote({ title: e.target.value })}
                className="bg-transparent border-none outline-none text-xl font-bold flex-1 text-white focus:ring-0 px-0"
                placeholder="Tytuł notatki..."
              />
            </div>

            {/* Vector Indexing Action */}
            <div className="flex items-center gap-2 shrink-0">
              <GlassButton
                variant={activeNote.embeddings ? "secondary" : "primary"}
                onClick={generateEmbeddingsForActiveNote}
                disabled={isEmbeddingProcessing}
                className="px-3 py-2 rounded-xl text-xs flex items-center gap-2"
              >
                {isEmbeddingProcessing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-blue-400" />
                    <span>{embeddingProgressText || 'Generowanie...'}</span>
                  </>
                ) : activeNote.embeddings && activeNote.embeddings.length > 0 ? (
                  <>
                    <Zap size={14} className="text-emerald-400" />
                    <span>Przelicz Wektory ({activeNote.embeddings.length})</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Generuj Wektory Notatki</span>
                  </>
                )}
              </GlassButton>
            </div>
          </div>

          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-white/40" />
              </div>
              <GlassInput 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj semantycznie w treści notatki..."
                className="pl-9 w-full text-xs"
              />
              {isQueryEmbeddingLoading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <RefreshCw size={14} className="animate-spin text-blue-400" />
                </div>
              )}
            </div>

            {/* Search Mode Toggles */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1 shrink-0 text-xs">
              <button
                onClick={() => setSearchMode('hybrid')}
                className={`px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${
                  searchMode === 'hybrid' 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Hybrydowe
              </button>
              <button
                onClick={() => setSearchMode('semantic')}
                className={`px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${
                  searchMode === 'semantic' 
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Wektorowe AI
              </button>
              <button
                onClick={() => setSearchMode('bm25')}
                className={`px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${
                  searchMode === 'bm25' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                BM25
              </button>
            </div>
          </div>

          {/* Warning if no embeddings generated yet */}
          {searchQuery && !activeNote.embeddings && searchMode !== 'bm25' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between text-xs text-amber-300 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={16} />
                <span>Aby odblokować szukanie wektorowe AI, kliknij "Generuj Wektory Notatki". Teraz używany jest tylko algorytm BM25.</span>
              </div>
              <button 
                onClick={generateEmbeddingsForActiveNote}
                className="underline font-bold hover:text-white ml-2 shrink-0"
              >
                Generuj teraz
              </button>
            </div>
          )}

          {/* Editor and Search Results layout */}
          <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0">
            {/* Note Editor TextArea */}
            <div className={`flex-1 flex flex-col ${searchQuery ? 'hidden lg:flex' : 'flex'} min-h-0`}>
              <textarea
                value={activeNote.content}
                onChange={(e) => updateActiveNote({ content: e.target.value })}
                placeholder="Wklej tutaj swój tekst (Markdown, notatki z zajęć, czysty tekst z PDF/DOCX)..."
                className="w-full flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 resize-none outline-none focus:border-blue-500/50 text-xs sm:text-sm leading-relaxed custom-scrollbar text-white/90 placeholder:text-white/30"
              />
            </div>

            {/* Search Results Display */}
            {searchQuery && (
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 min-h-0 bg-black/30 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">
                    Wyniki Wyszukiwania ({searchResults.length})
                  </h3>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">
                    Tryb: {searchMode === 'hybrid' ? 'BM25 + AI Wektory' : searchMode === 'semantic' ? 'Semantyczny AI' : 'BM25 Słowa Kluczowe'}
                  </span>
                </div>

                {searchResults.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-xs">
                    Brak pasujących fragmentów dla podanego zapytania.
                  </div>
                ) : (
                  searchResults.map((result, i) => (
                    <GlassCard key={i} className="p-4 bg-white/5 border border-white/10 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                        <span className="text-[10px] font-mono text-white/50">Akapit #{result.idx + 1}</span>
                        
                        <div className="flex items-center gap-2">
                          {result.semanticScore > 0 && (
                            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                              AI Sim: {(result.semanticScore * 100).toFixed(1)}%
                            </span>
                          )}
                          {result.bm25Raw > 0 && (
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              BM25: {result.bm25Raw.toFixed(2)}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-blue-400 bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                            Wynik: {(result.finalScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans">
                        {result.text}
                      </p>
                    </GlassCard>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
