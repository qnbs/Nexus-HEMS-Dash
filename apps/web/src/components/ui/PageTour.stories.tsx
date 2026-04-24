import type { Meta, StoryObj } from '@storybook/react';
import { Activity, HelpCircle, Maximize2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { PageTour, type TourStep } from './PageTour';

const DEMO_STEPS: TourStep[] = [
  {
    icon: Activity,
    titleKey: 'tour.liveEnergy.overviewTitle',
    descKey: 'tour.liveEnergy.overviewDesc',
    color: '#00f0ff',
  },
  {
    icon: Sparkles,
    titleKey: 'tour.hub.aiTitle',
    descKey: 'tour.hub.aiDesc',
    color: '#a855f6',
  },
  {
    icon: Maximize2,
    titleKey: 'tour.liveEnergy.fullscreenTitle',
    descKey: 'tour.liveEnergy.fullscreenDesc',
    color: '#ff8800',
  },
];

const meta: Meta<typeof PageTour> = {
  title: 'UI/PageTour',
  component: PageTour,
  tags: ['autodocs'],
  argTypes: {
    tourId: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof PageTour>;

/**
 * The default story uses a unique tourId so it always opens.
 * The `PageTour` component checks localStorage; this story uses a random
 * tourId to ensure it hasn't been previously dismissed.
 */
export const Default: Story = {
  args: {
    tourId: `storybook-demo-${Date.now()}`,
    steps: DEMO_STEPS,
  },
};

export const SingleStep: Story = {
  args: {
    tourId: `storybook-single-${Date.now()}`,
    steps: [
      {
        icon: HelpCircle,
        titleKey: 'tour.settings.overviewTitle',
        descKey: 'tour.settings.overviewDesc',
        color: '#22ff88',
      },
    ],
  },
};

let interactiveCounter = 0;

function InteractiveDemo() {
  const [tourId, setTourId] = useState(() => `storybook-interactive-${++interactiveCounter}`);

  const reset = () => {
    localStorage.removeItem(`nexus-tour-${tourId}`);
    setTourId(`storybook-interactive-${++interactiveCounter}`);
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-(--color-primary)/15 px-4 py-2 font-medium text-(--color-primary) text-sm"
      >
        Tour erneut anzeigen
      </button>
      <PageTour tourId={tourId} steps={DEMO_STEPS} />
      <p className="text-(--color-muted) text-sm">
        Tour wird beim ersten Besuch angezeigt. Klicke den Button, um sie erneut zu starten.
      </p>
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
