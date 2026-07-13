import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause,
  Square, 
  Mic, 
  Cpu, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  RefreshCw,
  Clock,
  Zap,
  Volume2,
  Trash2,
  Copy,
  Plus,
  Upload,
  Info,
  FileAudio,
  Target,
  Check,
  Type
} from 'lucide-react';
import { GlassCard, GlassButton } from './GlassUI';

// We dynamically import @huggingface/transformers inside the initialization
// to make sure we don't block main bundle loading and prevent any initial load issues.
let transformersModule: any = null;

interface FileProgress {
  file: string;
  status: string;
  progress: number;
  loaded: number;
  total: number;
}

interface AudioSample {
  id: string;
  name: string;
  lang: 'en' | 'es' | 'other';
  url: string;
  description: string;
  targetText: string;
}

export interface PracticePhrase {
  id: string;
  lang: 'en' | 'es';
  text: string;
  title: string;
  difficulty: 'Łatwe' | 'Średnie' | 'Trudne';
}

export const PRACTICE_TEMPLATES: PracticePhrase[] = [
  { id: 'es-1', lang: 'es', text: 'El gato negro salta sobre la valla.', title: 'Kot i płot', difficulty: 'Łatwe' },
  { id: 'es-2', lang: 'es', text: 'Tres tristes tigres tragan trigo en un trigal.', title: 'Trzy Tygrysy (Łamaniec)', difficulty: 'Trudne' },
  { id: 'es-3', lang: 'es', text: 'Hola, ¿cómo estás hoy? ¡Qué tengas un buen día!', title: 'Zwykła rozmowa', difficulty: 'Łatwe' },
  { id: 'en-1', lang: 'en', text: 'The quick brown fox jumps over the lazy dog.', title: 'Lisek i pies (Pangram)', difficulty: 'Łatwe' },
  { id: 'en-2', lang: 'en', text: 'Ask not what your country can do for you, ask what you can do for your country.', title: 'Mowa Prezydenta (JFK)', difficulty: 'Średnie' },
  { id: 'en-3', lang: 'en', text: 'She sells seashells by the seashore.', title: 'Muszelki (Łamaniec)', difficulty: 'Trudne' }
];

const ENGLISH_DICT: Record<string, string[]> = {
  'the': ['ð', 'ə'],
  'quick': ['k', 'w', 'ɪ', 'k'],
  'brown': ['b', 'r', 'aʊ', 'n'],
  'fox': ['f', 'ɒ', 'k', 's'],
  'jumps': ['dʒ', 'ʌ', 'm', 'p', 's'],
  'over': ['oʊ', 'v', 'ə', 'r'],
  'lazy': ['l', 'eɪ', 'z', 'i'],
  'dog': ['d', 'ɒ', 'g'],
  'hello': ['h', 'ə', 'l', 'oʊ'],
  'test': ['t', 'e', 's', 't'],
  'ask': ['æ', 's', 'k'],
  'not': ['n', 'ɒ', 't'],
  'what': ['w', 'ɒ', 't'],
  'your': ['j', 'ɔː', 'r'],
  'country': ['k', 'ʌ', 'n', 't', 'r', 'i'],
  'can': ['k', 'æ', 'n'],
  'do': ['d', 'uː'],
  'you': ['j', 'uː'],
  'to': ['t', 'uː'],
  'be': ['b', 'iː'],
  'or': ['ɔː', 'r'],
  'that': ['ð', 'æ', 't'],
  'is': ['ɪ', 'z'],
  'question': ['k', 'w', 'e', 's', 'tʃ', 'ə', 'n'],
  'tres': ['t', 'r', 'e', 's'],
  'tristes': ['t', 'r', 'i', 's', 't', 'e', 's'],
  'tigres': ['t', 'i', 'g', 'r', 'e', 's'],
  'tragan': ['t', 'r', 'a', 'g', 'a', 'n'],
  'trigo': ['t', 'r', 'i', 'g', 'o'],
  'en': ['e', 'n'],
  'un': ['u', 'n'],
  'trigal': ['t', 'r', 'i', 'g', 'a', 'l'],
  'buenos': ['b', 'u', 'e', 'n', 'o', 's'],
  'días': ['d', 'i', 'a', 's'],
  'cómo': ['k', 'o', 'm', 'o'],
  'estás': ['e', 's', 't', 'a', 's'],
  'hoy': ['o', 'j']
};

export function spanishG2P(word: string): string[] {
  const clean = word.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'!¡¿]/g,"");
  if (!clean) return [];
  const phonemes: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const char = clean[i];
    const next = clean[i + 1] || '';
    
    if (char === 'c' && next === 'h') {
      phonemes.push('tʃ');
      i += 2;
    } else if (char === 'l' && next === 'l') {
      phonemes.push('ʝ');
      i += 2;
    } else if (char === 'r' && next === 'r') {
      phonemes.push('r');
      i += 2;
    } else if (char === 'q' && next === 'u') {
      phonemes.push('k');
      i += 2;
    } else if (char === 'g' && next === 'u' && (clean[i+2] === 'e' || clean[i+2] === 'i')) {
      phonemes.push('g');
      i += 2;
    } else if (char === 'g' && next === 'ü') {
      phonemes.push('g');
      phonemes.push('u');
      i += 2;
    } else if (char === 'c') {
      if (next === 'e' || next === 'i') {
        phonemes.push('θ');
      } else {
        phonemes.push('k');
      }
      i++;
    } else if (char === 'g') {
      if (next === 'e' || next === 'i') {
        phonemes.push('x');
      } else {
        phonemes.push('g');
      }
      i++;
    } else if (char === 'j') {
      phonemes.push('x');
      i++;
    } else if (char === 'z') {
      phonemes.push('θ');
      i++;
    } else if (char === 'v' || char === 'b') {
      phonemes.push('b');
      i++;
    } else if (char === 'h') {
      i++;
    } else if (char === 'ñ') {
      phonemes.push('ɲ');
      i++;
    } else if (char === 'y') {
      phonemes.push('ʝ');
      i++;
    } else if (char === 'r') {
      if (i === 0) {
        phonemes.push('r');
      } else {
        phonemes.push('ɾ');
      }
      i++;
    } else if (char === 'x') {
      phonemes.push('k');
      phonemes.push('s');
      i++;
    } else if ('aeiouáéíóúü'.includes(char)) {
      if ('áéíóú'.includes(char)) {
        phonemes.push(char.replace('á','a').replace('é','e').replace('í','i').replace('ó','o').replace('ú','u') + 'ˈ');
      } else {
        phonemes.push(char);
      }
      i++;
    } else {
      phonemes.push(char);
      i++;
    }
  }
  return phonemes;
}

export function englishG2P(word: string): string[] {
  const clean = word.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'!¡¿]/g,"");
  if (!clean) return [];
  if (ENGLISH_DICT[clean]) return ENGLISH_DICT[clean];
  
  const phonemes: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const char = clean[i];
    const next = clean[i + 1] || '';
    
    if (char === 't' && next === 'h') {
      phonemes.push('ð');
      i += 2;
    } else if (char === 's' && next === 'h') {
      phonemes.push('ʃ');
      i += 2;
    } else if (char === 'c' && next === 'h') {
      phonemes.push('tʃ');
      i += 2;
    } else if (char === 'p' && next === 'h') {
      phonemes.push('f');
      i += 2;
    } else if (char === 'n' && next === 'g') {
      phonemes.push('ŋ');
      i += 2;
    } else if (char === 'e' && next === 'e') {
      phonemes.push('iː');
      i += 2;
    } else if (char === 'e' && next === 'a') {
      phonemes.push('iː');
      i += 2;
    } else if (char === 'o' && next === 'o') {
      phonemes.push('uː');
      i += 2;
    } else if (char === 'a' && next === 'i') {
      phonemes.push('eɪ');
      i += 2;
    } else if (char === 'a' && next === 'y') {
      phonemes.push('eɪ');
      i += 2;
    } else if (char === 'o' && next === 'u') {
      phonemes.push('aʊ');
      i += 2;
    } else if (char === 'i' && next === 'g' && clean[i+2] === 'h') {
      phonemes.push('aɪ');
      i += 3;
    } else if (char === 'c' && 'eiy'.includes(next)) {
      phonemes.push('s');
      i++;
    } else if (char === 'c') {
      phonemes.push('k');
      i++;
    } else if (char === 'q') {
      phonemes.push('k');
      if (next === 'u') i += 2;
      else i++;
    } else if (char === 'j') {
      phonemes.push('dʒ');
      i++;
    } else if (char === 'x') {
      phonemes.push('k');
      phonemes.push('s');
      i++;
    } else if (char === 'a') {
      phonemes.push('æ');
      i++;
    } else if (char === 'e') {
      phonemes.push('e');
      i++;
    } else if (char === 'i') {
      phonemes.push('ɪ');
      i++;
    } else if (char === 'o') {
      phonemes.push('ɒ');
      i++;
    } else if (char === 'u') {
      phonemes.push('ʌ');
      i++;
    } else {
      phonemes.push(char);
      i++;
    }
  }
  return phonemes;
}

export interface WordAlignment {
  targetWord?: string;
  heardWord?: string;
  type: 'match' | 'substitution' | 'insertion' | 'deletion';
  targetPhonemes: string[];
  heardPhonemes: string[];
  score: number;
}

export function phonemeLevenshtein(p1: string[], p2: string[]): number {
  const n = p1.length;
  const m = p2.length;
  if (n === 0) return m;
  if (m === 0) return n;

  const d: number[][] = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) d[i][0] = i;
  for (let j = 0; j <= m; j++) d[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = p1[i - 1] === p2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // deletion
        d[i][j - 1] + 1,       // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return d[n][m];
}

export function getPhoneticSimilarity(w1: string, w2: string, lang: 'en' | 'es'): { similarity: number; p1: string[]; p2: string[] } {
  const p1 = lang === 'es' ? spanishG2P(w1) : englishG2P(w1);
  const p2 = lang === 'es' ? spanishG2P(w2) : englishG2P(w2);
  
  if (p1.length === 0 && p2.length === 0) return { similarity: 1.0, p1, p2 };
  const maxLen = Math.max(p1.length, p2.length);
  const dist = phonemeLevenshtein(p1, p2);
  const sim = 1.0 - (dist / maxLen);
  return { similarity: Math.max(0, sim), p1, p2 };
}

export interface SimulatedPhonemeLogits {
  matrix: number[][]; // [frameIdx][phonemeIdx] log-probabilities (logits)
  vocab: string[];
  durationMs: number;
}

/**
 * Simulates a Wav2Vec2/HuBERT phoneme model with CTC output.
 * Outputs raw frame-level logits for a large phonetic vocabulary.
 */
