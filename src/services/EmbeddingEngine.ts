import { pipeline, env } from '@huggingface/transformers';

// Enable browser cache for ONNX model files
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface ModelProgress {
  status: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

export interface EmbeddingModelOption {
  id: string;
  name: string;
  size: string;
  multilingual: boolean;
  description: string;
  recommended?: boolean;
}

export const EMBEDDING_MODELS: EmbeddingModelOption[] = [
  {
    id: 'Xenova/multilingual-e5-small',
    name: 'Multilingual E5 Small',
    size: '~90 MB',
    multilingual: true,
    description: 'Świetny wielojęzyczny model (PL, EN, DE, ES, FR, itp.). Idealny do wyszukiwania semantycznego.',
    recommended: true
  },
  {
    id: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
    name: 'Paraphrase Multilingual MiniLM-L12',
    size: '~118 MB',
    multilingual: true,
    description: 'Zaawansowany model wielojęzyczny o wysoki stopniu rozumienia kontekstu.'
  },
  {
    id: 'Xenova/all-MiniLM-L6-v2',
    name: 'All-MiniLM-L6-v2',
    size: '~23 MB',
    multilingual: false,
    description: 'Kompaktowy, ultraszybki model semantyczny (~23MB, do krótkich fraz i testów).'
  },
  {
    id: 'Xenova/bge-small-en-v1.5',
    name: 'BGE Small EN v1.5',
    size: '~33 MB',
    multilingual: false,
    description: 'Precyzyjny lekki model wektorowy (angielski).'
  }
];

export function cosineSimilarity(a: number[] | Float32Array, b: number[] | Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

class EmbeddingEngineClass {
  private pipelineInstance: any = null;
  private currentModelId: string | null = null;
  private isInitializing: boolean = false;

  public async getExtractor(
    modelId: string = 'Xenova/multilingual-e5-small',
    device: 'webgpu' | 'wasm' = 'webgpu',
    onProgress?: (progress: ModelProgress) => void
  ) {
    if (this.pipelineInstance && this.currentModelId === modelId) {
      return this.pipelineInstance;
    }

    if (this.isInitializing) {
      // Wait for existing initialization to finish
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.pipelineInstance && this.currentModelId === modelId) {
        return this.pipelineInstance;
      }
    }

    this.isInitializing = true;
    try {
      let activeDevice = device;
      if (activeDevice === 'webgpu' && (typeof navigator === 'undefined' || !(navigator as any).gpu)) {
        activeDevice = 'wasm';
      }

      const instance = await pipeline('feature-extraction', modelId, {
        device: activeDevice,
        progress_callback: (p: any) => {
          if (onProgress) {
            onProgress({
              status: p.status || 'loading',
              file: p.file,
              progress: typeof p.progress === 'number' ? p.progress : (p.loaded && p.total ? (p.loaded / p.total) * 100 : 0),
              loaded: p.loaded,
              total: p.total
            });
          }
        }
      });

      this.pipelineInstance = instance;
      this.currentModelId = modelId;
      return instance;
    } catch (err: any) {
      console.warn('Failed to initialize with device, falling back to WASM:', err);
      // Fallback to CPU/WASM if WebGPU fails
      const instance = await pipeline('feature-extraction', modelId, {
        device: 'wasm',
        progress_callback: (p: any) => {
          if (onProgress) {
            onProgress({
              status: p.status || 'loading',
              file: p.file,
              progress: typeof p.progress === 'number' ? p.progress : (p.loaded && p.total ? (p.loaded / p.total) * 100 : 0),
              loaded: p.loaded,
              total: p.total
            });
          }
        }
      });
      this.pipelineInstance = instance;
      this.currentModelId = modelId;
      return instance;
    } finally {
      this.isInitializing = false;
    }
  }

  public async embedText(
    text: string,
    modelId: string,
    device: 'webgpu' | 'wasm' = 'webgpu',
    isQuery: boolean = false,
    onProgress?: (progress: ModelProgress) => void
  ): Promise<number[]> {
    const extractor = await this.getExtractor(modelId, device, onProgress);
    
    // Add prefix for E5 models if applicable
    let prepText = text.trim();
    if (modelId.includes('e5')) {
      prepText = isQuery ? `query: ${prepText}` : `passage: ${prepText}`;
    }

    const output = await extractor(prepText, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  public isModelLoaded(modelId: string): boolean {
    return this.pipelineInstance !== null && this.currentModelId === modelId;
  }

  public getCurrentModelId(): string | null {
    return this.currentModelId;
  }
}

export const EmbeddingEngine = new EmbeddingEngineClass();
