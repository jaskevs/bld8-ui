'use client';
import { Check, X, ChevronDown, Plus, Search, Copy, Sun, Moon, type LucideIcon, type LucideProps } from 'lucide-react';

const familiar = { check:Check, close:X, chevron:ChevronDown, plus:Plus, search:Search, copy:Copy, sun:Sun, moon:Moon };
export type IconName = 'arrow' | 'mark' | keyof typeof familiar;
export type IconProps = LucideProps & { name?:IconName; icon?:LucideIcon; label?:string };

/** Named Lucide imports keep application icons explicit and tree-shakable. */
export function Icon({name='arrow',icon:Custom,size=18,strokeWidth=1.75,nonScalingStroke,label,className,...props}:IconProps) {
  const accessibleLabel = label || props['aria-label'];
  const common = {role:accessibleLabel ? 'img' as const : undefined,'aria-hidden':accessibleLabel ? undefined : true,'aria-label':accessibleLabel,focusable:false as const,className:['bui-icon',className].filter(Boolean).join(' '),...props};
  const Glyph = Custom || (name === 'arrow' || name === 'mark' ? undefined : familiar[name]);
  if (Glyph) return <Glyph size={size} strokeWidth={strokeWidth} nonScalingStroke={nonScalingStroke} data-bui-icon={Custom ? Custom.displayName || 'custom' : name} {...common} />;
  if (name === 'mark') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" data-bui-icon="mark" {...common}><path vectorEffect={nonScalingStroke ? 'non-scaling-stroke' : undefined} d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4 18.4 5.6" /></svg>;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" data-bui-icon="arrow" {...common}>{[[10,6],[14,6],[18,6],[14,10],[18,10],[10,14],[18,14],[6,18]].map(([x,y]) => <circle key={x + ',' + y} cx={x} cy={y} r="1.25" fill="currentColor" />)}</svg>;
}
