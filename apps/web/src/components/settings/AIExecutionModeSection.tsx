/**
 * AI execution mode and local model selection.
 */

import type { AIExecutionMode, AIProvider } from '@nexus-hems/ai-core';
import { detectCapabilities } from '@nexus-hems/ai-core';
import { Cpu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getAIMode,
  getPreferredLocalModel,
  setAIMode,
  setPreferredLocalModel,
} from '../../core/aiClient';
import { ChoiceCardGroup } from '../ui/ChoiceCardGroup';

const MODES: { value: AIExecutionMode; labelKey: string; descriptionKey: string }[] = [
  {
    value: 'hybrid',
    labelKey: 'aiSettings.modeHybrid',
    descriptionKey: 'aiSettings.executionModeDesc',
  },
  {
    value: 'local',
    labelKey: 'aiSettings.modeLocal',
    descriptionKey: 'aiSettings.executionModeDesc',
  },
  {
    value: 'cloud',
    labelKey: 'aiSettings.modeCloud',
    descriptionKey: 'aiSettings.executionModeDesc',
  },
  { value: 'eco', labelKey: 'aiSettings.modeEco', descriptionKey: 'aiSettings.executionModeDesc' },
];

const LOCAL_MODELS: { value: AIProvider; labelKey: string; requires?: 'webgpu' | 'wasm' }[] = [
  { value: 'webllm', labelKey: 'aiSettings.modelWebllm', requires: 'webgpu' },
  { value: 'transformers', labelKey: 'aiSettings.modelTransformers', requires: 'wasm' },
  { value: 'onnx', labelKey: 'aiSettings.modelOnnx', requires: 'wasm' },
  { value: 'heuristic', labelKey: 'aiSettings.modelHeuristic' },
];

export function AIExecutionModeSection() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AIExecutionMode>(getAIMode());
  const [localModel, setLocalModel] = useState<AIProvider>(() => {
    return getPreferredLocalModel();
  });
  const [capability, setCapability] = useState<{ webgpu: boolean; wasm: boolean }>({
    webgpu: false,
    wasm: false,
  });

  useEffect(() => {
    const detect = async () => {
      const caps = await detectCapabilities();
      setCapability({ webgpu: caps.webgpu, wasm: caps.webAssembly });
    };
    detect().catch((err) => {
      console.error('Failed to detect AI capabilities', err);
    });
  }, []);

  const handleModeChange = (value: string) => {
    const next = value as AIExecutionMode;
    setMode(next);
    setAIMode(next);
  };

  const handleModelChange = (value: string) => {
    const next = value as AIProvider;
    setLocalModel(next);
    setPreferredLocalModel(next);
  };

  const availableLocalModels = LOCAL_MODELS.filter((m) => {
    if (m.requires === 'webgpu') return capability.webgpu;
    if (m.requires === 'wasm') return capability.wasm;
    return true;
  });

  return (
    <section className="glass-panel-strong mb-6 p-6">
      <h2 className="fluid-text-lg mb-4 flex items-center gap-2 font-medium">
        <Cpu className="h-5 w-5 text-(--color-secondary)" />
        {t('aiSettings.executionMode')}
      </h2>

      <p className="mb-4 text-(--color-muted) text-sm">{t('aiSettings.executionModeDesc')}</p>

      <ChoiceCardGroup
        name="ai-execution-mode"
        value={mode}
        onChange={handleModeChange}
        aria-label={t('aiSettings.executionMode')}
        options={MODES.map((m) => ({
          value: m.value,
          label: t(m.labelKey),
          description: t(m.descriptionKey),
          tone: m.value === 'hybrid' ? 'primary' : 'neutral',
        }))}
      />

      {mode !== 'cloud' && (
        <div className="mt-6">
          <h3 className="mb-2 font-medium text-(--color-text)">{t('aiSettings.localModel')}</h3>
          <p className="mb-3 text-(--color-muted) text-sm">{t('aiSettings.localModelDesc')}</p>

          {availableLocalModels.length === 0 ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-400 text-sm">
              {t('aiSettings.modelUnavailable')}
            </p>
          ) : (
            <ChoiceCardGroup
              name="ai-local-model"
              value={localModel}
              onChange={handleModelChange}
              aria-label={t('aiSettings.localModel')}
              size="compact"
              options={availableLocalModels.map((m) => ({
                value: m.value,
                label: t(m.labelKey),
                tone: 'primary' as const,
              }))}
            />
          )}
        </div>
      )}
    </section>
  );
}
