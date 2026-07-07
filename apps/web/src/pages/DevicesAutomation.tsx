import { Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { DemoBadge } from '../components/DemoBadge';
import {
  DeviceDetailDialog,
  DevicesFilterBar,
  DevicesGrid,
  FloorplanView,
  useDevicesAutomation,
  ViewToggle,
} from '../components/devices-automation';
import { PageHeader } from '../components/layout/PageHeader';

export default function DevicesAutomation() {
  const { t } = useTranslation();
  const d = useDevicesAutomation();
  const { ConfirmationDialog } = d;

  return (
    <div className="space-y-6">
      <DemoBadge />
      <PageHeader
        title={t('devicesAuto.title')}
        subtitle={t('devicesAuto.subtitle')}
        icon={<Zap size={22} />}
        actions={<ViewToggle view={d.view} onChange={d.setView} />}
      />

      <AnimatePresence mode="wait">
        {d.view === 'floorplan' ? (
          <motion.div
            key="floorplan"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <FloorplanView />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <DevicesFilterBar
              search={d.search}
              onSearch={d.setSearch}
              category={d.category}
              onCategory={d.setCategory}
            />
            <DevicesGrid
              devices={d.filtered}
              data={d.data}
              unified={d.unified}
              settings={d.settings}
              sendCommand={d.sendCommand}
              onOpenDetail={d.setDetailDevice}
              onReset={d.resetFilters}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <DeviceDetailDialog
        deviceId={d.detailDevice}
        onClose={() => d.setDetailDevice(null)}
        data={d.data}
        unified={d.unified}
        settings={d.settings}
        sendCommand={d.sendCommand}
      />
      <ConfirmationDialog />
    </div>
  );
}
