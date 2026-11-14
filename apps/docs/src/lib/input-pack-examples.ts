/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export const inputPackExamples = [
  {
    "id": "color-format-form",
    "componentId": "color-picker",
    "title": "Color formats with canonical form values",
    "description": "Edit HEX, RGB or HSL, adjust opacity and submit one canonical HEX value. External form ownership and native reset share the same draft contract.",
    "keyboard": [
      "Tab reaches text, format, opacity and swatches. Enter commits; Escape restores the committed color.",
      "The opacity range supports native arrow keys. Invalid text prevents native submission."
    ],
    "states": [
      "HEX RGB HSL",
      "alpha",
      "external form",
      "prevented reset",
      "controlled null",
      "read only and disabled"
    ],
    "source": "'use client';\nimport {useId,useState} from 'react';\nimport {Button,Checkbox,ColorPicker,UIProvider} from '@bld8/ui';\nexport default function ColorForm(){const id=useId(),[prevent,setPrevent]=useState(false),[owned,setOwned]=useState<string|null>('#273E35'),[reject,setReject]=useState(false),[result,setResult]=useState('No colors submitted.');return <UIProvider><div style={{display:'grid',gap:24,maxWidth:580}}>\n<ColorPicker label=\"Brand color\" name=\"brand\" form={id} required defaultValue=\"#FFD900\" swatches={['#FFD900','#273E35','#F2F3EF','#A8BDB0']}/>\n<ColorPicker label=\"Host color\" name=\"owned\" form={id} value={owned} onValueChange={next=>{if(!reject)setOwned(next);}} alpha={false}/>\n<ColorPicker label=\"Locked color\" name=\"locked\" form={id} defaultValue=\"#FFFFFF\" readOnly alpha={false}/>\n<ColorPicker label=\"Disabled color\" name=\"disabled\" form={id} defaultValue=\"#1B2420\" disabled/>\n<Checkbox label=\"Reject host color edits\" checked={reject} onCheckedChange={setReject}/><Checkbox label=\"Prevent color reset\" checked={prevent} onCheckedChange={setPrevent}/>\n<form id={id} aria-label=\"Color settings\" onReset={event=>{if(prevent)event.preventDefault();}} onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);setResult('Brand: '+data.get('brand')+' | Owned: '+data.get('owned')+' | Locked: '+data.get('locked')+' | Disabled: '+data.has('disabled'));}}><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Button type=\"submit\">Read colors</Button><Button type=\"reset\" variant=\"secondary\">Reset colors</Button><Button variant=\"ghost\" onClick={()=>setOwned(null)}>Clear host color</Button></div></form><p role=\"status\">{result}</p>\n</div></UIProvider>;}"
  },
  {
    "id": "phone-country-form",
    "componentId": "phone-input",
    "title": "Phone entry with real numbering metadata",
    "description": "Search countries, keep incomplete text editable and submit validated E.164 values. Numbering-plan validation does not verify ownership or send a message.",
    "keyboard": [
      "Search the country field and use arrows and Enter to select.",
      "Type a national or international number; invalid text stays editable. Escape restores the committed number."
    ],
    "states": [
      "metadata validation",
      "canonical E.164",
      "country search",
      "external native form",
      "prevented reset",
      "read only and disabled"
    ],
    "source": "'use client';\nimport {useId,useState} from 'react';\nimport {Button,Checkbox,PhoneInput,UIProvider} from '@bld8/ui';\nexport default function PhoneForm(){const id=useId(),[prevent,setPrevent]=useState(false),[owned,setOwned]=useState<string|null>('+12025550123'),[reject,setReject]=useState(false),[result,setResult]=useState('No phone submitted.');return <UIProvider><div style={{display:'grid',gap:24,maxWidth:620}}>\n<PhoneInput label=\"Contact phone\" name=\"phone\" form={id} required defaultCountry=\"AU\" defaultValue=\"+61412345678\" countries={['AU','US','GB','IN']} hint=\"National or international numbers; extensions are excluded.\"/>\n<PhoneInput label=\"Host phone\" name=\"owned\" form={id} value={owned} onValueChange={next=>{if(!reject)setOwned(next);}} defaultCountry=\"US\" countries={['AU','US','GB','IN']}/>\n<PhoneInput label=\"Locked phone\" name=\"locked\" form={id} defaultValue=\"+61412345678\" readOnly countries={['AU','US']}/>\n<PhoneInput label=\"Disabled phone\" name=\"disabled\" form={id} defaultValue=\"+61412345678\" disabled countries={['AU','US']}/>\n<Checkbox label=\"Reject host phone edits\" checked={reject} onCheckedChange={setReject}/><Checkbox label=\"Prevent phone reset\" checked={prevent} onCheckedChange={setPrevent}/>\n<form id={id} aria-label=\"Contact details\" onReset={event=>{if(prevent)event.preventDefault();}} onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);setResult('Phone: '+data.get('phone')+' | Owned: '+data.get('owned')+' | Locked: '+data.get('locked')+' | Disabled: '+data.has('disabled'));}}><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Button type=\"submit\">Read phone values</Button><Button type=\"reset\" variant=\"secondary\">Reset phones</Button><Button variant=\"ghost\" onClick={()=>setOwned(null)}>Clear host phone</Button></div></form><p role=\"status\">{result}</p>\n</div></UIProvider>;}"
  },
  {
    "id": "rating-fractional-form",
    "componentId": "rating",
    "title": "Fractional ratings with native radio values",
    "description": "Choose half-star scores with the pointer or keyboard, preserve read-only values and reset through an external native form.",
    "keyboard": [
      "Arrow keys change by half a star; Home and End reach the bounds.",
      "RTL reverses horizontal arrow direction. Clear rating restores an unrated value."
    ],
    "states": [
      "half stars",
      "RTL",
      "native form ownership",
      "required",
      "prevented reset",
      "read only and disabled"
    ],
    "source": "'use client';\nimport {useId,useState} from 'react';\nimport {Button,Checkbox,Rating,UIProvider} from '@bld8/ui';\nexport default function RatingForm(){const id=useId(),[rtl,setRtl]=useState(false),[prevent,setPrevent]=useState(false),[result,setResult]=useState('No rating submitted.');return <UIProvider direction={rtl?'rtl':'ltr'}><div style={{display:'grid',gap:24}}><Button variant=\"secondary\" onClick={()=>setRtl(value=>!value)}>{rtl?'Use LTR rating':'Use RTL rating'}</Button>\n<Rating label=\"Review score\" name=\"score\" form={id} defaultValue={3.5} step={.5} required hint=\"Use arrow keys for half-star steps.\"/>\n<Rating label=\"Published score\" name=\"published\" form={id} value={4.5} step={.5} readOnly/>\n<Rating label=\"Disabled score\" name=\"disabled\" form={id} defaultValue={2} disabled/>\n<Rating label=\"Ten point summary\" max={10} step={.5} value={8.5} readOnly/>\n<Checkbox label=\"Prevent rating reset\" checked={prevent} onCheckedChange={setPrevent}/>\n<form id={id} aria-label=\"Review form\" onReset={event=>{if(prevent)event.preventDefault();}} onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);setResult('Score: '+data.get('score')+' | Published: '+data.get('published')+' | Disabled: '+data.has('disabled'));}}><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Button type=\"submit\">Read ratings</Button><Button type=\"reset\" variant=\"secondary\">Reset ratings</Button></div></form><p role=\"status\">{result}</p></div></UIProvider>;}"
  }
];
