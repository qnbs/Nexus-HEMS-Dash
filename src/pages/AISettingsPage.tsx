/**
 * BYOK AI Settings Page — Manage encrypted API keys for multiple AI providers.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Key, Shield, Trash2, Check, AlertTriangle, Eye, EyeOff, Sparkles } from 'lucide-react';

import {
  AI_PROVIDERS,
  saveAIKey,
  removeAIKey,
  listAIKeys,
  getActiveProvider,
  setActiveProvider,
  type AIProvider,
} from '../lib/ai-keys';

interface StoredKeyInfo {
  provider: AIProvider;
  model: string;
  baseUrl: string;
  createdAt: number;
  lastUsed: number;
}

export default function AISettingsPage() {
  const { t } = useTranslation();
  const [storedKeys, setStoredKeys] = useState<StoredKeyInfo[]>([]);
  const [activeProvider, setActive] = useState<AIProvider | null>(null);
  const [addingProvider, setAddingProvider] = useState<AIProvider | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshKeys = useCallback(async () => {
    const keys = await listAIKeys();
    setStoredKeys(keys);
    const active = await getActiveProvider();
    setActive(active);
  }, []);

  useEffect(() => {
    void refreshKeys();
  }, [refreshKeys]);

  const handleSave = async () => {
    if (!addingProvider || !apiKeyInput.trim()) return;
    setSaving(true);
    setError(null);

    try {
      await saveAIKey(
        addingProvider,
        apiKeyInput.trim(),
        modelInput || AI_PROVIDERS[addingProvider].models[0] || '',
        addingProvider === 'custom' ? customUrlInput : undefined,
      );

      // Set as active if it's the first key
      if (storedKeys.length === 0) {
        setActiveProvider(addingProvider);
      }

      setApiKeyInput('');
      setModelInput('');
      setCustomUrlInput('');
      setAddingProvider(null);
      setSuccess(t('aiSettings.saved', 'Key encrypted & saved'));
      setTimeout(() => setSuccess(null), 3000);
      await refreshKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save key');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (provider: AIProvider) => {
    await removeAIKey(provider);
    if (activeProvider === provider) {
      setActive(null);
      localStorage.removeItem('nexus-hems-ai-provider');
    }
    await refreshKeys();
  };

  const handleSetActive = (provider: AIProvider) => {
    setActiveProvider(provider);
    setActive(provider);
  };

  const providerList = Object.values(AI_PROVIDERS);

  return (
    <motion.div
      className="mx-auto max-w-4xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="mb-8 flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Key className="text-[color:var(--color-primary)]" size={28} />
        </motion.div>
        <div>
          <h1 className="text-3xl font-light tracking-tight fluid-text-4xl">
            {t('aiSettings.title', 'AI Provider Keys')}
          </h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {t('aiSettings.subtitle', 'Bring Your Own Key — encrypted with AES-GCM 256-bit')}
          </p>
        </div>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        className="glass-panel mb-6 flex items-start gap-3 p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--color-primary)]" />
        <div className="text-sm text-[color:var(--color-muted)]">
          <p className="font-medium text-[color:var(--color-text)]">
            {t('aiSettings.securityTitle', 'End-to-End Encrypted')}
          </p>
          <p className="mt-1">
            {t(
              'aiSettings.securityDesc',
              'Keys are encrypted with PBKDF2 + AES-GCM 256-bit before storage in IndexedDB. Keys are never sent to our servers — only directly to the AI provider you choose.',
            )}
          </p>
        </div>
      </motion.div>

      {/* Status Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400"
          >
            <Check className="h-4 w-4" />
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
          >
            <AlertTriangle className="h-4 w-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stored Keys */}
      <motion.section
        className="glass-panel-strong mb-6 rounded-3xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="mb-4 flex items-center gap-2 text-lg font-medium">
          <Sparkles className="h-5 w-5 text-[color:var(--color-secondary)]" />
          {t('aiSettings.configured', 'Configured Providers')}
        </h2>

        {storedKeys.length === 0 ? (
          <p className="py-8 text-center text-sm text-[color:var(--color-muted)]">
            {t('aiSettings.noKeys', 'No API keys configured yet. Add a provider below.')}
          </p>
        ) : (
          <div className="space-y-3">
            {storedKeys.map((key) => (
              <motion.div
                key={key.provider}
                className={`flex items-center justify-between rounded-2xl border p-4 transition-colors ${
                  activeProvider === key.provider
                    ? 'border-[color:var(--color-primary)]/40 bg-[color:var(--color-primary)]/5'
                    : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)]'
                }`}
                layout
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-surface-strong)]">
                    <Key className="h-5 w-5 text-[color:var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[color:var(--color-text)]">
                      {AI_PROVIDERS[key.provider]?.label ?? key.provider}
                    </p>
                    <p className="text-xs text-[color:var(--color-muted)]">
                      {key.model} · {t('aiSettings.lastUsed', 'Last used')}{' '}
                      {new Date(key.lastUsed).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeProvider !== key.provider && (
                    <button
                      onClick={() => handleSetActive(key.provider)}
                      className="btn-secondary rounded-full px-3 py-1.5 text-xs focus-ring"
                    >
                      {t('aiSettings.setActive', 'Set Active')}
                    </button>
                  )}
                  {activeProvider === key.provider && (
                    <span className="rounded-full bg-[color:var(--color-primary)]/20 px-3 py-1 text-xs font-medium text-[color:var(--color-primary)]">
                      {t('common.active')}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemove(key.provider)}
                    className="rounded-full p-2 text-red-400 transition-colors hover:bg-red-500/10 focus-ring"
                    aria-label={t('aiSettings.remove', 'Remove key')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Add New Provider */}
      <motion.section
        className="glass-panel-strong rounded-3xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="mb-4 text-lg font-medium">{t('aiSettings.addProvider', 'Add Provider')}</h2>

        {/* Provider Grid */}
        {!addingProvider ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {providerList.map((p) => {
              const isConfigured = storedKeys.some((k) => k.provider === p.provider);
              return (
                <motion.button
                  key={p.provider}
                  onClick={() => {
                    setAddingProvider(p.provider);
                    setModelInput(p.models[0] || '');
                    setCustomUrlInput(p.baseUrl);
                  }}
                  disabled={isConfigured}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all focus-ring ${
                    isConfigured
                      ? 'cursor-not-allowed border-[color:var(--color-border)] opacity-40'
                      : 'border-[color:var(--color-border)] hover:border-[color:var(--color-primary)]/40 hover:bg-[color:var(--color-primary)]/5'
                  }`}
                  whileHover={isConfigured ? {} : { scale: 1.03 }}
                  whileTap={isConfigured ? {} : { scale: 0.97 }}
                >
                  <Key className="h-5 w-5 text-[color:var(--color-secondary)]" />
                  <span className="text-sm font-medium">{p.label}</span>
                  {isConfigured && <Check className="h-4 w-4 text-[color:var(--color-primary)]" />}
                </motion.button>
              );
            })}
          </div>
        ) : (
          /* Key Input Form */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-[color:var(--color-text)]">
                {AI_PROVIDERS[addingProvider].label}
              </h3>
              <button
                onClick={() => {
                  setAddingProvider(null);
                  setApiKeyInput('');
                  setError(null);
                }}
                className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
              >
                {t('aiSettings.cancel', 'Cancel')}
              </button>
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <label
                htmlFor="ai-api-key"
                className="text-sm font-medium text-[color:var(--color-muted)]"
              >
                API Key
              </label>
              <div className="relative">
                <input
                  id="ai-api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-..."
                  autoComplete="off"
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2.5 pr-10 text-[color:var(--color-text)] outline-none transition-colors focus:border-[color:var(--color-primary)]/50 focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]"
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <label
                htmlFor="ai-model"
                className="text-sm font-medium text-[color:var(--color-muted)]"
              >
                {t('aiSettings.model', 'Model')}
              </label>
              {AI_PROVIDERS[addingProvider].models.length > 0 ? (
                <select
                  id="ai-model"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2.5 text-[color:var(--color-text)] outline-none transition-colors focus:border-[color:var(--color-primary)]/50 focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
                >
                  {AI_PROVIDERS[addingProvider].models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="ai-model"
                  type="text"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  placeholder="model-name"
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2.5 text-[color:var(--color-text)] outline-none transition-colors focus:border-[color:var(--color-primary)]/50 focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
                />
              )}
            </div>

            {/* Custom Base URL (for 'custom' and 'ollama') */}
            {(addingProvider === 'custom' || addingProvider === 'ollama') && (
              <div className="space-y-2">
                <label
                  htmlFor="ai-base-url"
                  className="text-sm font-medium text-[color:var(--color-muted)]"
                >
                  Base URL
                </label>
                <input
                  id="ai-base-url"
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2.5 text-[color:var(--color-text)] outline-none transition-colors focus:border-[color:var(--color-primary)]/50 focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
                />
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !apiKeyInput.trim()}
              className="btn-primary focus-ring flex items-center gap-2"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {t('aiSettings.encrypt', 'Encrypt & Save')}
            </button>
          </motion.div>
        )}
      </motion.section>
    </motion.div>
  );
}
