import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ControlPanel as ControlPanelUI } from '../../ui/ControlPanel';
import { PanelTitle } from '../panels/PanelTitle';
import { type DevicePanelProps, PANEL_CONFIG, type PanelId } from '../types';
import { DevicePanelContent } from './DevicePanelContent';

/**
 * Mobile layout: on phone-width viewports the absolutely-positioned floating
 * panels land off-screen (fixed x/y offsets like y:560, right-anchored panels),
 * so open panels are stacked full-width in a scrollable bottom sheet where every
 * panel — EV, heat-pump/SG-Ready, battery, KNX, stats — stays reachable.
 */
export function MobilePanelSheet({
  openPanels,
  onClose,
  ...panelProps
}: { openPanels: Set<PanelId>; onClose: (id: PanelId) => void } & DevicePanelProps) {
  const { t } = useTranslation();
  const openIds = PANEL_CONFIG.filter((c) => openPanels.has(c.id)).map((c) => c.id);

  return (
    <AnimatedSheet visible={openIds.length > 0} label={t('liveEnergy.devicePanels')}>
      {openIds.map((id) => (
        <ControlPanelUI
          key={id}
          title={<PanelTitle id={id} />}
          onClose={() => onClose(id)}
          closeLabel={t('common.close')}
        >
          <DevicePanelContent id={id} props={panelProps} />
        </ControlPanelUI>
      ))}
    </AnimatedSheet>
  );
}

function AnimatedSheet({
  visible,
  label,
  children,
}: {
  visible: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (!visible) return null;
  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-20 max-h-[75dvh] space-y-3 overflow-y-auto rounded-t-2xl border-(--color-border) border-t bg-(--color-background)/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      role="dialog"
      aria-label={label}
    >
      {children}
    </motion.div>
  );
}
