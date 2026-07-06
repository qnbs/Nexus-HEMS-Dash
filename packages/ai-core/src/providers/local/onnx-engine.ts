/**
 * ONNX Runtime Web engine.
 *
 * Phase 2a provides the loading scaffold. A concrete model must be supplied
 * via configuration; until then the engine reports availability based on
 * WebAssembly support and returns a guidance message.
 */

import * as ort from 'onnxruntime-web';
import type { AIEngine, AIProviderKey, AIRequest, AIResponse } from '../../types.ts';

export interface OnnxEngineConfig {
  modelUrl?: string;
  executionProviders?: string[];
}

export class OnnxEngine implements AIEngine {
  readonly provider = 'onnx' as const;
  readonly local = true;
  private session: ort.InferenceSession | undefined;
  private readonly config: OnnxEngineConfig;

  constructor(config: OnnxEngineConfig = {}) {
    this.config = config;
  }

  async isAvailable(): Promise<boolean> {
    return typeof WebAssembly !== 'undefined';
  }

  async load(): Promise<void> {
    if (this.session) return;
    if (!this.config.modelUrl) {
      return;
    }
    this.session = await ort.InferenceSession.create(this.config.modelUrl, {
      executionProviders: (this.config.executionProviders as string[]) ?? ['wasm'],
    });
  }

  async generate(request: AIRequest, _key?: AIProviderKey): Promise<AIResponse> {
    const startedAt = performance.now();
    await this.load();

    if (!this.session) {
      return {
        text: `${request.task}\n\n(ONNX engine is loaded but no model is configured yet. Add an ONNX model URL in Settings > AI to enable inference.)`,
        meta: {
          provider: this.provider,
          model: 'onnx-runtime-web',
          mode: 'local',
          local: true,
          latencyMs: Math.round(performance.now() - startedAt),
        },
      };
    }

    // Placeholder: actual tokenization and inference depend on the model schema.
    // Returning a guidance response keeps the engine safe and testable.
    return {
      text: `${request.task}\n\n(ONNX inference executed; structured output decoding is not yet implemented for this model.)`,
      meta: {
        provider: this.provider,
        model: this.config.modelUrl ?? 'onnx-runtime-web',
        mode: 'local',
        local: true,
        latencyMs: Math.round(performance.now() - startedAt),
      },
    };
  }
}
