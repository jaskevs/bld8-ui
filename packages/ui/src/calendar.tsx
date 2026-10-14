'use client';
import { useId, useRef, useState, type Ref, type FocusEventHandler } from 'react';
import { DayPicker, type DateRange, type DayPickerLocale } from 'react-day-picker';
import { Popover } from '@base-ui/react/popover';
import { CalendarDays, X } from 'lucide-react';
import { Button, Icon, IconButton } from './core.js';
import { useControllableValue } from './state.js';
export type { DateRange, DayPickerLocale } from 'react-day-picker';

export interface CalendarBaseProps {
  label?: string;
  defaultMonth?: Date;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  locale?: DayPickerLocale;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  autoFocus?: boolean;
}
export type CalendarProps = CalendarBaseProps & (
  { mode?: 'single'; value?: Date; onValueChange?: (value: Date | undefined) => void } |
  { mode: 'range'; value?: DateRange; onValueChange?: (value: DateRange | undefined) => void }
);
const calendarClasses = {
  root:'bui-calendar', months:'bui-calendar-months', month:'bui-calendar-month', month_caption:'bui-calendar-caption',
  caption_label:'bui-calendar-label', nav:'bui-calendar-nav', button_previous:'bui-calendar-nav-button', button_next:'bui-calendar-nav-button',
  chevron:'bui-calendar-chevron', month_grid:'bui-calendar-grid', weekday:'bui-calendar-weekday', day:'bui-calendar-day', day_button:'bui-calendar-day-button',
  today:'bui-calendar-today', selected:'bui-calendar-selected', outside:'bui-calendar-outside', disabled:'bui-calendar-disabled',
  range_start:'bui-calendar-range-start', range_end:'bui-calendar-range-end', range_middle:'bui-calendar-range-middle', hidden:'bui-calendar-hidden',
};
export function Calendar({ label = 'Choose a date', defaultMonth, minDate, maxDate, disabled, locale, weekStartsOn = 1, autoFocus, ...selection }: CalendarProps) {
  const common = { classNames:calendarClasses, 'aria-label':label, defaultMonth:defaultMonth ?? (selection.mode === 'range' ? selection.value?.from : selection.value),
    startMonth:minDate, endMonth:maxDate, locale, weekStartsOn, autoFocus, showOutsideDays:true, fixedWeeks:true,
    disabled:disabled ? true : [ ...(minDate ? [{before:minDate}] : []), ...(maxDate ? [{after:maxDate}] : []) ] };
  return selection.mode === 'range'
    ? <DayPicker {...common} mode="range" selected={selection.value} onSelect={selection.onValueChange} excludeDisabled />
    : <DayPicker {...common} mode="single" selected={selection.value} onSelect={selection.onValueChange} />;
}
/** Date-only form values use local calendar fields, never UTC conversion. */
export function formatDateValue(value?: Date) {
  return value && !Number.isNaN(value.getTime()) ? [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'), String(value.getDate()).padStart(2, '0')].join('-') : '';
}
export interface DatePickerProps extends Omit<CalendarBaseProps, 'label' | 'autoFocus'> {
  label: string;
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (value: Date | null) => void;
  name?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  formatLocale?: string;
  inputRef?:Ref<HTMLButtonElement>;
  onBlur?:FocusEventHandler<HTMLButtonElement>;
}
export function DatePicker({ label, value, defaultValue = null, onValueChange, name, placeholder = 'Choose a date', hint, error, formatLocale = 'en-AU', inputRef, onBlur, ...calendar }: DatePickerProps) {
  const id = useId(); const [open, setOpen] = useState(false);
  const trigger=useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useControllableValue(value, defaultValue, onValueChange);
  const display = selected ? new Intl.DateTimeFormat(formatLocale, {day:'numeric', month:'short', year:'numeric'}).format(selected) : placeholder;
  return <div className="bui-field">
    <label htmlFor={id} className="bui-label">{label}</label>
    <div className="bui-date-field">
      <Popover.Root open={open} onOpenChange={setOpen}><Popover.Trigger ref={(node:HTMLButtonElement|null)=>{trigger.current=node;if(typeof inputRef==='function')inputRef(node);else if(inputRef)inputRef.current=node;}} onBlur={onBlur} id={id} disabled={calendar.disabled} aria-invalid={!!error || undefined} aria-describedby={hint || error ? id + '-description' : undefined} className="bui-input bui-date-trigger">
        <Icon icon={CalendarDays} /><span data-placeholder={!selected || undefined}>{display}</span><Icon name="chevron" />
      </Popover.Trigger><Popover.Portal><Popover.Positioner className="bui-positioner" sideOffset={8}><Popover.Popup className="bui-popup bui-calendar-popup">
        <Popover.Title className="bui-sr-only">{label}</Popover.Title>
        <Calendar {...calendar} label={label} value={selected ?? undefined} autoFocus onValueChange={date => {setSelected(date ?? null);setOpen(false);}} />
      </Popover.Popup></Popover.Positioner></Popover.Portal></Popover.Root>
      {selected && <IconButton icon={X} label={'Clear ' + label.toLowerCase()} size="sm" variant="ghost" disabled={calendar.disabled} onClick={() => {setSelected(null);trigger.current?.focus();}} />}
    </div>
    {name && <input type="hidden" name={name} value={formatDateValue(selected ?? undefined)} />}
    {(hint || error) && <p id={id + '-description'} className={error ? 'bui-error' : 'bui-hint'} role={error ? 'alert' : undefined}>{error || hint}</p>}
  </div>;
}
export interface DateRangePickerProps extends Omit<DatePickerProps, 'value' | 'defaultValue' | 'onValueChange'> {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (value: DateRange | null) => void;
}
export function DateRangePicker({ label, value, defaultValue = null, onValueChange, name, placeholder = 'Choose a date range', hint, error, formatLocale = 'en-AU', inputRef, onBlur, ...calendar }: DateRangePickerProps) {
  const id = useId(); const [open, setOpen] = useState(false);
  const trigger=useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useControllableValue(value, defaultValue, onValueChange);
  const format = (date:Date) => new Intl.DateTimeFormat(formatLocale, {day:'numeric',month:'short',year:'numeric'}).format(date);
  const display = selected?.from ? format(selected.from) + (selected.to ? ' – ' + format(selected.to) : ' – Choose end date') : placeholder;
  return <div className="bui-field"><label htmlFor={id} className="bui-label">{label}</label><div className="bui-date-field">
    <Popover.Root open={open} onOpenChange={setOpen}><Popover.Trigger ref={(node:HTMLButtonElement|null)=>{trigger.current=node;if(typeof inputRef==='function')inputRef(node);else if(inputRef)inputRef.current=node;}} onBlur={onBlur} id={id} disabled={calendar.disabled} aria-invalid={!!error || undefined} aria-describedby={hint || error ? id + '-description' : undefined} className="bui-input bui-date-trigger">
      <Icon icon={CalendarDays} /><span data-placeholder={!selected?.from || undefined}>{display}</span><Icon name="chevron" />
    </Popover.Trigger><Popover.Portal><Popover.Positioner className="bui-positioner" sideOffset={8}><Popover.Popup className="bui-popup bui-calendar-popup">
      <Popover.Title className="bui-sr-only">{label}</Popover.Title>
      <Calendar {...calendar} label={label} mode="range" value={selected ?? undefined} autoFocus onValueChange={range => setSelected(range ?? null)} />
      <div className="bui-calendar-footer"><span className="bui-hint" aria-live="polite">{selected?.from && selected.to ? 'Range selected' : 'Choose start and end dates'}</span><Button size="sm" disabled={!selected?.from || !selected.to} onClick={() => setOpen(false)}>Done</Button></div>
    </Popover.Popup></Popover.Positioner></Popover.Portal></Popover.Root>
    {selected && <IconButton icon={X} label={'Clear ' + label.toLowerCase()} size="sm" variant="ghost" disabled={calendar.disabled} onClick={() => {setSelected(null);trigger.current?.focus();}} />}
  </div>
    {name && <><input type="hidden" name={name + '.from'} value={formatDateValue(selected?.from)} /><input type="hidden" name={name + '.to'} value={formatDateValue(selected?.to)} /></>}
    {(hint || error) && <p id={id + '-description'} className={error ? 'bui-error' : 'bui-hint'} role={error ? 'alert' : undefined}>{error || hint}</p>}
  </div>;
}
