import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

// Mock crypto module
vi.mock('../lib/crypto', () => ({
  encrypt: vi.fn(async (text: string, _pass: string) => `ENC:${text}`),
  decrypt: vi.fn(async (cipher: string, _pass: string) => cipher.replace('ENC:', '')),
}));

// Passphrase is now held in-memory (module-scope variable), no sessionStorage mock needed.

import { saveAIKey, getAIKey, removeAIKey, listAIKeys, AI_PROVIDERS } from '../lib/ai-keys';
import { nexusDb } from '../lib/db';

describe('AI Key Storage', () => {
  beforeEach(async () => {
    await nexusDb.aiKeys.clear();
  });

  it('should have all 7 providers defined', () => {
    const providers = Object.keys(AI_PROVIDERS);
    expect(providers).toHaveLength(7);
    expect(providers).toContain('openai');
    expect(providers).toContain('anthropic');
    expect(providers).toContain('google');
    expect(providers).toContain('xai');
    expect(providers).toContain('groq');
    expect(providers).toContain('ollama');
    expect(providers).toContain('custom');
  });

  it('should save and retrieve an encrypted key', async () => {
    await saveAIKey('openai', 'sk-test-key-123', 'gpt-4o');
    const result = await getAIKey('openai');

    expect(result).not.toBeNull();
    expect(result!.apiKey).toBe('sk-test-key-123');
    expect(result!.model).toBe('gpt-4o');
    expect(result!.baseUrl).toBe('https://api.openai.com/v1');
  });

  it('should return null for non-existent provider', async () => {
    const result = await getAIKey('anthropic');
    expect(result).toBeNull();
  });

  it('should remove a key', async () => {
    await saveAIKey('google', 'AIza-key', 'gemini-3.0-flash');
    await removeAIKey('google');
    const result = await getAIKey('google');
    expect(result).toBeNull();
  });

  it('should list all stored keys without decrypting', async () => {
    await saveAIKey('openai', 'sk-key1', 'gpt-4o');
    await saveAIKey('groq', 'gsk-key2', 'llama-3.3-70b-versatile');

    const list = await listAIKeys();
    expect(list).toHaveLength(2);
    const providers = list.map((k) => k.provider).sort();
    expect(providers).toEqual(['groq', 'openai']);
    // No apiKey field in list output
    expect((list[0] as Record<string, unknown>).apiKey).toBeUndefined();
  });

  it('should use custom baseUrl when provided', async () => {
    await saveAIKey('custom', 'my-key', 'my-model', 'https://my-llm.local/v1');
    const result = await getAIKey('custom');
    expect(result!.baseUrl).toBe('https://my-llm.local/v1');
  });

  it('should overwrite existing key for same provider', async () => {
    await saveAIKey('openai', 'old-key', 'gpt-4o');
    await saveAIKey('openai', 'new-key', 'gpt-4o-mini');

    const result = await getAIKey('openai');
    expect(result!.apiKey).toBe('new-key');
    expect(result!.model).toBe('gpt-4o-mini');
  });
});
