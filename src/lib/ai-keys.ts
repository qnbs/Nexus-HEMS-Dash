/**
 * Encrypted AI key storage using Dexie + Web Crypto API.
 * Keys are encrypted with AES-GCM 256-bit before storage.
 * A device-bound passphrase is derived on first use and stored in sessionStorage.
 */

import { nexusDb } from './db';
import { encrypt, decrypt } from './crypto';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'xai' | 'groq' | 'ollama' | 'custom';

export interface AIProviderConfig {
  provider: AIProvider;
  label: string;
  baseUrl: string;
  models: string[];
}

export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  openai: {
    provider: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'o4-mini'],
  },
  anthropic: {
    provider: 'anthropic',
    label: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250514'],
  },
  google: {
    provider: 'google',
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-3.0-flash', 'gemini-3.1-pro'],
  },
  xai: {
    provider: 'xai',
    label: 'xAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    models: ['grok-3', 'grok-3-mini'],
  },
  groq: {
    provider: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: ['llama-3.3-70b-versatile', 'llama-4-scout-17b-16e-instruct'],
  },
  ollama: {
    provider: 'ollama',
    label: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/api',
    models: ['llama4', 'mistral', 'qwen3'],
  },
  custom: {
    provider: 'custom',
    label: 'Custom Endpoint',
    baseUrl: '',
    models: [],
  },
};

/**
 * Gets or creates a device-bound passphrase for this session.
 * The passphrase is kept in sessionStorage (cleared on tab close).
 */
function getSessionPassphrase(): string {
  const key = 'nexus-hems-session-key';
  let passphrase = sessionStorage.getItem(key);
  if (!passphrase) {
    const array = crypto.getRandomValues(new Uint8Array(32));
    passphrase = btoa(String.fromCharCode(...array));
    sessionStorage.setItem(key, passphrase);
  }
  return passphrase;
}

/**
 * Stores an encrypted AI API key in Dexie.
 */
export async function saveAIKey(
  provider: AIProvider,
  apiKey: string,
  model: string,
  customBaseUrl?: string,
): Promise<void> {
  const passphrase = getSessionPassphrase();
  const encryptedKey = await encrypt(apiKey, passphrase);

  await nexusDb.aiKeys.put({
    provider,
    encryptedKey,
    model,
    baseUrl: customBaseUrl || AI_PROVIDERS[provider].baseUrl,
    createdAt: Date.now(),
    lastUsed: Date.now(),
  });
}

/**
 * Retrieves and decrypts an AI API key from Dexie.
 */
export async function getAIKey(provider: AIProvider): Promise<{
  apiKey: string;
  model: string;
  baseUrl: string;
} | null> {
  const record = await nexusDb.aiKeys.get(provider);
  if (!record) return null;

  try {
    const passphrase = getSessionPassphrase();
    const apiKey = await decrypt(record.encryptedKey, passphrase);

    // Update last used timestamp
    await nexusDb.aiKeys.update(provider, { lastUsed: Date.now() });

    return { apiKey, model: record.model, baseUrl: record.baseUrl };
  } catch {
    // Decryption failed (session expired) — key must be re-entered
    return null;
  }
}

/**
 * Removes an AI API key from Dexie.
 */
export async function removeAIKey(provider: AIProvider): Promise<void> {
  await nexusDb.aiKeys.delete(provider);
}

/**
 * Lists all stored AI providers (without decrypting keys).
 */
export async function listAIKeys(): Promise<
  Array<{
    provider: AIProvider;
    model: string;
    baseUrl: string;
    createdAt: number;
    lastUsed: number;
  }>
> {
  const records = await nexusDb.aiKeys.toArray();
  const validProviders = new Set<string>(Object.keys(AI_PROVIDERS));
  return records
    .filter(({ provider }) => validProviders.has(provider))
    .map(({ provider, model, baseUrl, createdAt, lastUsed }) => ({
      provider: provider as AIProvider,
      model,
      baseUrl,
      createdAt,
      lastUsed,
    }));
}

/**
 * Gets the active/default AI provider.
 */
export async function getActiveProvider(): Promise<AIProvider | null> {
  const stored = localStorage.getItem('nexus-hems-ai-provider');
  if (stored && Object.keys(AI_PROVIDERS).includes(stored)) {
    return stored as AIProvider;
  }
  // Fall back to first configured provider
  const keys = await listAIKeys();
  return keys.length > 0 ? keys[0].provider : null;
}

/**
 * Sets the active AI provider.
 */
export function setActiveProvider(provider: AIProvider): void {
  localStorage.setItem('nexus-hems-ai-provider', provider);
}
