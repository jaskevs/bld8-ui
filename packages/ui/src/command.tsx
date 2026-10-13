'use client';
import { useEffect, useRef, type ReactElement } from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { Search, type LucideIcon } from 'lucide-react';
import { Icon } from './core.js';
import { Dialog } from './overlays.js';
import { useControllableValue } from './state.js';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category?: string;
  keywords?: string[];
  icon?: LucideIcon;
  disabled?: boolean;
  onSelect: () => void;
}
export interface CommandPaletteProps {
  items: CommandItem[];
  trigger?: ReactElement;
  title?: string;
  placeholder?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Register Ctrl/Command+K once per application. Disabled by default. */
  shortcut?: boolean;
}
export function CommandPalette({ items, trigger, title = 'Quick actions', placeholder = 'Search pages and actions…', open, defaultOpen = false, onOpenChange, shortcut = false }: CommandPaletteProps) {
  const [isOpen, setOpen] = useControllableValue(open, defaultOpen, onOpenChange);
  const input=useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!shortcut) return;
    const handle = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey && !event.repeat && !event.isComposing) {
        event.preventDefault(); setOpen(!isOpen);
      }
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [shortcut, isOpen, setOpen]);
  return <Combobox.Root<CommandItem> inline open={isOpen} onOpenChange={setOpen} items={items} value={null} autoHighlight
    itemToStringLabel={item => item.label} isItemEqualToValue={(a, b) => a.id === b.id}
    filter={(item, query) => [item.label, item.description, item.category, ...(item.keywords ?? [])].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())}
    onValueChange={item => { if (item && !item.disabled) { setOpen(false); item.onSelect(); } }}>
    <Dialog initialFocus={input} trigger={trigger} title={title} description="Use arrow keys to navigate, Enter to choose and Escape to close." open={isOpen} onOpenChange={setOpen}>
      <div className="bui-command">
        <div className="bui-command-search"><Icon icon={Search} /><Combobox.Input ref={input} aria-label={title + ' search'} placeholder={placeholder} className="bui-input" /></div>
        <Combobox.Empty className="bui-combo-empty">No matching actions. Try another search.</Combobox.Empty>
        <Combobox.List className="bui-command-list">{(item: CommandItem) => <Combobox.Item key={item.id} value={item} disabled={item.disabled} className="bui-option bui-command-item">
          {item.icon && <span className="bui-command-symbol"><Icon icon={item.icon} /></span>}
          <span><strong>{item.label}</strong>{item.description && <small>{item.description}</small>}</span>
          {item.category && <span className="bui-command-category">{item.category}</span>}
        </Combobox.Item>}</Combobox.List>
        <div className="bui-command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>↵</kbd> Open</span></div>
      </div>
    </Dialog>
  </Combobox.Root>;
}
