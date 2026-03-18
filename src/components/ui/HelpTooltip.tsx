import { HelpCircle } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface HelpTooltipProps {
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  size?: number;
}

export function HelpTooltip({ content, side = 'top', size = 14 }: HelpTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="focus-ring inline-flex items-center justify-center rounded-full p-0.5 text-(--color-muted) transition-colors hover:text-(--color-primary)"
            aria-label={content}
          >
            <HelpCircle size={size} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            sideOffset={6}
            className="z-tooltip animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 max-w-xs rounded-xl border border-(--color-border) bg-(--color-surface-strong) px-3 py-2 text-xs leading-relaxed text-(--color-text) shadow-lg backdrop-blur-xl"
          >
            {content}
            <Tooltip.Arrow className="fill-(--color-surface-strong)" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