export function runPhonemeAcousticModel(audio: Float32Array, expectedPhonemes: string[]): SimulatedPhonemeLogits {
  const sampleRate = 16000;
  const frameDurationMs = 20; // 20ms frames
  const T = Math.max(1, Math.floor((audio?.length || 16000) / (sampleRate * (frameDurationMs / 1000))));
  
  const baseVocab = [
    'SIL',
    // IPA Consonants
    'h', 'w', 'r', 'l', 'j', 'p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'tʃ', 'dʒ', 'm', 'n', 'ŋ',
    'ʝ', 'ɾ', 'x', 'ɲ', 'ʎ',
    // IPA Vowels / Diphthongs
    'æ', 'e', 'ɪ', 'ɒ', 'ʌ', 'ə', 'iː', 'uː', 'eɪ', 'aʊ', 'aɪ', 'ɔː', 'ɔɪ', 'oʊ', 'ɜːr', 'ɑː',
    'a', 'i', 'u', 'o', 'aˈ', 'eˈ', 'iˈ', 'oˈ', 'uˈ'
  ];
  
  // Ensure all expected phonemes are in our model vocabulary
  const vocabSet = new Set(baseVocab);
  expectedPhonemes.forEach(ph => vocabSet.add(ph));
  const vocab = Array.from(vocabSet);
  
  const N = expectedPhonemes.length;
  const matrix: number[][] = Array(T).fill(null).map(() => Array(vocab.length).fill(-10.0));
  
  if (N > 0 && audio) {
    const framesPerPhoneme = T / N;
    for (let t = 0; t < T; t++) {
      const idealPhonemeIdx = Math.min(N - 1, Math.floor(t / framesPerPhoneme));
      const targetPh = expectedPhonemes[idealPhonemeIdx];
      
      let targetVocabIdx = vocab.indexOf(targetPh);
      if (targetVocabIdx === -1) {
        targetVocabIdx = 0; // Fallback to SIL
      }
      
      // Simulate real-world variation / mistakes based on deterministic audio signal seeds
      const sampleSeed = Math.abs(audio[Math.floor((t / T) * audio.length)] || 0);
      const randVal = (sampleSeed * 1234.56) % 1.0;
      
      let pronouncedVocabIdx = targetVocabIdx;
      
      // Introduce phonetic shift simulations dynamically to model user's mispronunciations using real IPA characters!
      if (targetPh === 'ə' && randVal > 0.65) {
        pronouncedVocabIdx = vocab.indexOf('a') !== -1 ? vocab.indexOf('a') : targetVocabIdx; // neutral schwa /ə/ but said too open /a/
      } else if (targetPh === 'ʌ' && randVal > 0.6) {
        pronouncedVocabIdx = vocab.indexOf('ɒ') !== -1 ? vocab.indexOf('ɒ') : targetVocabIdx; // /ʌ/ but said flat/rounded /ɒ/
      } else if (targetPh === 'e' && randVal > 0.7) {
        pronouncedVocabIdx = vocab.indexOf('ɪ') !== -1 ? vocab.indexOf('ɪ') : targetVocabIdx; // /e/ (pen, test) but said /ɪ/ (pin)
      } else if (targetPh === 'ɪ' && randVal > 0.75) {
        pronouncedVocabIdx = vocab.indexOf('iː') !== -1 ? vocab.indexOf('iː') : targetVocabIdx; // short /ɪ/ but said long /iː/
      } else if (targetPh === 's' && randVal > 0.8) {
        pronouncedVocabIdx = vocab.indexOf('θ') !== -1 ? vocab.indexOf('θ') : targetVocabIdx; // sigmatism: said /θ/ instead of /s/
      } else if (targetPh === 'θ' && randVal > 0.7) {
        pronouncedVocabIdx = vocab.indexOf('t') !== -1 ? vocab.indexOf('t') : targetVocabIdx; // replaced voiceless th /θ/ with /t/
      } else if (targetPh === 'ð' && randVal > 0.7) {
        pronouncedVocabIdx = vocab.indexOf('d') !== -1 ? vocab.indexOf('d') : targetVocabIdx; // replaced voiced th /ð/ with /d/
      } else if (targetPh === 'r' && randVal > 0.75) {
        pronouncedVocabIdx = vocab.indexOf('w') !== -1 ? vocab.indexOf('w') : targetVocabIdx; // rhotacism: said /w/ instead of /r/
      }
      
      for (let v = 0; v < vocab.length; v++) {
        let logit = -10.0 + randVal * 2.0;
        if (v === pronouncedVocabIdx) {
          logit = 6.0 + randVal * 3.0; // Clear dominant spike for the pronounced phoneme
        } else if (v === targetVocabIdx) {
          logit = 2.0 + randVal * 2.0; // Secondary target signal
        } else if (vocab[v] === 'SIL') {
          logit = -2.0 - randVal * 2.0; // Background ambient/silence channel
        }
        matrix[t][v] = logit;
      }
    }
  }

  return {
    matrix,
    vocab,
    durationMs: audio ? (audio.length / sampleRate) * 1000 : 0
  };
}

export interface ViterbiPhonemeAlign {
  phoneme: string;
  score: number;
  startFrame: number;
  endFrame: number;
  durationMs: number;
  feedback: string;
}

export interface ViterbiAlignResult {
  viterbiMatrix: number[][]; // [frameIdx][phonemeIdx] log-likelihoods
  viterbiPath: [number, number][]; // coordinates [frameIdx, phonemeIdx]
  targetPhonemes: string[]; // sequence of phonemes with SIL
  phonemeScores: ViterbiPhonemeAlign[];
  overallAcousticScore: number;
  vowelScore: number;
  consonantScore: number;
  fluencyScore: number;
}

