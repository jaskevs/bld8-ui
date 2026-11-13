/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export const scopedDateTimeExamples = [
  {
    "id": "scoped-workspaces-overlays",
    "componentId": "dialog",
    "title": "Independent themes and nested overlays",
    "description": "Two workspaces share one document with independent tokens, direction and motion. Dialogs, nested choices and an external portal inherit the owning workspace.",
    "keyboard": [
      "Open either workspace dialog, then open its nested confirmation. Escape returns focus to the owning trigger.",
      "Tab remains within an open modal. Choice popups keep the same theme and reading direction."
    ],
    "states": [
      "Local light and dark scopes",
      "Nested modal focus",
      "External portal container",
      "Live token changes",
      "Scoped reduced motion"
    ],
    "source": "'use client';\nimport {useRef,useState} from 'react';\nimport {Button,Dialog,DialogClose,Popover,Select,UIProvider,useUIConfig,useReducedMotionPreference} from '@bld8/ui';\nfunction ScopeReadout(){const ui=useUIConfig(),reduced=useReducedMotionPreference();return <p className=\"bui-hint\" data-scope-readout>{ui.locale+' | '+ui.direction+' | '+(reduced?'reduced':'system')}</p>;}\nfunction Review({arabic=false}:{arabic?:boolean}){return <div style={{display:'grid',gap:16,padding:24,background:'var(--bui-surface)',borderRadius:12}}>\n  <h3>{arabic?'مساحة المراجعة':'Review workspace'}</h3><ScopeReadout/>\n  <Dialog title={arabic?'لوحة المراجعة':'Review panel'} description={arabic?'تخصيص محلي دون تغيير الصفحة.':'Local configuration stays with this workspace.'} trigger={<Button variant=\"accent\">{arabic?'فتح المراجعة':'Open review panel'}</Button>}>\n    <div style={{display:'grid',gap:20}}><Select label={arabic?'الحالة':'Review status'} defaultValue=\"in-review\" options={[{value:'in-review',label:arabic?'قيد المراجعة':'In review'},{value:'approved',label:arabic?'معتمد':'Approved'}]}/>\n      <Popover title={arabic?'ملاحظات':'Review notes'} trigger={<Button variant=\"secondary\">{arabic?'تفاصيل إضافية':'More review details'}</Button>}><p>{arabic?'الخيارات تحتفظ بنفس الاتجاه والألوان.':'Popup tokens follow this workspace.'}</p></Popover>\n      <Dialog title={arabic?'تأكيد المراجعة':'Confirm review'} trigger={<Button>{arabic?'تأكيد':'Open confirmation'}</Button>}><DialogClose>{arabic?'رجوع':'Back to review'}</DialogClose></Dialog>\n      <DialogClose/>\n    </div>\n  </Dialog>\n</div>;}\nexport default function ScopedWorkspaceExample(){\n  const external=useRef<HTMLDivElement>(null),[alternate,setAlternate]=useState(false);\n  return <div style={{display:'grid',gap:20}}><Button variant=\"secondary\" onClick={()=>setAlternate(value=>!value)}>Change local accent</Button>\n    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,260px),1fr))',gap:20}}>\n      <UIProvider theme=\"light\" locale=\"en-AU\" direction=\"ltr\" tokens={{'--bui-accent':alternate?'#B7E4CD':'#FFD900'}}><div data-scope-workspace=\"light\"><Review/></div></UIProvider>\n      <UIProvider theme=\"dark\" locale=\"ar\" direction=\"rtl\" motion=\"reduced\" tokens={{'--bui-accent':'#FFD900'}} portalContainer={external}><div data-scope-workspace=\"dark\"><Review arabic/></div></UIProvider>\n    </div><div ref={external} data-external-scope-portals=\"\"/>\n  </div>;\n}"
  },
  {
    "id": "time-entry-form-lifecycle",
    "componentId": "time-picker",
    "title": "Typed times with native form ownership",
    "description": "Type strict HH:mm text, choose a slot and keep invalid drafts visible. External forms, prevented reset, read-only values and disabled exclusion use the same contract.",
    "keyboard": [
      "Enter or leaving the control commits a valid time. Escape restores the previous committed time.",
      "Alt+ArrowDown opens slots. Arrow keys, Home and End move; Enter chooses.",
      "Native submit focuses invalid text. Reset restores uncontrolled defaults unless cancelled."
    ],
    "states": [
      "Editable HH:mm",
      "External native form",
      "Required and unavailable slots",
      "Controlled and uncontrolled",
      "Prevented reset",
      "Read only and disabled"
    ],
    "source": "'use client';\nimport {useId,useState} from 'react';\nimport {Button,Checkbox,TimePicker,UIProvider} from '@bld8/ui';\nexport default function TimeEntryFormExample(){const id=useId(),[prevent,setPrevent]=useState(false),[changes,setChanges]=useState(0),[owned,setOwned]=useState<string|null>('10:00'),[status,setStatus]=useState('No time submitted.');\n  return <UIProvider><div style={{display:'grid',gap:20,maxWidth:600}}>\n    <TimePicker label=\"Session time\" name=\"session\" form={id} editable defaultValue=\"09:30\" required minTime=\"09:00\" maxTime=\"17:00\" interval={15} hourCycle=\"h23\" disabledTimes={['12:00']} onValueChange={()=>setChanges(count=>count+1)}/>\n    <TimePicker label=\"Host-owned time\" name=\"owned\" form={id} editable value={owned} onValueChange={setOwned} minTime=\"09:00\" maxTime=\"17:00\"/>\n    <TimePicker label=\"Locked time\" name=\"locked\" form={id} editable defaultValue=\"11:00\" readOnly/>\n    <TimePicker label=\"Unavailable time\" name=\"disabled\" form={id} editable defaultValue=\"11:00\" disabled/>\n    <Checkbox label=\"Prevent time reset\" checked={prevent} onCheckedChange={setPrevent}/>\n    <form id={id} aria-label=\"Time form\" onReset={event=>{if(prevent){event.preventDefault();setStatus('Time reset prevented.');}else setStatus('Time defaults restored.');}} onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);setStatus('Time: '+data.get('session')+' | Owned: '+data.get('owned')+' | Locked: '+data.get('locked')+' | Disabled: '+data.has('disabled'));}}>\n      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Button type=\"submit\">Read time values</Button><Button type=\"reset\" variant=\"secondary\">Reset times</Button><Button variant=\"ghost\" onClick={()=>setOwned(null)}>Clear host time</Button></div>\n    </form><p role=\"status\">{status}</p><p data-time-changes>{'Changes: '+changes}</p>\n  </div></UIProvider>;\n}"
  },
  {
    "id": "time-entry-confirmation",
    "componentId": "time-picker",
    "title": "Apply or discard a time draft",
    "description": "Prepare a typed or selected time without replacing the submitted value. Apply commits once; Cancel, Escape or outside dismissal restores the original.",
    "keyboard": [
      "Edit a time, then use Apply or Enter to confirm. Invalid or unavailable times stay in the field.",
      "Open slots with Alt+ArrowDown. Tab reaches Cancel and Apply. Escape discards the draft."
    ],
    "states": [
      "Explicit commit",
      "Controlled null",
      "Canonical native entry",
      "Invalid draft retention",
      "Apply and Cancel"
    ],
    "source": "'use client';\nimport {useState} from 'react';\nimport {Button,TimePicker,UIProvider} from '@bld8/ui';\nexport default function TimeConfirmationExample(){const [time,setTime]=useState<string|null>('09:30'),[changes,setChanges]=useState(0),[result,setResult]=useState('No confirmed time submitted.');return <UIProvider><form aria-label=\"Confirmed time form\" style={{display:'grid',gap:16,maxWidth:500}} onSubmit={event=>{event.preventDefault();setResult('Confirmed: '+new FormData(event.currentTarget).get('confirmed'));}}>\n  <TimePicker label=\"Confirmed start\" name=\"confirmed\" value={time} onValueChange={next=>{setTime(next);setChanges(count=>count+1);}} editable commitMode=\"explicit\" minTime=\"09:00\" maxTime=\"11:00\" interval={15} hourCycle=\"h23\"/>\n  <Button type=\"submit\">Read confirmed time</Button><p data-confirmed-time>{'Committed: '+(time??'empty')+' | Changes: '+changes}</p><p role=\"status\">{result}</p>\n</form></UIProvider>;}\n"
  },
  {
    "id": "calendar-navigation-availability",
    "componentId": "calendar",
    "title": "Month and year navigation with one availability rule",
    "description": "Navigate two months with compact month and year choices. The same unavailable dates and weekday policy validate calendar picks, typed dates and explicit date ranges.",
    "keyboard": [
      "Month and Year choices support arrow navigation and typeahead. Day buttons retain calendar arrow, Home, End and Page keys.",
      "Type an unavailable date or a range crossing one: submission keeps the draft and focuses the invalid text."
    ],
    "states": [
      "Two-month display",
      "Controlled month",
      "Custom month and year choices",
      "Exact unavailable dates",
      "Weekday policy",
      "Shared typed validation",
      "Responsive month and year groups",
      "English and Arabic navigation"
    ],
    "source": "'use client';\nimport {useState} from 'react';\nimport {Button,Calendar,DatePicker,DateRangePicker,formatDateValue,parseDateValue,UIProvider} from '@bld8/ui';\nconst date=(value:string)=>parseDateValue(value)!;\nconst unavailable=[date('2026-11-17')],weekend=(value:Date)=>value.getDay()===0||value.getDay()===6;\nexport default function CalendarAvailabilityExample(){const [month,setMonth]=useState(date('2026-11-01')),[selected,setSelected]=useState<Date|undefined>(date('2026-11-16')),[status,setStatus]=useState('No available date submitted.'),[arabic,setArabic]=useState(false);return <UIProvider locale={arabic?'ar':'en-AU'} direction={arabic?'rtl':'ltr'}><div style={{display:'grid',gap:24,maxWidth:720}}>\n  <Button variant=\"secondary\" onClick={()=>setArabic(value=>!value)}>{arabic?'Use English calendar':'Use Arabic calendar'}</Button>\n  <Calendar label=\"Review calendar\" navigation=\"dropdowns\" month={month} onMonthChange={setMonth} numberOfMonths={2} value={selected} onValueChange={setSelected} startMonth={date('2025-01-01')} endMonth={date('2027-12-01')} minDate={date('2026-11-01')} maxDate={date('2027-05-31')} unavailableDates={unavailable} isDateUnavailable={weekend}/>\n  <p data-calendar-selection>{'Selected: '+formatDateValue(selected)}</p>\n  <form aria-label=\"Available date form\" style={{display:'grid',gap:20}} onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);setStatus('Date: '+data.get('available')+' | Range: '+data.get('period.from')+' to '+data.get('period.to'));}}>\n    <DatePicker label=\"Available review date\" editable name=\"available\" defaultValue={date('2026-11-16')} minDate={date('2026-11-01')} maxDate={date('2027-05-31')} unavailableDates={unavailable} isDateUnavailable={weekend} navigation=\"dropdowns\"/>\n    <DateRangePicker label=\"Available period\" editable name=\"period\" commitMode=\"explicit\" defaultValue={{from:date('2026-11-02'),to:date('2026-11-04')}} minDate={date('2026-11-01')} maxDate={date('2027-05-31')} unavailableDates={unavailable} isDateUnavailable={weekend} navigation=\"dropdowns\" numberOfMonths={2}/>\n    <Button type=\"submit\">Read available dates</Button>\n  </form><p role=\"status\">{status}</p>\n</div></UIProvider>;}\n"
  },
  {
    "id": "localized-arabic-form",
    "componentId": "time-picker",
    "title": "An Arabic form with stable submitted values",
    "description": "Localize labels, built-in feedback and reading direction while keeping ASCII time values and stable channel IDs. Translation does not rewrite the form model.",
    "keyboard": [
      "Submit without a title, then follow its linked error back to the field.",
      "Type HH:mm in the time field. Enter applies; Arabic Cancel restores the prior value.",
      "Tab and Space operate the same native channel choices under RTL."
    ],
    "states": [
      "Arabic messages",
      "Explicit RTL",
      "Linked form errors",
      "Native stable values",
      "Scoped reduced motion"
    ],
    "source": "'use client';\nimport {useState} from 'react';\nimport {Button,CheckboxGroup,Field,FormErrorSummary,Input,TimePicker,UIProvider} from '@bld8/ui';\nexport default function LocalizedFormExample(){const [errors,setErrors]=useState<Record<string,string>>({}),[status,setStatus]=useState('لم يتم إعداد الطلب.');return <UIProvider theme=\"light\" locale=\"ar\" direction=\"rtl\" motion=\"reduced\"><form noValidate aria-label=\"طلب مراجعة\" style={{display:'grid',gap:20,maxWidth:600,padding:24,background:'var(--bui-surface)'}} onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);if(!String(data.get('title')??'').trim()){setErrors({title:'أدخل عنوان الطلب.'});return;}const time=event.currentTarget.querySelector<HTMLInputElement>('[data-time-field] input:not([type=hidden])');if(time&&!time.checkValidity()){time.reportValidity();return;}setErrors({});setStatus('channel='+data.getAll('channels').join(',')+' | time='+data.get('start'));}}>\n  <FormErrorSummary errors={errors} fieldLabels={{title:'عنوان الطلب'}}/>\n  <Field label=\"عنوان الطلب\" error={errors.title}><Input name=\"title\" onChange={()=>setErrors({})}/></Field>\n  <CheckboxGroup label=\"قنوات الإشعار\" name=\"channels\" defaultValue={['email']} options={[{value:'email',label:'البريد الإلكتروني'},{value:'in-app',label:'داخل التطبيق'}]}/>\n  <div data-time-field><TimePicker label=\"وقت البدء\" name=\"start\" editable commitMode=\"explicit\" defaultValue=\"09:30\" minTime=\"09:00\" maxTime=\"11:00\" hourCycle=\"h23\"/></div>\n  <Button type=\"submit\">إعداد الطلب</Button><p role=\"status\">{status}</p>\n</form></UIProvider>;}\n"
  }
];
