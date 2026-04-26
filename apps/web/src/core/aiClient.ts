/**
 * Central multi-provider AI client for HEMS optimization.
 * Supports OpenAI, Anthropic, Google Gemini, xAI, Groq, Ollama, and custom endpoints.
 * API keys are always fetched from encrypted Dexie storage — never from env vars or localStorage.
 */

import { sanitizeRenderedText, sanitizeUntrustedText } from '@nexus-hems/shared-types';
import { z } from 'zod';
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

const AI_SYSTEM_PROMPT_MAX_LENGTH = 2_000;
const AI_USER_PROMPT_MAX_LENGTH = 8_000;

// ─── MED-06: Zod schemas for structured AI response validation ───────

/**
 * Schema for optimization suggestion output.
 * AI providers are expected to emit this structure when asked for schedule suggestions.
 */
export const OptimizationSuggestionSchema = z.object({
  hour: z.number().int().min(0).max(23),
  batteryKw: z.number().optional(),
  gridKw: z.number().optional(),
  pvKw: z.number().optional(),
  reason: z.string().optional(),
});

export const OptimizationResponseSchema = z.object({
  suggestions: z.array(OptimizationSuggestionSchema),
  estimatedSavings: z.number().optional(),
  currency: z.string().length(3).optional(),
});

export const ForecastResponseSchema = z.object({
  pvForecast: z.array(z.number()).length(24),
  loadForecast: z.array(z.number()).length(24),
  priceSignal: z.array(z.number()).length(24).optional(),
});

export type OptimizationResponse = z.infer<typeof OptimizationResponseSchema>;
export type ForecastResponse = z.infer<typeof ForecastResponseSchema>;

/**
 * Attempt to parse a filtered AI output string as a structured response.
 * Returns the parsed object on success, or null on failure (graceful degradation).
 */
export function parseAIStructuredOutput<T>(text: string, schema: z.ZodType<T>): T | null {
  // Try to extract JSON from the response (model may wrap it in markdown code fences)
  const jsonMatch =
    text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  const jsonText = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : text;
  try {
    const parsed = JSON.parse(jsonText);
    const result = schema.safeParse(parsed);
    if (result.success) return result.data;
    console.warn('[AI] Structured output validation failed:', result.error.issues.slice(0, 3));
    return null;
  } catch {
    return null;
  }
}

// ─── MED-09: Prompt Injection Sanitization + PII Masking (ADR-008) ──

/**
 * Sanitizes a user-controlled or sensor-derived string before interpolating
 * it into an AI prompt. Strips control characters, prompt injection sequences,
 * masks PII, and truncates to maxLength.
 *
 * @param value     The raw input string (device name, user label, API value, etc.)
 * @param maxLength Maximum allowed length after sanitization (default: 64)
 */
export function sanitizeForPrompt(value: string, maxLength = 64): string {
  return sanitizeUntrustedText(value, maxLength);
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
  return sanitizeRenderedText(output, AI_USER_PROMPT_MAX_LENGTH);
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
  const systemPrompt = sanitizeForPrompt(
    request.systemPrompt ?? HEMS_SYSTEM_PROMPT,
    AI_SYSTEM_PROMPT_MAX_LENGTH,
  );
  const userPrompt = sanitizeForPrompt(request.prompt, AI_USER_PROMPT_MAX_LENGTH);
  const temperature = request.temperature ?? 0.7;
  const maxTokens = request.maxTokens ?? 1024;

  let result: AICompletionResult;

  switch (provider) {
    case 'openai':
    case 'xai':
    case 'groq':
    case 'custom':
      result = await callOpenAICompatible(
        baseUrl,
        apiKey,
        model,
        systemPrompt,
        userPrompt,
        temperature,
        maxTokens,
        provider,
      );
      break;
    case 'anthropic':
      result = await callAnthropic(
        baseUrl,
        apiKey,
        model,
        systemPrompt,
        userPrompt,
        temperature,
        maxTokens,
      );
      break;
    case 'google':
      result = await callGemini(
        baseUrl,
        apiKey,
        model,
        userPrompt,
        systemPrompt,
        temperature,
        maxTokens,
      );
      break;
    case 'ollama':
      result = await callOllama(baseUrl, model, userPrompt, systemPrompt, temperature);
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  return {
    ...result,
    text: filterAIOutput(result.text),
  };
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
