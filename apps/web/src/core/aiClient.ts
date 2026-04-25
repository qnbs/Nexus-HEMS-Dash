/**
 * Central multi-provider AI client for HEMS optimization.
 * Supports OpenAI, Anthropic, Google Gemini, xAI, Groq, Ollama, and custom endpoints.
 * API keys are always fetched from encrypted Dexie storage — never from env vars or localStorage.
 */

import { type AIProvider, getActiveProvider, getAIKey } from '../lib/ai-keys';

export interface AICompletionRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AICompletionResult {
  text: string;
  provider: AIProvider;
  model: string;
}

const HEMS_SYSTEM_PROMPT = `You are an AI energy optimization expert for a Home Energy Management System (HEMS).
Analyze real-time energy data and provide actionable optimization recommendations.
Focus on: cost minimization, self-consumption maximization, CO₂ reduction, battery optimization, smart EV charging.
Always respond with valid JSON arrays when structured output is requested.`;

// ─── MED-09: Prompt Injection Sanitization + PII Masking (ADR-008) ──

/**
 * PII patterns — mask sensitive data before sending to AI providers.
 * Prevents accidental exfiltration of personal identifiers.
 */
const PII_PATTERNS: ReadonlyArray<{ pattern: RegExp; placeholder: string }> = [
  // Email addresses — domain part allows hyphens (e.g. nexus-hems.local)
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, placeholder: '[EMAIL]' },
  // IPv4 addresses — must run before phone pattern to avoid mis-classification
  { pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, placeholder: '[IP]' },
  // IPv6 addresses (simplified)
  { pattern: /\b(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b/g, placeholder: '[IP]' },
  // Phone numbers (E.164 + common formats) — run after IP to avoid matching IPs
  { pattern: /\b(\+?[\d\s\-().]{7,20})\b(?=\s|$)/g, placeholder: '[PHONE]' },
  // IBAN (EU bank accounts)
  { pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4,30}\b/g, placeholder: '[IBAN]' },
];

/**
 * Sanitizes a user-controlled or sensor-derived string before interpolating
 * it into an AI prompt. Strips control characters, prompt injection sequences,
 * masks PII, and truncates to maxLength.
 *
 * @param value     The raw input string (device name, user label, API value, etc.)
 * @param maxLength Maximum allowed length after sanitization (default: 64)
 */
export function sanitizeForPrompt(value: string, maxLength = 64): string {
  if (typeof value !== 'string') return '';

  let sanitized = value
    // Remove all Unicode control characters (NUL, SOH, … DEL, etc.)
    .replace(/\p{Cc}/gu, '')
    // Strip common prompt-injection prefixes
    .replace(/\b(ignore|disregard|forget|override)\b.*?(instruction|prompt|above|system)/gi, '')
    // Collapse repeated whitespace
    .replace(/\s{3,}/g, '  ')
    .trim();

  // Mask PII
  for (const { pattern, placeholder } of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, placeholder);
  }

  return sanitized.slice(0, maxLength);
}

/**
 * Filter AI output before rendering to the user.
 * Validates that the AI response does not contain unexpected injection artifacts
 * and strips any leaked PII patterns from the AI's reply.
 *
 * @param output   Raw AI response text
 * @returns        Filtered, safe-to-render string
 */
export function filterAIOutput(output: string): string {
  if (typeof output !== 'string') return '';

  let filtered = output
    // Remove control characters from output
    .replace(/\p{Cc}/gu, ' ')
    // Collapse repeated whitespace
    .replace(/\s{4,}/g, '   ')
    .trim();

  // Mask any PII that leaked through the AI response
  for (const { pattern, placeholder } of PII_PATTERNS) {
    filtered = filtered.replace(pattern, placeholder);
  }

  return filtered;
}

/**
 * Calls the configured AI provider with the given prompt.
 */
export async function callAI(request: AICompletionRequest): Promise<AICompletionResult> {
  const provider = await getActiveProvider();
  if (!provider) {
    throw new Error('NO_PROVIDER');
  }

  const keyData = await getAIKey(provider);
  if (!keyData) {
    throw new Error('KEY_EXPIRED');
  }

  const { apiKey, model, baseUrl } = keyData;
  const systemPrompt = request.systemPrompt ?? HEMS_SYSTEM_PROMPT;
  const temperature = request.temperature ?? 0.7;
  const maxTokens = request.maxTokens ?? 1024;

  switch (provider) {
    case 'openai':
    case 'xai':
    case 'groq':
    case 'custom':
      return callOpenAICompatible(
        baseUrl,
        apiKey,
        model,
        systemPrompt,
        request.prompt,
        temperature,
        maxTokens,
        provider,
      );
    case 'anthropic':
      return callAnthropic(
        baseUrl,
        apiKey,
        model,
        systemPrompt,
        request.prompt,
        temperature,
        maxTokens,
      );
    case 'google':
      return callGemini(
        baseUrl,
        apiKey,
        model,
        request.prompt,
        systemPrompt,
        temperature,
        maxTokens,
      );
    case 'ollama':
      return callOllama(baseUrl, model, request.prompt, systemPrompt, temperature);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number,
  provider: AIProvider,
): Promise<AICompletionResult> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`${provider} API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0]?.message?.content ?? '',
    provider,
    model,
  };
}

async function callAnthropic(
  baseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number,
): Promise<AICompletionResult> {
  const response = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.content[0]?.text ?? '',
    provider: 'anthropic',
    model,
  };
}

async function callGemini(
  baseUrl: string,
  apiKey: string,
  model: string,
  userPrompt: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
): Promise<AICompletionResult> {
  const response = await fetch(`${baseUrl}/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topK: 40,
        topP: 0.95,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
    provider: 'google',
    model,
  };
}

async function callOllama(
  baseUrl: string,
  model: string,
  userPrompt: string,
  systemPrompt: string,
  temperature: number,
): Promise<AICompletionResult> {
  const response = await fetch(`${baseUrl}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: userPrompt,
      system: systemPrompt,
      stream: false,
      options: { temperature },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.response ?? '',
    provider: 'ollama',
    model,
  };
}