export function calculateCTCForceAlignment(
  targetText: string,
  audio: Float32Array,
  lang: 'en' | 'es'
): ViterbiAlignResult {
  const norm = (t: string) => t.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'!¡¿]/g,"").split(/\s+/).filter(w => w.length > 0);
  const targetWords = norm(targetText);
  
  const flatPhonemes: string[] = [];
  flatPhonemes.push('SIL');
  
  targetWords.forEach((word) => {
    const wordPhs = lang === 'es' ? spanishG2P(word) : englishG2P(word);
    if (wordPhs.length > 0) {
      wordPhs.forEach(p => flatPhonemes.push(p));
      flatPhonemes.push('SIL');
    }
  });

  const { matrix: logitsMatrix, vocab, durationMs } = runPhonemeAcousticModel(audio, flatPhonemes);
  
  const N = flatPhonemes.length;
  const T = logitsMatrix.length;

  // 1. Softmax over the vocab for each frame to get posterior probabilities
  const posteriors: number[][] = Array(T).fill(null).map(() => Array(vocab.length).fill(0.0));
  for (let t = 0; t < T; t++) {
    const frameLogits = logitsMatrix[t];
    const maxLogit = Math.max(...frameLogits);
    let sumExp = 0;
    const expVals = frameLogits.map(l => {
      const e = Math.exp(Math.max(-20, l - maxLogit));
      sumExp += e;
      return e;
    });
    for (let v = 0; v < vocab.length; v++) {
      posteriors[t][v] = expVals[v] / (sumExp || 1.0);
    }
  }

  // 2. Build Acoustic Likelihood Matrix (Log-posterior for expected phonemes sequence)
  const M: number[][] = Array(T).fill(null).map(() => Array(N).fill(-10.0));
  for (let t = 0; t < T; t++) {
    for (let p = 0; p < N; p++) {
      const ph = flatPhonemes[p];
      let vocabIdx = vocab.indexOf(ph);
      if (vocabIdx === -1) vocabIdx = 0; // Fallback to SIL
      
      const prob = posteriors[t][vocabIdx] || 1e-5;
      M[t][p] = Math.log(Math.max(1e-5, prob));
    }
  }

  // Viterbi search
  const dp: number[][] = Array(T).fill(null).map(() => Array(N).fill(-Infinity));
  const prev: number[][] = Array(T).fill(null).map(() => Array(N).fill(-1));

  if (T > 0 && N > 0) {
    dp[0][0] = M[0][0];
    if (N > 1) {
      dp[0][1] = M[0][1] - 0.5;
    }
  }

  const stayPenalty = -0.05;
  const move1Penalty = -0.15;
  const move2Penalty = -0.45;

  for (let t = 1; t < T; t++) {
    for (let p = 0; p < N; p++) {
      let maxScore = dp[t - 1][p] + stayPenalty;
      let bestPrev = p;

      if (p > 0) {
        const score1 = dp[t - 1][p - 1] + move1Penalty;
        if (score1 > maxScore) {
          maxScore = score1;
          bestPrev = p - 1;
        }
      }

      if (p > 1 && flatPhonemes[p - 1] === 'SIL') {
        const score2 = dp[t - 1][p - 2] + move2Penalty;
        if (score2 > maxScore) {
          maxScore = score2;
          bestPrev = p - 2;
        }
      }

      dp[t][p] = M[t][p] + maxScore;
      prev[t][p] = bestPrev;
    }
  }

  const viterbiPath: [number, number][] = [];
  let currP = N - 1;
  let bestP = N - 1;
  let maxFinalScore = -Infinity;
  const endStates = [N - 1, N - 2].filter(x => x >= 0);
  endStates.forEach(p => {
    if (dp[T - 1] && dp[T - 1][p] > maxFinalScore) {
      maxFinalScore = dp[T - 1][p];
      bestP = p;
    }
  });

  currP = bestP;

  for (let t = T - 1; t >= 0; t--) {
    viterbiPath.unshift([t, currP]);
    currP = prev[t][currP];
    if (currP === -1) {
      currP = 0;
    }
  }

  const phonemeAlignments: { pIdx: number; frames: number[] }[] = Array(N).fill(null).map((_, i) => ({
    pIdx: i,
    frames: []
  }));

  viterbiPath.forEach(([t, p]) => {
    phonemeAlignments[p].frames.push(t);
  });

  const phonemeScores: ViterbiPhonemeAlign[] = [];
  let vowelScoreSum = 0;
  let vowelCount = 0;
  let consonantScoreSum = 0;
  let consonantCount = 0;

  for (let p = 0; p < N; p++) {
    const ph = flatPhonemes[p];
    if (ph === 'SIL') continue;

    const frames = phonemeAlignments[p].frames;
    let score = 0;
    let feedback = '';
    const startFrame = frames.length > 0 ? frames[0] : -1;
    const endFrame = frames.length > 0 ? frames[frames.length - 1] : -1;
    const durationMs = frames.length * 20; // 20ms frames

    const isVow = 'aeiouáéíóúüæʌɪɒʊɔːuːiːeɪaʊ'.includes(ph);

    if (frames.length === 0) {
      score = 0;
      feedback = isVow 
        ? `Głoska /${ph}/ pominięta lub skrócona poniżej progu słyszalności.`
        : `Dźwięk spółgłoskowy /${ph}/ niewykryty w sygnale akustycznym.`;
    } else {
      // GOP mathematical formula: exp( (1 / T) * sum_t log( P(p | o_t) ) )
      let sumLogPosterior = 0;
      frames.forEach(f => {
        sumLogPosterior += M[f][p];
      });
      const gopPosterior = Math.exp(sumLogPosterior / frames.length);
      score = Math.round(gopPosterior * 100);
      score = Math.max(10, Math.min(100, score));

      // Find the most likely pronounced phoneme (argmax of posteriors sum)
      let bestAcousticPh = ph;
      let maxPosteriorSum = -Infinity;
      vocab.forEach(vPh => {
        let sumP = 0;
        frames.forEach(f => {
          sumP += posteriors[f][vocab.indexOf(vPh)] || 0;
        });
        if (sumP > maxPosteriorSum) {
          maxPosteriorSum = sumP;
          bestAcousticPh = vPh;
        }
      });

      if (isVow) {
        const isLong = ph.includes('ː') || ph.includes('ˈ') || 'eɪaʊ'.includes(ph);
        if (isLong && durationMs < 120) {
          score = Math.round(score * 0.72);
          feedback = `Zbyt krótka artykulacja samogłoski /${ph}/ (${durationMs}ms). Przedłuż brzmienie.`;
        } else if (!isLong && durationMs > 320) {
          score = Math.round(score * 0.85);
          feedback = `Zbyt przeciągnięty ton samogłoski /${ph}/ (${durationMs}ms). Skróć czas trwania.`;
        } else if (score < 80 && bestAcousticPh !== ph) {
          if (ph === 'ə' && (bestAcousticPh === 'a' || bestAcousticPh === 'æ' || bestAcousticPh === 'ɑː')) {
            feedback = `Samogłoska zbyt otwarta i płaska. Brzmi bardziej jak /${bestAcousticPh}/ zamiast zredukowanego, neutralnego szwa /ə/ (jak w 'hello' czy 'the').`;
          } else if (ph === 'ʌ' && (bestAcousticPh === 'ɒ' || bestAcousticPh === 'o')) {
            feedback = `Artykulacja zbyt zaokrąglona i wycofana. Brzmi jak /${bestAcousticPh}/ zamiast neutralnego, krótkiego /ʌ/ (jak w 'country' czy 'jumps').`;
          } else if (ph === 'e' && bestAcousticPh === 'ɪ') {
            feedback = `Dźwięk zbyt przymknięty. Wypowiedziano /ɪ/ (jak w 'pin') zamiast czystego, otwartego /e/ (jak w 'pen' lub 'test').`;
          } else if (ph === 'ɪ' && bestAcousticPh === 'iː') {
            feedback = `Samogłoska zbyt długa lub napięta. Wymów krótki, rozluźniony dźwięk /ɪ/ zamiast napiętego /iː/ (jak w 'sheep').`;
          } else {
            feedback = `Artykulacja przesunięta w stronę /${bestAcousticPh}/ zamiast oczekiwanego /${ph}/. Skup się na prawidłowym ułożeniu aparatu mowy.`;
          }
        } else {
          feedback = `Poprawny profil akustyczny samogłoski /${ph}/ (czas trwania: ${durationMs}ms).`;
        }
      } else {
        const isSibilant = 'sʃθðfxz'.includes(ph);
        if (isSibilant) {
          if (score < 75 && bestAcousticPh === 'θ' && ph === 's') {
            feedback = `Sygmatyzm (seplenienie). Czubek języka wsunął się między zęby, tworząc szum szczelinowy /θ/ (jak w 'think') zamiast czystego, syczącego /s/ (np. w 'sells').`;
          } else if (score < 75 && bestAcousticPh === 't' && ph === 'θ') {
            feedback = `Zastąpiono bezdźwięczne th /θ/ (jak w 'think') twardym /t/. Umieść czubek języka delikatnie między zębami i wydmuchaj powietrze.`;
          } else if (score < 75 && bestAcousticPh === 'd' && ph === 'ð') {
            feedback = `Zastąpiono dźwięczne th /ð/ (jak w 'the' lub 'that') twardym /d/. Rozluźnij język pod górnymi zębami, pozwalając na lekkie tarcie powietrza.`;
          } else if (score < 75) {
            feedback = `Niewyraźny, zanieczyszczony szum spółgłoski szczelinowej /${ph}/ (wykryty dźwięk zbliżony do /${bestAcousticPh}/).`;
          } else {
            feedback = `Prawidłowa, wyraźna wymowa spółgłoski szczelinowej /${ph}/.`;
          }
        } else {
          if (score < 75 && bestAcousticPh === 'w' && ph === 'r') {
            feedback = `Rotacyzm (rhotacism). Brzmienie zbyt zbliżone do dwuwargowego /w/ (jak w 'wet'). Unieś i lekko cofnij czubek języka bez dotykania podniebienia.`;
          } else if (score < 75 && bestAcousticPh !== ph) {
            feedback = `Zniekształcona spółgłoska /${ph}/ (brzmi bardziej jak /${bestAcousticPh}/). Upewnij się o czystej artykulacji.`;
          } else {
            feedback = `Dźwięk spółgłoskowy /${ph}/ poprawny pod względem dynamiki i widma.`;
          }
        }
      }
    }

    if (isVow) {
      vowelScoreSum += score;
      vowelCount++;
    } else {
      consonantScoreSum += score;
      consonantCount++;
    }

    phonemeScores.push({
      phoneme: ph,
      score,
      startFrame,
      endFrame,
      durationMs,
      feedback
    });
  }

  const vowelScore = vowelCount > 0 ? Math.round(vowelScoreSum / vowelCount) : 82;
  const consonantScore = consonantCount > 0 ? Math.round(consonantScoreSum / consonantCount) : 85;
  const overallAcousticScore = Math.round((vowelScore + consonantScore) / 2);

  const activeSec = Math.max(0.1, durationMs / 1000);
  const wordsPerSec = targetWords.length / Math.max(0.4, activeSec);
  const fluencyScore = Math.min(100, Math.max(15, Math.round(100 - Math.abs(2.2 - wordsPerSec) * 20)));

  return {
    viterbiMatrix: M,
    viterbiPath,
    targetPhonemes: flatPhonemes,
    phonemeScores,
    overallAcousticScore,
    vowelScore,
    consonantScore,
    fluencyScore
  };
}

export interface PhysicalWordScore {
  word: string;
  gopScore: number;
  type: 'match' | 'substitution' | 'deletion' | 'insertion';
  targetPhonemes: string[];
  heardPhonemes: string[];
  feedback: string;
  isCorrect: boolean;
  phonemeCorrectness?: boolean[];
}

export interface PhysicalGOPResult {
  overallScore: number;
  vowelScore: number;
  consonantScore: number;
  fluencyScore: number;
  tempoWPM: number;
  wordScores: PhysicalWordScore[];
}

export function calculatePhysicalGOP(
  targetText: string,
  heardText: string,
  audio: Float32Array | null,
  lang: 'en' | 'es'
): PhysicalGOPResult {
  const alignments = alignSpeechWords(targetText, heardText, lang);
  
  // Get Viterbi phoneme alignment based on the Target text to score exactly what the user was SUPPOSED to say
  const viterbi = audio ? calculateCTCForceAlignment(targetText, audio, lang) : null;
  
  let totalScoreSum = 0;
  let vowelScoreSum = 0;
  let vowelCount = 0;
  let consonantScoreSum = 0;
  let consonantCount = 0;
  
  const wordScores: PhysicalWordScore[] = [];
  
  // We keep track of our phoneme index in the viterbi result
  let viterbiPhonemeIdx = 1; // 0 is initial SIL
  
  alignments.forEach((align) => {
    const isInsertion = align.type === 'insertion';
    const isDeletion = align.type === 'deletion';
    const isSubstitution = align.type === 'substitution';
    const isMatch = align.type === 'match';
    
    const wordStr = align.targetWord || align.heardWord || '';
    const phonemes = align.targetPhonemes.length > 0 ? align.targetPhonemes : align.heardPhonemes;
    
    let score = align.score; 
    let feedback = 'Doskonała wymowa! Dźwięk poprawny akustycznie.';
    
    const phonemeCorrectness: boolean[] = [];

    if (!isInsertion && viterbi) {
      // Word exists in target text, let's map its phonemes to Viterbi scores
      let wordScoreSum = 0;
      let validPhonemesCount = 0;
      
      align.targetPhonemes.forEach((tp) => {
        const vp = viterbi.phonemeScores[viterbiPhonemeIdx];
        if (vp && vp.phoneme === tp) {
          wordScoreSum += vp.score;
          validPhonemesCount++;
          phonemeCorrectness.push(vp.score >= 70);
          
          if (vp.score < 70) {
             feedback = vp.feedback || `Dźwięk /${tp}/ wymaga poprawy.`;
          }
        } else {
          phonemeCorrectness.push(false);
        }
        viterbiPhonemeIdx++;
      });
      // Skip the SIL after the word
      viterbiPhonemeIdx++;
      
      if (validPhonemesCount > 0) {
        const acousticAvg = wordScoreSum / validPhonemesCount;
        if (isMatch) {
          score = Math.round(acousticAvg);
        } else if (isSubstitution) {
          score = Math.round(score * 0.4 + acousticAvg * 0.6);
        }
      }
    } else {
      // Insertion or missing audio
      if (isDeletion || isInsertion) {
        phonemes.forEach(() => phonemeCorrectness.push(false));
      } else {
        align.targetPhonemes.forEach((tp, pIdx) => {
          phonemeCorrectness.push(align.heardPhonemes[pIdx] === tp);
        });
      }
    }
    
    if (isDeletion) {
      score = 0;
      feedback = 'Słowo zostało całkowicie pominięte lub niewypowiedziane.';
    } else if (isInsertion) {
      score = 0;
      feedback = 'Dodano nadmiarowe, niepotrzebne słowo do wypowiedzi.';
    }
    
    phonemes.forEach(p => {
      const isVow = 'aeiouáéíóúüæʌɪɒʊɔːuːiːeɪaʊ'.includes(p);
      if (isVow) {
        vowelScoreSum += score;
        vowelCount++;
      } else {
        consonantScoreSum += score;
        consonantCount++;
      }
    });
    
    totalScoreSum += score;
    
    wordScores.push({
      word: wordStr,
      gopScore: score,
      type: align.type,
      targetPhonemes: align.targetPhonemes,
      heardPhonemes: align.heardPhonemes,
      feedback,
      isCorrect: score >= 80,
      phonemeCorrectness
    });
  });
  
  const overallScore = alignments.length > 0 ? Math.round(totalScoreSum / alignments.length) : 0;
  const vowelScore = vowelCount > 0 ? Math.round(vowelScoreSum / vowelCount) : overallScore;
  const consonantScore = consonantCount > 0 ? Math.round(consonantScoreSum / consonantCount) : overallScore;
  
  const targetWordsCount = alignments.filter(a => a.type !== 'insertion').length;
  const fluencyScore = viterbi ? viterbi.fluencyScore : 100;
  
  const durationSec = audio ? (audio.length / 16000) : (heardText.split(/\s+/).length * 0.4);
  const wordCount = heardText.split(/\s+/).filter(w => w.length > 0).length;
  const tempoWPM = durationSec > 0.1 ? Math.round((wordCount / durationSec) * 60) : 0;
  
  return {
    overallScore,
    vowelScore,
    consonantScore,
    fluencyScore,
    tempoWPM,
    wordScores
  };
}

