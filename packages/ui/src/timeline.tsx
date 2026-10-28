'use client';

import type { ReactNode } from 'react';
import { Check, Circle, type LucideIcon } from 'lucide-react';
import { Icon } from './icons.js';
import { cn } from './utils.js';

export interface TimelineItem {
  /** Stable identity. Keep the supplied order chronological or explicitly ranked. */
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Machine-readable ISO date/time; pair with a deterministic display label. */
  dateTime?: string;
  time?: ReactNode;
  icon?: LucideIcon;
  /** State is also announced in text, independently of colour. */
  state?: 'complete' | 'current' | 'pending';
  content?: ReactNode;
}

export interface TimelineProps {
  label: string;
  items: readonly TimelineItem[];
  density?: 'comfortable' | 'compact';
  className?: string;
}

/** A read-only sequence. Actions can be supplied as ordinary accessible content. */
export function Timeline({ label, items, density = 'comfortable', className }: TimelineProps) {
  return <ol aria-label={label} className={cn('bui-timeline', className)} data-density={density}>
    {items.map(item => <li key={item.id} className="bui-timeline-item" data-state={item.state} aria-current={item.state === 'current' ? 'step' : undefined}>
      <span className="bui-timeline-marker" aria-hidden="true"><Icon icon={item.icon ?? (item.state === 'complete' ? Check : Circle)} size={14} /></span>
      <div className="bui-timeline-body">
        <div className="bui-timeline-heading"><span className="bui-timeline-title">{item.title}</span>
          {item.time && (item.dateTime ? <time dateTime={item.dateTime}>{item.time}</time> : <span className="bui-timeline-time">{item.time}</span>)}
        </div>
        {item.state && <span className="bui-timeline-state">{item.state === 'complete' ? 'Complete' : item.state === 'current' ? 'Current' : 'Pending'}</span>}
        {item.description && <div className="bui-timeline-description">{item.description}</div>}
        {item.content && <div className="bui-timeline-content">{item.content}</div>}
      </div>
    </li>)}
  </ol>;
}
