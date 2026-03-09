import { memo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { AIOptimizerPanel } from '../components/AIOptimizerPanel';
import { EnhancedAIOptimizer } from '../components/EnhancedAIOptimizer';
import { VoiceControlPanel } from '../components/VoiceControlPanel';

function AIOptimizerPageComponent() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.aiOptimizer', 'AI Optimizer')}
        subtitle={t('ai.subtitle')}
        icon={<Sparkles size={22} />}
      />

      {/* Main AI Panel */}
      <motion.div
        id="ai-optimizer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <AIOptimizerPanel />
      </motion.div>

      {/* Enhanced AI Optimizer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <EnhancedAIOptimizer />
      </motion.div>

      {/* Voice Control */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <VoiceControlPanel />
      </motion.div>
    </div>
  );
}

export default memo(AIOptimizerPageComponent);