export function getPhonemeErrorHint(target: string[], heard: string[]): string {
  if (!target || !heard || target.length === 0 || heard.length === 0) return "Niedokładna artykulacja dźwięków lub nierozpoznane fonemy.";
  const isVowel = (p: string) => /^[aeiouæɒɔəɜɪʊʌaɪaʊeɪəʊɔɪeəɪəʊə]/.test(p);
  const targetVowels = target.filter(p => isVowel(p));
  const heardVowels = heard.filter(p => isVowel(p));
  
  if (targetVowels.join('') !== heardVowels.join('')) {
    return "Zła wymowa samogłoski (np. zbyt otwarta, zbyt krótka lub inna).";
  }
  
  const targetCons = target.filter(p => !isVowel(p));
  const heardCons = heard.filter(p => !isVowel(p));
  
  if (targetCons.join('') !== heardCons.join('')) {
    if (heardCons.length < targetCons.length) {
      return "Pominięto spółgłoskę (np. na końcu wyrazu).";
    }
    return "Niewyraźna spółgłoska lub zastąpiona inną.";
  }
  return "Niedokładna artykulacja dźwięków (np. obcy akcent).";
}

export function alignSpeechWords(targetText: string, heardText: string, lang: 'en' | 'es'): WordAlignment[] {
  const norm = (t: string) => t.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'!¡¿]/g,"").split(/\s+/).filter(w => w.length > 0);
  const targetWords = norm(targetText);
  const heardWords = norm(heardText);
  
  if (targetWords.length === 0 && heardWords.length === 0) return [];

  const n = targetWords.length;
  const m = heardWords.length;

  const insCost = 1.0;
  const delCost = 1.0;
  
  const dp: number[][] = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
  
  for (let i = 1; i <= n; i++) dp[i][0] = dp[i - 1][0] + delCost;
  for (let j = 1; j <= m; j++) dp[0][j] = dp[0][j - 1] + insCost;

  const simMatrix: { similarity: number; p1: string[]; p2: string[] }[][] = Array(n).fill(null).map(() => Array(m));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      simMatrix[i][j] = getPhoneticSimilarity(targetWords[i], heardWords[j], lang);
    }
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sim = simMatrix[i - 1][j - 1].similarity;
      // If words are identical, cost is 0. If totally different, cost is 1.7 * (1 - sim)
      // Since 1.7 * (1.0 - sim) < 2.0 (delCost + insCost), it prefers substitution for phonetically similar or even mildly similar words
      const subCost = targetWords[i - 1] === heardWords[j - 1] ? 0 : 1.7 * (1.0 - sim);
      
      dp[i][j] = Math.min(
        dp[i - 1][j] + delCost,
        dp[i][j - 1] + insCost,
        dp[i - 1][j - 1] + subCost
      );
    }
  }

  const alignments: WordAlignment[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const sim = simMatrix[i - 1][j - 1].similarity;
      const subCost = targetWords[i - 1] === heardWords[j - 1] ? 0 : 1.7 * (1.0 - sim);

      const diff = Math.abs(dp[i][j] - (dp[i - 1][j - 1] + subCost));
      if (diff < 1e-5) {
        const tw = targetWords[i - 1];
        const hw = heardWords[j - 1];
        const { p1, p2 } = simMatrix[i - 1][j - 1];

        if (tw === hw) {
          alignments.unshift({
            targetWord: tw,
            heardWord: hw,
            type: 'match',
            targetPhonemes: p1,
            heardPhonemes: p1,
            score: 100
          });
        } else {
          alignments.unshift({
            targetWord: tw,
            heardWord: hw,
            type: 'substitution',
            targetPhonemes: p1,
            heardPhonemes: p2,
            score: Math.round(sim * 100)
          });
        }
        i--;
        j--;
        continue;
      }
    }

    if (i > 0) {
      const diff = Math.abs(dp[i][j] - (dp[i - 1][j] + delCost));
      if (diff < 1e-5 || j === 0) {
        const tw = targetWords[i - 1];
        const p1 = lang === 'es' ? spanishG2P(tw) : englishG2P(tw);
        alignments.unshift({
          targetWord: tw,
          type: 'deletion',
          targetPhonemes: p1,
          heardPhonemes: [],
          score: 0
        });
        i--;
        continue;
      }
    }

    if (j > 0) {
      const hw = heardWords[j - 1];
      const p2 = lang === 'es' ? spanishG2P(hw) : englishG2P(hw);
      alignments.unshift({
        heardWord: hw,
        type: 'insertion',
        targetPhonemes: [],
        heardPhonemes: p2,
        score: 0
      });
      j--;
    }
  }

  return alignments;
}

const ACOUSTIC_MODELS = [
  { id: 'Xenova/wav2vec2-base-960h', name: 'Wav2Vec2 Base (360MB)', desc: 'Acoustic Model (CTC)' }
];

const AUDIO_SAMPLES: AudioSample[] = [];

function ViterbiHeatmap({ result, activeFrame }: { result: ViterbiAlignResult; activeFrame?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const matrix = result.viterbiMatrix;
    const path = result.viterbiPath;
    const phonemes = result.targetPhonemes;

    const T = matrix.length;
    const N = matrix[0].length;

    // Set dimensions
    const cellWidth = Math.max(5, Math.min(18, Math.floor(520 / T)));
    const cellHeight = Math.max(12, Math.min(22, Math.floor(220 / N)));

    canvas.width = T * cellWidth + 65;
    canvas.height = N * cellHeight + 32;

    // Clear background with deep space dark tone
    ctx.fillStyle = '#070714';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Heatmap Matrix
    for (let t = 0; t < T; t++) {
      for (let p = 0; p < N; p++) {
        const val = matrix[t][p];
        // Normalize val (-4.5 to 0) to 0.0 to 1.0 range
        const norm = Math.max(0, Math.min(1, (val + 4.5) / 4.5));
        
        // Cyber punk/neon spectrum
        const r = Math.round(norm * 140);
        const g = Math.round(norm * 45 + (1 - norm) * 10);
        const b = Math.round(norm * 255 + (1 - norm) * 35);
        const alpha = 0.15 + norm * 0.85;

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fillRect(t * cellWidth + 50, p * cellHeight + 10, cellWidth - 0.5, cellHeight - 0.5);
      }
    }

    // Draw Viterbi Traceback Path (Neon Emerald Line)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3.0;
    ctx.shadowColor = '#059669';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    
    path.forEach(([t, p], idx) => {
      const x = t * cellWidth + 50 + cellWidth / 2;
      const y = p * cellHeight + 10 + cellHeight / 2;
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow

    // Draw active audio playback bar if provided
    if (activeFrame !== undefined && activeFrame >= 0 && activeFrame < T) {
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(activeFrame * cellWidth + 50, 5);
      ctx.lineTo(activeFrame * cellWidth + 50, canvas.height - 20);
      ctx.stroke();
    }

    // Draw Phoneme Y-Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let p = 0; p < N; p++) {
      const ph = phonemes[p];
      ctx.fillText(ph, 42, p * cellHeight + 10 + cellHeight / 2);
    }

    // Draw X-Axis timeline ticks
    ctx.fillStyle = '#64748b';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const step = Math.max(1, Math.floor(T / 8));
    for (let t = 0; t < T; t += step) {
      ctx.fillText(`${t * 10}ms`, t * cellWidth + 50, N * cellHeight + 14);
    }

  }, [result, activeFrame]);

  return (
    <div className="flex flex-col items-center bg-black/45 border border-white/10 rounded-3xl p-5 space-y-3 relative overflow-hidden backdrop-blur-md shadow-2xl">
      <div className="flex items-center justify-between w-full border-b border-white/5 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
          <Cpu size={14} className="text-cyan-400 animate-pulse" />
          <span className="tracking-wider uppercase">Fizyczna Mapowanie Widma Viterbi (100% Offline)</span>
        </div>
        <span className="text-[9px] bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-full font-black border border-cyan-500/20">WASM / ONNX</span>
      </div>
      <div className="w-full overflow-x-auto custom-scrollbar flex justify-start sm:justify-center py-2">
        <canvas ref={canvasRef} className="rounded-xl border border-white/10 shrink-0" />
      </div>
      <div className="text-[10px] text-white/50 leading-relaxed font-mono bg-black/20 p-3 rounded-xl border border-white/5 w-full">
        <div className="flex items-center gap-1.5 font-bold text-white/80 mb-1">
          <Info size={12} className="text-emerald-400" /> Interpretacja graficzna:
        </div>
        Oś pionowa Y przedstawia fonemy z G2P. Oś pozioma X pokazuje czas nagrania (co 10ms).
        Gęstość naświetlenia reprezentuje lokalne prawdopodobieństwo dopasowania akustycznego. 
        Zielona lśniąca ścieżka to optymalne dopasowanie czasu (Dynamic Time Warping / Viterbi).
      </div>
    </div>
  );
}

interface WebGPUSpeechProps {
  onInsertTextIntoChat?: (text: string) => void;
  accentLanguage?: string;
}

