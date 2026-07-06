import { useVirtualizer } from '@tanstack/react-virtual';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useRef } from 'react';
import type { EventLogEntry } from './types';

function eventLevelClasses(level: EventLogEntry['level']): string {
  if (level === 'error') return 'bg-red-500/15 text-red-400';
  if (level === 'warn') return 'bg-yellow-500/15 text-yellow-400';
  return 'bg-blue-500/15 text-blue-400';
}

function EventLevelIcon({ level }: { level: EventLogEntry['level'] }) {
  if (level === 'error') {
    return <XCircle size={10} aria-hidden="true" />;
  }
  if (level === 'warn') {
    return <AlertTriangle size={10} aria-hidden="true" />;
  }
  return <CheckCircle2 size={10} aria-hidden="true" />;
}

function EventRow({ event }: { event: EventLogEntry }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 text-xs">
      <span className="shrink-0 font-mono text-(--color-muted) text-[10px]">{event.time}</span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${eventLevelClasses(
          event.level,
        )}`}
      >
        <EventLevelIcon level={event.level} />
      </span>
      <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 font-mono text-(--color-muted) text-[9px]">
        {event.source}
      </span>
      <span className="min-w-0 flex-1 truncate text-(--color-text)">{event.msg}</span>
    </div>
  );
}

export function VirtualEventLog({ events }: { events: EventLogEntry[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 3,
  });

  return (
    <div ref={parentRef} className="max-h-[280px] overflow-y-auto" role="log" aria-live="polite">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const event = events[virtualRow.index];
          if (!event) return null;
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <EventRow event={event} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
