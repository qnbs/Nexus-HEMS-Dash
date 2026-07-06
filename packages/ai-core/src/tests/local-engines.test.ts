import { describe, expect, it } from 'vitest';
import { HeuristicEngine } from '../providers/local/heuristic-engine.ts';
import { OnnxEngine } from '../providers/local/onnx-engine.ts';
import { TransformersEngine } from '../providers/local/transformers-engine.ts';
import { WebLLMEngine } from '../providers/local/webllm-engine.ts';
import { AIProviderRegistry } from '../providers/registry.ts';

describe('HeuristicEngine', () => {
  it('matches battery keywords', async () => {
    const engine = new HeuristicEngine();
    const response = await engine.generate({ task: 'Should I charge the battery now?' });
    expect(response.text).toContain('SOC');
    expect(response.meta.local).toBe(true);
    expect(response.meta.provider).toBe('heuristic');
  });

  it('falls back to generic guidance', async () => {
    const engine = new HeuristicEngine();
    const response = await engine.generate({ task: 'What is the weather?' });
    expect(response.text).toContain('energy management');
  });
});

describe('OnnxEngine', () => {
  it('reports availability based on WebAssembly', async () => {
    const engine = new OnnxEngine();
    expect(await engine.isAvailable()).toBe(typeof WebAssembly !== 'undefined');
  });

  it('returns guidance when no model is configured', async () => {
    const engine = new OnnxEngine();
    const response = await engine.generate({ task: 'Optimize my home' });
    expect(response.text).toContain('no model is configured');
    expect(response.meta.provider).toBe('onnx');
  });
});

describe('TransformersEngine', () => {
  it('is available when WebAssembly is present', async () => {
    const engine = new TransformersEngine();
    expect(await engine.isAvailable()).toBe(typeof WebAssembly !== 'undefined');
  });

  it('gracefully handles model load failure', async () => {
    const engine = new TransformersEngine({ model: 'nonexistent-model' });
    const response = await engine.generate({ task: 'hello' });
    expect(response.text).toContain('could not be loaded');
  });
});

describe('WebLLMEngine', () => {
  it('is available only with WebGPU', async () => {
    const engine = new WebLLMEngine();
    const hasWebGpu = typeof navigator !== 'undefined' && 'gpu' in navigator;
    expect(await engine.isAvailable()).toBe(hasWebGpu);
  });

  it('gracefully handles model load failure', async () => {
    const engine = new WebLLMEngine({ model: 'nonexistent-model' });
    const response = await engine.generate({ task: 'hello' });
    expect(response.text).toContain('could not be loaded');
  });
});

describe('AIProviderRegistry', () => {
  it('registers all local and cloud engines', () => {
    const registry = new AIProviderRegistry();
    const providers = registry.list();
    expect(providers).toContain('webllm');
    expect(providers).toContain('transformers');
    expect(providers).toContain('onnx');
    expect(providers).toContain('heuristic');
    expect(providers).toContain('openai');
  });

  it('retrieves a local engine by provider id', () => {
    const registry = new AIProviderRegistry();
    const engine = registry.get('heuristic');
    expect(engine.local).toBe(true);
    expect(engine.provider).toBe('heuristic');
  });
});