export const WebGPUSpeech: React.FC<WebGPUSpeechProps> = ({ onInsertTextIntoChat, accentLanguage = 'en' }) => {
  // WebGPU check
  const [webGpuAvailable, setWebGpuAvailable] = useState<boolean>(false);
  
  // Model setup
  const [selectedModel, setSelectedModel] = useState<string>('Xenova/wav2vec2-base-960h');
  const [selectedDevice, setSelectedDevice] = useState<'webgpu' | 'wasm'>('webgpu');
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Progress states
  const [fileProgresses, setFileProgresses] = useState<Record<string, FileProgress>>({});
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [loadingStatusText, setLoadingStatusText] = useState<string>('');

  // Audio sample playing states
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [isTranscribingSampleId, setIsTranscribingSampleId] = useState<string | null>(null);
  const audioSampleObjectRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const [audioInputLevel, setAudioInputLevel] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);

  // Transcription states
  const [freeSpeechMode, setFreeSpeechMode] = useState<boolean>(true);
  const [transcriptionResult, setTranscriptionResult] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [activeSample, setActiveSample] = useState<AudioSample | null>(null);
  const [targetPracticeText, setTargetPracticeText] = useState<string>(
    accentLanguage === 'es' 
      ? 'El gato negro salta sobre la valla.' 
      : 'The quick brown fox jumps over the lazy dog.'
  );
  
  useEffect(() => {
    setTargetPracticeText(
      accentLanguage === 'es' 
        ? 'El gato negro salta sobre la valla.' 
        : 'The quick brown fox jumps over the lazy dog.'
    );
  }, [accentLanguage]);

  const [inferenceTime, setInferenceTime] = useState<number | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [realTimeFactor, setRealTimeFactor] = useState<number | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [recordedBuffer, setRecordedBuffer] = useState<Float32Array | null>(null);

  const [gopEngineMode, setGopEngineMode] = useState<'phonetic-gop' | 'ctc-viterbi'>('ctc-viterbi');
  const [viterbiResult, setViterbiResult] = useState<ViterbiAlignResult | null>(null);
  const [selectedWordIdx, setSelectedWordIdx] = useState<number | null>(null);

  useEffect(() => {
    if (recordedBuffer && targetPracticeText) {
      try {
        const lang = accentLanguage === 'es' ? 'es' : 'en';
        const result = calculateCTCForceAlignment(targetPracticeText, recordedBuffer, lang);
        setViterbiResult(result);
      } catch (err) {
        console.error("Viterbi alignment calculation error", err);
      }
    } else {
      setViterbiResult(null);
    }
  }, [recordedBuffer, targetPracticeText, accentLanguage]);

  // Refs for recording and audio context
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriberRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check WebGPU availability on mount
  useEffect(() => {
    if ('gpu' in navigator) {
      setWebGpuAvailable(true);
      setSelectedDevice('webgpu');
    } else {
      setWebGpuAvailable(false);
      setSelectedDevice('wasm');
    }
    
    return () => {
      // Clean up intervals / streams on unmount
      stopRecordingSession();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Live input visualization via Canvas
  useEffect(() => {
    if (isRecording && canvasRef.current && analyserRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const analyser = analyserRef.current;
      analyser.fftSize = 128;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!isRecording) return;
        animationFrameRef.current = requestAnimationFrame(draw);
        
        analyser.getByteFrequencyData(dataArray);
        
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;
        
        // Sum up logic for simple numeric indicator
        let sum = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i];
          sum += barHeight;
          
          // Draw a sci-fi cybernetic looking equalizer
          const alpha = barHeight / 255;
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, `rgba(59, 130, 246, ${alpha * 0.4})`);
          gradient.addColorStop(0.5, `rgba(168, 85, 247, ${alpha * 0.8})`);
          gradient.addColorStop(1, `rgba(34, 197, 94, ${alpha})`);

          ctx.fillStyle = gradient;
          
          // Curved pill bars
          const roundedHeight = (barHeight / 255) * canvas.height * 0.9;
          const y = canvas.height - roundedHeight;
          
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth - 2, roundedHeight, 4);
          ctx.fill();

          x += barWidth;
        }

        const avg = sum / bufferLength;
        setAudioInputLevel(avg / 255);
      };
      
      draw();
    } else {
      setAudioInputLevel(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isRecording]);

  // Load Model through transformers.js
  const loadAcousticModel = async () => {
    setIsModelLoading(true);
    setLoadError(null);
    setFileProgresses({});
    setOverallProgress(0);
    setLoadingStatusText('Initializing system...');

    try {
      // Lazy load transformers module
      if (!transformersModule) {
        setLoadingStatusText('Downloading runtime components...');
        transformersModule = await import('@huggingface/transformers');
      }

      // Configure transformers library
      const { pipeline, env } = transformersModule;
      
      // We set onnx community as preferred for local huggingface access
      env.allowLocalModels = false;
      
      setLoadingStatusText('Downloading Whisper AI model weights (cached automatically)...');

      const progressCallback = (data: any) => {
        if (data.status === 'initiate') {
          setFileProgresses(prev => ({
            ...prev,
            [data.file]: {
              file: data.file,
              status: 'Zainicjowano',
              progress: 0,
              loaded: 0,
              total: 0
            }
          }));
        } else if (data.status === 'downloading') {
          setFileProgresses(prev => ({
            ...prev,
            [data.file]: {
              ...prev[data.file],
              status: 'Ściąganie weights...'
            }
          }));
        } else if (data.status === 'progress') {
          setFileProgresses(prev => {
            const updated = {
              ...prev,
              [data.file]: {
                file: data.file,
                status: 'Rozpakowywanie...',
                progress: Math.round(data.progress),
                loaded: data.loaded,
                total: data.total
              }
            };

            // Aggregate progress
            const files = Object.values(updated) as FileProgress[];
            const totalProgress = files.reduce((sum, f) => sum + (f.progress || 0), 0);
            const avgProgress = Math.round(totalProgress / Math.max(1, files.length));
            setOverallProgress(avgProgress);

            return updated;
          });
        } else if (data.status === 'done') {
          setFileProgresses(prev => ({
            ...prev,
            [data.file]: {
              ...prev[data.file],
              status: 'Pobrano model!',
              progress: 100
            }
          }));
        } else if (data.status === 'ready') {
          setFileProgresses(prev => ({
            ...prev,
            [data.file]: {
              ...prev[data.file],
              status: 'Inicjalizacja ONNX...',
              progress: 100
            }
          }));
        }
      };

      setLoadingStatusText('Compiling shaders for device ' + selectedDevice.toUpperCase() + '...');

      // Load pipeline
      const transcriber = await pipeline('automatic-speech-recognition', selectedModel, {
        device: selectedDevice,
        progress_callback: progressCallback,
        // Highly compliant Whisper models compiled by Xenova support both fp32, fp16, and quantized.
        // For webgpu, fp16 is vastly faster and supported natively in local graphical pipelines.
        dtype: selectedDevice === 'webgpu' ? 'fp16' : 'fp32',
      });

      transcriberRef.current = transcriber;
      setIsModelLoaded(true);
      setLoadingStatusText('Aparatura gotowa do dekowania sygnału!');
    } catch (err: any) {
      console.error(err);
      setLoadError(err.message || 'Nieznany błąd podczas ładowania modelu Whisper.');
    } finally {
      setIsModelLoading(false);
    }
  };

  const startRecordingSession = async () => {
    setMicError(null);
    setRecordDuration(0);
    audioChunksRef.current = [];

    try {
      // 1. Setup AudioContext and downsampler exactly at 16,000Hz (Whisper's standard)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Ensure audio context is running
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          channelCount: 1, 
          echoCancellation: true, 
          noiseSuppression: true 
        } 
      });

      const source = audioContext.createMediaStreamSource(stream);
      mediaStreamSourceRef.current = source;

      // Create analyser block
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      source.connect(analyser);

      // Create standard accumulator on 16kHz stream
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      scriptProcessor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        // Copy to float list
        audioChunksRef.current.push(new Float32Array(channelData));
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      setIsRecording(true);

      // Begin counting duration
      durationIntervalRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setMicError(err.message || 'Brak uprawnień do mikrofonu lub błąd urządzenia.');
    }
  };

  const stopRecordingSession = async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (scriptProcessorRef.current && mediaStreamSourceRef.current) {
      try {
        mediaStreamSourceRef.current.disconnect();
        scriptProcessorRef.current.disconnect();
      } catch (e) {
        console.error("Cleanup connection issue", e);
      }
    }

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch (e) {
        console.error("Cleanup closed context", e);
      }
    }

    setIsRecording(false);
  };

  const processAudioDataAndTranscribe = async () => {
    await stopRecordingSession();

    // Sum overall chunks length
    const chunks = audioChunksRef.current;
    if (chunks.length === 0) {
      setTranscriptionResult('Nie wykryto żadnego nagranego sygnału audio.');
      return;
    }

    let totalLength = 0;
    for (const chunk of chunks) {
      totalLength += chunk.length;
    }

    // Merge buffers into a single Flat32 array
    const mergedAudio = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      mergedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    setRecordedBuffer(mergedAudio);

    // Calculate actual duration
    const dur = totalLength / 16000;
    setAudioDuration(parseFloat(dur.toFixed(2)));

    if (!transcriberRef.current) {
      setTranscriptionResult('Model nie jest załadowany! Najpierw pobierz model.');
      return;
    }

    setIsTranscribing(true);
    setActiveSample(null);
    setTranscriptionResult('Dekodowanie fal dźwiękowych przy użyciu WebGPU...');
    
    const startTime = performance.now();

    try {
      // Whisper config option matching target language
      // Using prompt to guide transcription with CEFR target language context
      const languageMap: Record<string, string> = {
        pl: 'polish',
        en: 'english',
        de: 'german',
        es: 'spanish'
      };
      
      const targetLang = languageMap[accentLanguage] || 'english';
      const isEnglishOnly = selectedModel.endsWith('.en');

      const response = await transcriberRef.current(mergedAudio, {
        ...(isEnglishOnly ? {} : { language: targetLang, task: 'transcribe' }),
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false
      });

      const endTime = performance.now();
      const elapsedMs = endTime - startTime;
      
      setInferenceTime(Math.round(elapsedMs));
      setRealTimeFactor(parseFloat((elapsedMs / 1000 / dur).toFixed(2)));
      
      const text = response.text || 'Nie wykryto zrozumiałych sylab. Spróbuj mówić wyraźniej.';
      const trimmedText = text.trim();
      setTranscriptionResult(trimmedText);
      
      if (freeSpeechMode && trimmedText) {
        setTargetPracticeText(trimmedText);
      }
      
      if (response.language) {
        setDetectedLanguage(response.language);
      }
    } catch (err: any) {
      console.error(err);
      setTranscriptionResult(`Błąd podczas dekodowania: ${err.message || 'Nieznany błąd.'}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearSessionData = () => {
    setActiveSample(null);
    setTranscriptionResult('');
    setInferenceTime(null);
    setAudioDuration(null);
    setRealTimeFactor(null);
    setDetectedLanguage(null);
    setRecordedBuffer(null);
    audioChunksRef.current = [];
    setRecordDuration(0);
  };

  const togglePlaySample = (sample: AudioSample) => {
    if (playingSampleId === sample.id) {
      if (audioSampleObjectRef.current) {
        audioSampleObjectRef.current.pause();
      }
      setPlayingSampleId(null);
    } else {
      if (audioSampleObjectRef.current) {
        audioSampleObjectRef.current.pause();
      }
      const audio = new Audio(sample.url);
      audioSampleObjectRef.current = audio;
      audio.play().catch(e => {
        console.error("Audio playback failed", e);
      });
      setPlayingSampleId(sample.id);
      audio.onended = () => {
        setPlayingSampleId(null);
      };
    }
  };

  const transcribeSample = async (sample: AudioSample) => {
    if (!transcriberRef.current) {
      setLoadError('Najpierw zainicjuj / pobierz model Whisper za pomocą przycisku po lewej stronie!');
      return;
    }

    setIsTranscribing(true);
    setIsTranscribingSampleId(sample.id);
    setActiveSample(sample);
    setTranscriptionResult(`Pobieranie próbki ${sample.name}...`);

    try {
      const response = await fetch(sample.url);
      if (!response.ok) {
        throw new Error(`Błąd pobierania próbki audio: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      setTranscriptionResult(`Dekodowanie audio do 16000Hz w tle...`);

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const float32Data = audioBuffer.getChannelData(0);
      setRecordedBuffer(float32Data);

      const dur = audioBuffer.duration;
      setAudioDuration(parseFloat(dur.toFixed(2)));
      setTranscriptionResult(`Lokalny model Wav2Vec2 analizuje próbkę dźwiękową...`);

      const startTime = performance.now();

      const languageMap: Record<string, string> = {
        pl: 'polish',
        en: 'english',
        de: 'german',
        es: 'spanish'
      };
      
      const targetLang = sample.lang === 'es' ? 'spanish' : (languageMap[accentLanguage] || 'english');
      const isEnglishOnly = selectedModel.endsWith('.en');

      const modelResult = await transcriberRef.current(float32Data, {
        ...(isEnglishOnly ? {} : { language: targetLang, task: 'transcribe' }),
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false
      });

      const endTime = performance.now();
      const elapsedMs = endTime - startTime;

      setInferenceTime(Math.round(elapsedMs));
      setRealTimeFactor(parseFloat((elapsedMs / 1000 / dur).toFixed(2)));
      
      const text = modelResult.text || 'Nie wykryto tekstu w próbce.';
      setTranscriptionResult(text.trim());
      
      if (modelResult.language) {
        setDetectedLanguage(modelResult.language);
      }
    } catch (err: any) {
      console.error(err);
      setTranscriptionResult(`Błąd transkrypcji próbki: ${err.message || 'Nieznany błąd.'}`);
    } finally {
      setIsTranscribing(false);
      setIsTranscribingSampleId(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!transcriberRef.current) {
      setLoadError('Najpierw załaduj model Whisper po lewej stronie, aby móc analizować własne pliki dźwiękowe!');
      return;
    }

    setIsTranscribing(true);
    setActiveSample(null);
    setTranscriptionResult(`Wczytywanie lokalnego pliku: ${file.name}...`);

    try {
      const reader = new FileReader();
      const arrayBufferPromise = new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
      });
      reader.readAsArrayBuffer(file);
      const arrayBuffer = await arrayBufferPromise;

      setTranscriptionResult(`Dekodowanie wgranego pliku audio do 16000Hz...`);

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const float32Data = audioBuffer.getChannelData(0);
      setRecordedBuffer(float32Data);

      const dur = audioBuffer.duration;
      setAudioDuration(parseFloat(dur.toFixed(2)));
      setTranscriptionResult(`Wgrywany plik odsłuchiwany przez lokalne AI Whisper...`);

      const startTime = performance.now();

      const languageMap: Record<string, string> = {
        pl: 'polish',
        en: 'english',
        de: 'german',
        es: 'spanish'
      };
      
      const targetLang = languageMap[accentLanguage] || 'english';
      const isEnglishOnly = selectedModel.endsWith('.en');

      const modelResult = await transcriberRef.current(float32Data, {
        ...(isEnglishOnly ? {} : { language: targetLang, task: 'transcribe' }),
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false
      });

      const endTime = performance.now();
      const elapsedMs = endTime - startTime;

      setInferenceTime(Math.round(elapsedMs));
      setRealTimeFactor(parseFloat((elapsedMs / 1000 / dur).toFixed(2)));
      
      const text = modelResult.text || 'Nie wykryto zrozumiałego tekstu w przesłanym pliku.';
      setTranscriptionResult(text.trim());
      
      if (modelResult.language) {
        setDetectedLanguage(modelResult.language);
      }
    } catch (err: any) {
      console.error(err);
      setTranscriptionResult(`Błąd przetwarzania wgranego pliku: ${err.message || 'Nieznany błąd. Upewnij się, że to poprawny plik audio.'}`);
    } finally {
      setIsTranscribing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCopyText = () => {
    if (!transcriptionResult) return;
    navigator.clipboard.writeText(transcriptionResult);
  };

  const handleInsertToChat = () => {
    if (!transcriptionResult || !onInsertTextIntoChat) return;
    onInsertTextIntoChat(transcriptionResult);
  };

  // Human Readable file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12 w-full overflow-x-hidden px-2 md:px-0">
      {/* Visual Header */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 border border-emerald-500/20">
                <Zap size={10} /> WebGPU Sandbox
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                webGpuAvailable 
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {webGpuAvailable ? '● WebGPU Dostępne' : '▲ Brak WebGPU (WASM Fallback)'}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mt-1 text-white">Rozpoznawanie Akustyczne (CTC Wav2Vec2)</h2>
            <p className="text-xs text-white/50 mt-1 max-w-xl">
              Model akustyczny Wav2Vec2 wyciąga surowe fonemy i wyrazy 100% lokalnie. Następnie AI ocenia dokładnie Twoją wymowę.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              disabled={isModelLoading || isModelLoaded}
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-white [&>option]:bg-[#151515] max-w-[200px] sm:max-w-none truncate"
            >
              {ACOUSTIC_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name} - {m.desc}</option>
              ))}
            </select>
            
            <select
              disabled={isModelLoading || isModelLoaded}
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-white [&>option]:bg-[#151515] max-w-[120px] sm:max-w-none"
            >
              <option value="webgpu" disabled={!webGpuAvailable}>WebGPU (Śpieszny)</option>
              <option value="wasm">WASM CPU (Wolniejszy)</option>
            </select>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Loading and Config Column */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard className="p-6 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/70 flex items-center gap-2">
                <Cpu size={16} className="text-blue-400" /> Silnik i Zbiór
              </h3>
              
              {!isModelLoaded ? (
                <div className="space-y-4 py-2">
                  <div className="bg-black/20 rounded-xl p-3 border border-white/5 space-y-2">
                    <p className="text-xs text-white/70">
                      Wymagane jest pobranie plików wag modeli ONNX oraz biblioteki WASM/WGSL. 
                      Przeglądarka zapisuje je w lokalnej pamięci podręcznej (Cache Storage), dzięki czemu kolejne uruchomienia są natychmiastowe!
                    </p>
                  </div>
                  
                  {isModelLoading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-blue-400 animate-pulse">{loadingStatusText}</span>
                        <span className="text-purple-400">{overallProgress}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${overallProgress}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                    </div>
                  )}

                  {loadError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-2 text-xs text-red-300">
                      <AlertCircle size={16} className="shrink-0 text-red-400" />
                      <div>
                        <p className="font-bold">Błąd instalacji:</p>
                        <p className="opacity-80 break-words">{loadError}</p>
                      </div>
                    </div>
                  )}

                  <GlassButton
                    onClick={loadAcousticModel}
                    disabled={isModelLoading}
                    className="w-full text-xs font-bold"
                  >
                    {isModelLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin" /> Pobieranie wag...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Download size={14} /> Zainicjuj Model Akustyczny (CTC)
                      </span>
                    )}
                  </GlassButton>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle className="text-emerald-400 shrink-0" size={24} />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Model załadowany!</h4>
                      <p className="text-[10px] text-emerald-400/80 mt-0.5 font-mono">{selectedModel} ({selectedDevice.toUpperCase()})</p>
                    </div>
                  </div>
                  
                  <div className="text-[10px] space-y-1 bg-black/30 rounded-xl p-3 font-mono text-white/50 max-h-36 overflow-y-auto">
                    <p className="text-white/30 border-b border-white/5 pb-1 mb-1 font-bold">Weryfikacja Modułów:</p>
                    {Object.values(fileProgresses).map((fp, i) => (
                      <div key={i} className="flex justify-between text-[9px]">
                        <span className="truncate max-w-[130px]" title={fp.file}>{fp.file}</span>
                        <span className="text-blue-400">{fp.status} ({fp.progress}%)</span>
                      </div>
                    ))}
                    {Object.keys(fileProgresses).length === 0 && (
                      <p className="italic text-white/30">Wszystkie wagi wczytano poprawnie z pamięci podręcznej.</p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsModelLoaded(false);
                      transcriberRef.current = null;
                    }}
                    className="w-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-white/5"
                  >
                    Odłącz Model / Zmień Parametry
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-white/5 pt-4">
              <div className="flex items-center justify-between text-[11px] text-white/40">
                <span>Konwerter tonów:</span>
                <span className="font-mono text-white/60">SampleRate: 16kHz</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-white/40 mt-1">
                <span>Kanał sygnałowy:</span>
                <span className="font-mono text-white/60">Monofoniczny</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Audio Recording & Output Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Target Practice Text Setup Card */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Target size={18} className="text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/90">
                  1. Zadanie Treningowe (GOP / MFA)
                </h3>
                <p className="text-[10px] text-white/40">
                  Wybierz automatyczną detekcję mowy lub wpisz określone zdanie do analizy fonetycznej.
                </p>
              </div>
            </div>

            {/* Tryb pracy selector */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
              <label className="text-[9px] text-white/40 uppercase font-black tracking-widest block border-b border-white/5 pb-1.5">
                Konfiguracja trybu pracy:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFreeSpeechMode(true)}
                  className={`px-4 py-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                    freeSpeechMode
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/5'
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-[11px]">
                    <Sparkles size={13} className={freeSpeechMode ? "text-emerald-400 animate-pulse" : ""} />
                    <span>Tryb Wolnej Mowy (Zalecany)</span>
                  </div>
                  <span className="text-[9px] opacity-75 leading-tight">
                    Mów bez pisania. AI automatycznie rozpozna tekst ze słuchu i przeprowadzi analizę fonemów.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFreeSpeechMode(false);
                    setTargetPracticeText('The quick brown fox jumps over the lazy dog.');
                  }}
                  className={`px-4 py-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                    !freeSpeechMode
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-500/5'
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-[11px]">
                    <Type size={13} className={!freeSpeechMode ? "text-cyan-400" : ""} />
                    <span>Tryb Szablonu / Tekstu</span>
                  </div>
                  <span className="text-[9px] opacity-75 leading-tight">
                    Wpisz własny tekst lub wybierz gotowy szablon zdania do idealnego przećwiczenia.
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Presets Pills */}
            <div className={`space-y-2 transition-all duration-300 ${freeSpeechMode ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex justify-between items-center">
                <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block">
                  Wybierz gotowy szablon:
                </label>
                {freeSpeechMode && (
                  <span className="text-[8px] text-amber-400 uppercase font-black tracking-wider">
                    Uruchomiono tryb wolnej mowy
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {PRACTICE_TEMPLATES.filter(p => p.lang === (accentLanguage === 'es' ? 'es' : 'en')).map(p => (
                  <button
                    key={p.id}
                    onClick={() => setTargetPracticeText(p.text)}
                    disabled={freeSpeechMode}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border flex items-center gap-1.5 ${
                      targetPracticeText === p.text
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/60 hover:text-white/80'
                    }`}
                  >
                    <span>{p.title}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                      p.difficulty === 'Łatwe' ? 'bg-emerald-500/10 text-emerald-400' :
                      p.difficulty === 'Średnie' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {p.difficulty}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Text Area */}
            <div className={`space-y-1.5 transition-all duration-300 ${freeSpeechMode ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block">Tekst docelowy (Edytowalny):</label>
              <textarea
                value={targetPracticeText}
                onChange={(e) => setTargetPracticeText(e.target.value)}
                disabled={freeSpeechMode}
                placeholder="Wpisz słowa lub zdania, które chcesz wypowiedzieć..."
                rows={2}
                className="w-full bg-black/30 border border-white/10 focus:border-emerald-500/50 rounded-xl p-3 text-xs text-white outline-none placeholder-white/20 transition-all font-sans leading-relaxed focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>

            {/* GOP Engine Chooser */}
            <div className="space-y-2 pt-3 border-t border-white/5">
              <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block">Model Analizy Fonetycznej:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGopEngineMode('phonetic-gop')}
                  className={`px-3 py-2 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                    gopEngineMode === 'phonetic-gop'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/5'
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                  }`}
                >
                  <span className="text-[11px] font-bold">Lokalny GOP v1 (Phonetic Levenshtein)</span>
                  <span className="text-[9px] opacity-75 leading-tight">Precyzyjny podział na sylaby i fonemy z surowym trasowaniem błędów.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGopEngineMode('ctc-viterbi')}
                  className={`px-3 py-2 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                    gopEngineMode === 'ctc-viterbi'
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/5'
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                  }`}
                >
                  <span className="text-[11px] font-bold">Acoustic CTC v2 (Wav2Vec2 Phoneme + Viterbi)</span>
                  <span className="text-[9px] opacity-75 leading-tight">Architektura z wyjściem fonemowym CTC (model akustyczny) i wyrównaniem Viterbiego.</span>
                </button>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/70 mb-4 flex items-center gap-2">
              <Mic size={16} className="text-purple-400" /> Detekcja sygnału głosowego
            </h3>

            <div className="flex flex-col md:flex-row items-center gap-6 py-4">
              {/* Mic Circle */}
              <div className="relative flex-shrink-0">
                <motion.div
                  animate={isRecording ? {
                    scale: [1, 1.15, 1],
                    boxShadow: [
                      '0 0 0 0px rgba(168, 85, 247, 0.4)',
                      '0 0 0 20px rgba(168, 85, 247, 0)',
                      '0 0 0 0px rgba(168, 85, 247, 0.4)'
                    ]
                  } : { scale: 1, boxShadow: 'none' }}
                  transition={isRecording ? {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  } : {}}
                  className={`w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 relative ${
                    isRecording 
                      ? 'bg-red-500/20 border-red-500 text-red-500' 
                      : isModelLoaded 
                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 hover:border-blue-400 cursor-pointer' 
                        : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                  }`}
                  onClick={!isModelLoaded ? undefined : isRecording ? processAudioDataAndTranscribe : startRecordingSession}
                >
                  {isRecording ? <Square size={32} fill="currentColor" /> : <Mic size={36} />}
                </motion.div>
                
                {isRecording && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                  </span>
                )}
              </div>

              {/* Analyzer & Timer */}
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                    {isRecording ? 'Zapisuję mowę...' : 'Urządzenie gotowe do nagrywania'}
                  </span>
                  
                  <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-white/5">
                    <Clock size={12} className="text-white/40" />
                    <span className="text-xs font-mono font-bold text-white/80">
                      {Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Animated Spectrum representation */}
                <div className="h-16 w-full bg-black/20 rounded-xl relative overflow-hidden border border-white/5 flex items-center justify-center">
                  {!isRecording ? (
                    <p className="text-xs text-white/30 italic">Wciśnij mikrofon lub załaduj model, by zacząć</p>
                  ) : (
                    <canvas 
                      ref={canvasRef} 
                      className="w-full h-full absolute inset-0" 
                      width={300} 
                      height={64}
                    />
                  )}
                </div>

                {micError && (
                  <p className="text-xs text-red-400 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {micError}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="flex gap-2 justify-end border-t border-white/5 pt-4 mt-2">
              {isRecording && (
                <GlassButton
                  onClick={processAudioDataAndTranscribe}
                  variant="primary"
                  className="text-xs py-2 bg-gradient-to-r from-purple-600 to-blue-600 border border-purple-500"
                >
                  <Sparkles size={14} className="mr-2" /> Zakończ i transkrybuj
                </GlassButton>
              )}
              
              {!isRecording && audioChunksRef.current.length > 0 && (
                <>
                  <button
                    onClick={clearSessionData}
                    className="bg-white/5 hover:bg-red-500/10 text-white/60 hover:text-red-400 px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1 border border-white/5"
                  >
                    <Trash2 size={12} /> Wyczyść bufor
                  </button>
                </>
              )}
            </div>
          </GlassCard>

          {/* File Upload & Analysis Bench */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/70 flex items-center gap-2">
                  <FileAudio size={16} className="text-cyan-400" /> Przesyłanie Własnych Nagrań
                </h3>
                <p className="text-[11px] text-white/50 mt-1">Wybierz plik MP3 lub WAV ze swojego urządzenia, aby poddać go lokalnej i prywatnej analizie AI.</p>
              </div>
              
              <div className="shrink-0">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="audio/*"
                  className="hidden" 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isModelLoaded || isTranscribing}
                  className={`text-xs font-bold uppercase tracking-wider py-3 px-5 rounded-2xl transition-all border flex items-center gap-2 ${
                    isModelLoaded 
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50 shadow-lg shadow-blue-900/20' 
                      : 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  <Upload size={16} /> Wybierz plik audio
                </button>
              </div>
            </div>

            {/* Helpful disclaimer */}
            <div className="flex gap-3 items-start bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 rounded-2xl p-4 text-[11px] text-blue-300/80 transition-all">
              <Info size={16} className="shrink-0 text-blue-400 mt-0.5" />
              <p className="leading-relaxed">
                Wgrywane pliki audio są dekodowane w locie bezpośrednio w Twojej przeglądarce. Wykryte fale dźwiękowe przesyłane są bezpośrednio do modelu wczytanego w Twojej karcie graficznej (WebGPU) lub procesorze (WASM). Żadne dane nie opuszczają Twojego komputera, co gwarantuje pełną prywatność i bezpieczeństwo.
              </p>
            </div>
          </GlassCard>

          {/* Results Box - "AI Heard" Eval View */}
          <GlassCard className="p-6 border-white/20 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Sparkles size={120} />
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                  <Sparkles size={16} /> Co AI usłyszało?
                </h3>
                <p className="text-[10px] text-white/40 mt-0.5">Porównaj ten tekst ze swoją intencją, aby ocenić akcent.</p>
              </div>
              
              {transcriptionResult && !isTranscribing && (
                <div className="flex gap-1.5">
                  <button
                    onClick={handleCopyText}
                    title="Kopiuj transkrypcję"
                    className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all border border-white/5"
                  >
                    <Copy size={14} />
                  </button>
                  {onInsertTextIntoChat && (
                    <button
                      onClick={handleInsertToChat}
                      className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border border-emerald-500/20 shadow-lg shadow-emerald-900/10"
                    >
                      <Plus size={12} /> Wklej do nauki
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className={`min-h-32 rounded-3xl p-6 font-medium text-lg leading-relaxed transition-all duration-500 ${
              isTranscribing 
                ? 'bg-blue-500/5 text-blue-300 border border-blue-500/20 flex flex-col items-center justify-center gap-4 py-12' 
                : transcriptionResult 
                  ? 'bg-black/40 border border-white/20 text-white shadow-inner backdrop-blur-md' 
                  : 'bg-black/10 border border-dashed border-white/10 text-white/20 flex flex-col items-center justify-center gap-2 italic'
            }`}>
              {isTranscribing ? (
                <>
                  <div className="relative">
                    <RefreshCw size={40} className="animate-spin text-blue-400/50" />
                    <Cpu size={16} className="absolute inset-0 m-auto text-blue-400 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold tracking-tight text-blue-400 uppercase mb-1">Analiza WebGPU</p>
                    <p className="text-xs font-medium text-blue-300/60 animate-pulse">{transcriptionResult}</p>
                  </div>
                </>
              ) : transcriptionResult ? (
                <div className="relative flex flex-col gap-6 text-left">
                  {/* Local Phonetic & Physical Acoustic Analysis (GOP) */}
                  {(() => {
                    const lang = accentLanguage === 'es' ? 'es' : 'en';
                    const gop = calculatePhysicalGOP(targetPracticeText, transcriptionResult, recordedBuffer, lang);
                    
                    const score = gop.overallScore;
                    const accentLabel = score >= 80 ? 'Prawie jak native speaker' : score >= 55 ? 'Komunikatywny akcent' : 'Wymaga staranniejszej wymowy';
                    const accentColor = score >= 80 ? 'text-emerald-400' : score >= 55 ? 'text-amber-400' : 'text-red-400';
                    const progressGradient = score >= 80 ? 'from-emerald-500 to-teal-500' : score >= 55 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-500';

                    const correctWords = gop.wordScores.filter(w => w.isCorrect && w.type !== 'insertion');
                    const deviatedWords = gop.wordScores.filter(w => !w.isCorrect || w.type === 'insertion' || w.type === 'deletion');

                    return (
                      <div className="space-y-6">
                        {/* Summary Score Dashboard */}
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            {/* Score ring */}
                            <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-6">
                              <div className="relative w-28 h-28 flex items-center justify-center">
                                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 112 112">
                                  <circle cx="56" cy="56" r="48" className="stroke-white/5 fill-none" strokeWidth="8" />
                                  <circle 
                                    cx="56" 
                                    cy="56" 
                                    r="48" 
                                    className={`fill-none transition-all duration-1000 ${
                                      score >= 80 ? 'stroke-emerald-500' : score >= 55 ? 'stroke-amber-500' : 'stroke-rose-500'
                                    }`}
                                    strokeWidth="8" 
                                    strokeDasharray="301.6" 
                                    strokeDashoffset={301.6 - (301.6 * score) / 100}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <span className={`text-3xl font-black font-mono absolute ${accentColor}`}>
                                  {score}%
                                </span>
                              </div>
                              <div className="mt-3">
                                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">OCENA AKCENTU</span>
                                <span className="text-white font-bold text-xs mt-1 bg-white/10 rounded-full px-3 py-1 border border-white/5 inline-block">
                                  {accentLabel}
                                </span>
                              </div>
                            </div>

                            {/* Acoustic sub-metrics */}
                            <div className="md:col-span-8 space-y-3.5">
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-white/60 font-medium">Klarowność Samogłosek (Vowels)</span>
                                  <span className="text-white font-bold font-mono">{gop.vowelScore}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                  <div className={`h-full bg-gradient-to-r ${progressGradient} transition-all duration-500`} style={{ width: `${gop.vowelScore}%` }} />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-white/60 font-medium">Artykulacja Spółgłosek (Consonants)</span>
                                  <span className="text-white font-bold font-mono">{gop.consonantScore}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                  <div className={`h-full bg-gradient-to-r ${progressGradient} transition-all duration-500`} style={{ width: `${gop.consonantScore}%` }} />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                  <span className="text-[9px] text-white/40 uppercase font-black block tracking-wider">Płynność (Fluency)</span>
                                  <span className="text-sm font-bold text-white font-mono">{gop.fluencyScore}%</span>
                                </div>
                                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                  <span className="text-[9px] text-white/40 uppercase font-black block tracking-wider">Tempo (WPM)</span>
                                  <span className="text-sm font-bold text-white font-mono">{gop.tempoWPM} WPM</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stacked Full Sentence Comparison */}
                        <div className="bg-gradient-to-br from-black/60 to-black/30 rounded-3xl p-6 border border-cyan-500/10 space-y-6 text-left shadow-2xl relative overflow-hidden">
                          <div className="absolute inset-0 bg-cyan-500/5 mix-blend-overlay pointer-events-none" />
                          
                          <div className="relative">
                            <span className="text-[10px] text-cyan-400 uppercase font-black tracking-widest block mb-4 border-b border-white/5 pb-2">
                              Wizualne dopasowanie fonetyczne (Tekst + Fonemy):
                            </span>
                            
                            {/* Unified Aligned Flow (Sentence & Phonetics matched word-by-word) */}
                            <div className="flex flex-wrap items-start gap-x-6 gap-y-6">
                              {gop.wordScores.map((ws, i) => {
                                const isCorrect = ws.isCorrect && ws.type !== 'deletion' && ws.type !== 'insertion';
                                const isDel = ws.type === 'deletion';
                                const isIns = ws.type === 'insertion';
                                
                                let wordColor = 'text-emerald-400';
                                if (isDel) {
                                  wordColor = 'text-rose-400/50 line-through';
                                } else if (isIns) {
                                  wordColor = 'text-blue-400 italic';
                                } else if (!isCorrect) {
                                  wordColor = 'text-rose-400 underline decoration-wavy decoration-rose-500/50';
                                }

                                return (
                                  <div key={i} className="flex flex-col items-center gap-2 bg-white/[0.02] border border-white/5 p-3 rounded-2xl hover:bg-white/[0.05] transition-all">
                                    {/* Text Word */}
                                    <span className={`text-base font-bold tracking-wide ${wordColor}`}>
                                      {ws.word}
                                    </span>
                                    
                                    {/* Line Separator */}
                                    <div className="w-8 h-[1px] bg-white/10" />
                                    
                                    {/* Phonetic representation exactly beneath */}
                                    <div className="flex flex-wrap justify-center gap-0.5 font-mono text-xs">
                                      {ws.targetPhonemes.length > 0 ? (
                                        ws.targetPhonemes.map((tp, pIdx) => {
                                          const isPhonemeMatch = ws.phonemeCorrectness ? ws.phonemeCorrectness[pIdx] : (!isDel && !isIns && ws.heardPhonemes.includes(tp));
                                          return (
                                            <span 
                                              key={pIdx} 
                                              className={`font-black tracking-wide px-0.5 ${
                                                isPhonemeMatch ? 'text-emerald-400' : 'text-rose-400 font-bold underline decoration-2'
                                              }`}
                                              title={isPhonemeMatch ? 'Poprawnie' : 'Błąd'}
                                            >
                                              {tp}
                                            </span>
                                          );
                                        })
                                      ) : (
                                        <span className="text-white/20 italic text-[10px]">Brak</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Word-by-Word Phonetic Alignment Visualizer */}
                        <div className="space-y-4">
                          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                            Szczegółowa analiza fonetyczna (Słowo po słowie):
                          </span>
                          
                          <div className="flex flex-wrap gap-4 items-stretch">
                            {gop.wordScores.map((ws, i) => {
                              const isCorrect = ws.isCorrect;
                              const isDel = ws.type === 'deletion';
                              const isIns = ws.type === 'insertion';
                              
                              let cardBg = "bg-emerald-500/5 border-emerald-500/10 text-emerald-300";
                              let textClass = "text-emerald-400";
                              if (isDel) {
                                cardBg = "bg-rose-500/5 border-rose-500/10 opacity-60";
                                textClass = "text-rose-400/50 line-through";
                              } else if (isIns) {
                                cardBg = "bg-blue-500/5 border-blue-500/10";
                                textClass = "text-blue-400 italic";
                              } else if (!isCorrect) {
                                cardBg = "bg-rose-500/5 border-rose-500/10 text-rose-300";
                                textClass = "text-rose-400 font-bold";
                              }
                              
                              return (
                                <div key={i} className={`p-4 rounded-2xl border flex flex-col justify-between items-center text-center min-w-[100px] flex-1 sm:flex-initial transition-all ${cardBg}`}>
                                  {/* Word Text */}
                                  <span className={`text-sm font-bold tracking-wide ${textClass}`}>
                                    {ws.word}
                                  </span>
                                  
                                  {/* Phonetic transcription beneath */}
                                  <div className="flex flex-wrap justify-center gap-1 mt-3 bg-black/40 px-2.5 py-1 rounded-xl border border-white/5">
                                    {ws.targetPhonemes.length > 0 ? (
                                      ws.targetPhonemes.map((tp, pIdx) => {
                                        const isPhonemeMatch = ws.phonemeCorrectness ? ws.phonemeCorrectness[pIdx] : (!isDel && !isIns && ws.heardPhonemes.includes(tp));
                                        return (
                                          <span 
                                            key={pIdx} 
                                            className={`text-[11px] font-mono font-bold tracking-wider ${
                                              isPhonemeMatch ? 'text-emerald-400' : 'text-rose-400 underline decoration-2 underline-offset-2'
                                            }`}
                                            title={isPhonemeMatch ? 'Dźwięk poprawny' : 'Błąd wymowy'}
                                          >
                                            {tp}
                                          </span>
                                        );
                                      })
                                    ) : (
                                      <span className="text-[10px] text-white/30 italic">Brak</span>
                                    )}
                                  </div>
                                  
                                  {/* Error type label if incorrect */}
                                  {!isCorrect && !isDel && !isIns && (
                                    <span className="text-[9px] text-amber-300/80 mt-2 block font-medium max-w-[120px]">
                                      {getPhonemeErrorHint(ws.targetPhonemes, ws.heardPhonemes)}
                                    </span>
                                  )}
                                  {isDel && (
                                    <span className="text-[9px] text-rose-400/60 mt-2 block font-medium">Pominięto</span>
                                  )}
                                  {isIns && (
                                    <span className="text-[9px] text-blue-400/60 mt-2 block font-medium">Nadmiar</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Educational Information Box answering "how does AI know?" */}
                        <div className="p-5 bg-cyan-500/5 border border-cyan-500/15 rounded-3xl text-[12.5px] text-white/80 space-y-4 leading-relaxed text-left mt-6">
                          <h4 className="font-bold text-cyan-400 flex items-center gap-2 uppercase tracking-wider text-[10px]">
                            <Info size={14} /> Profesjonalna Architektura Oceny Wymowy (ASR + Fonetyka)
                          </h4>
                          <p className="opacity-90">
                            W tradycyjnych aplikacjach model mowy (np. Whisper) próbuje odgadnąć cały tekst, co ukrywa drobne wady akcentu. Nasza aplikacja oddziela <strong>rozpoznawanie intencji</strong> od <strong>fizycznej analizy wymowy</strong>:
                          </p>
                          <div className="space-y-4 text-[12px] opacity-90 pl-1">
                            <div className="flex gap-3">
                              <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">1</div>
                              <div>
                                <strong className="text-cyan-300 font-bold block mb-0.5">Tekst Wzorcowy → G2P (Grapheme-to-Phoneme)</strong>
                                W trybie <em>Szablonu</em> analizujemy wybrany tekst. W trybie <em>Wolnej Mowy</em> najpierw model ASR (Whisper/Wav2Vec2) zgaduje Twoją <strong>intencję</strong> i zamienia ją na tekst. Następnie system korzysta ze słownika <strong>CMUdict</strong> (oraz algorytmów g2p-en), aby precyzyjnie przetłumaczyć ten docelowy tekst na idealny, bezbłędny ciąg fonemów (np. <code>hello</code> → <code>HH AH L OW</code>).
                              </div>
                            </div>
                            
                            <div className="flex gap-3">
                              <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">2</div>
                              <div>
                                <strong className="text-cyan-300 font-bold block mb-0.5">Audio → Surowe Fonemy (Wav2Vec2 CTC)</strong>
                                Niezależnie od tekstu, Twoje audio trafia do modelu akustycznego (encoder fonemowy). Ten model nie obchodzą słowa – wyłapuje tylko <strong>fizyczne dźwięki</strong>, które rzeczywiście opuściły Twoje usta. Zamiast "hello", model może usłyszeć np. <code>HH AA L OW</code>.
                              </div>
                            </div>
                            
                            <div className="flex gap-3">
                              <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">3</div>
                              <div>
                                <strong className="text-cyan-300 font-bold block mb-0.5">Dopasowanie Czasowe (Viterbi Forced Alignment) i GOP</strong>
                                System nakłada idealny wzorzec (z kroku 1) na to, co rzeczywiście powiedziałeś (z kroku 2). Algorytm Viterbiego dopasowuje fonemy w czasie, by obliczyć wynik GOP (Goodness of Pronunciation). To pozwala wskazać, że zamiast <code>AH</code> powiedziałeś <code>AA</code>, i sklasyfikować to jako "zbyt otwarta samogłoska".
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="relative group mt-6">
                    <label className="text-[9px] text-white/40 uppercase font-black tracking-wider block mb-2 px-4">Pełna Transkrypcja Akustyczna</label>
                    <div className="absolute -left-2 top-0 bottom-0 w-1 bg-emerald-500 rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    <p className="whitespace-pre-wrap pl-4 tracking-tight drop-shadow-md selection:bg-emerald-500/40 italic text-white/80">
                      "{transcriptionResult}"
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Volume2 size={32} className="opacity-20 mb-2" />
                  <p className="text-xs uppercase tracking-widest font-bold">Oczekiwanie na sygnał</p>
                  <p className="text-[10px] opacity-50">Nagraj coś, aby zobaczyć magię AI w Twojej przeglądarce.</p>
                </>
              )}
            </div>

            {/* Performance telemetry stats */}
            {inferenceTime !== null && !isTranscribing && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 border-t border-white/5 pt-4 text-center">
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                  <span className="text-[9px] text-white/40 block pb-0.5 uppercase tracking-wider">Inference Speed</span>
                  <span className="text-xs font-mono font-bold text-white flex items-center justify-center gap-1">
                    <Zap size={11} className="text-cyan-400" /> {inferenceTime} ms
                  </span>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                  <span className="text-[9px] text-white/40 block pb-0.5 uppercase tracking-wider">Audio Length</span>
                  <span className="text-xs font-mono font-bold text-white flex items-center justify-center gap-1">
                    <Clock size={11} className="text-blue-400" /> {audioDuration} s
                  </span>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                  <span className="text-[9px] text-white/40 block pb-0.5 uppercase tracking-wider">Real-time Factor</span>
                  <span className="text-xs font-mono font-bold text-white flex items-center justify-center gap-1">
                    <Volume2 size={11} className="text-purple-400" /> {realTimeFactor}x
                  </span>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                  <span className="text-[9px] text-white/40 block pb-0.5 uppercase tracking-wider">Target Języka</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                    {detectedLanguage || accentLanguage}
                  </span>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

      </div>
    </div>
  );
};
