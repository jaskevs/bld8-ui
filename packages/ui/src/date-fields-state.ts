/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
/** Date-only values use local calendar fields, never UTC conversion or permissive Date parsing. */
export function parseDateValue(value:string):Date|null {
  const match=/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
  if(!match)return null;
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
  if(year<1||month<1||month>12||day<1||day>31)return null;
  const date=new Date(0);date.setHours(12,0,0,0);date.setFullYear(year,month-1,day);
  return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:null;
}
export function formatDateValue(value?:Date|null):string {
  return value instanceof Date&&Number.isFinite(value.getTime())&&value.getFullYear()>0&&value.getFullYear()<=9999
    ? [String(value.getFullYear()).padStart(4,'0'),String(value.getMonth()+1).padStart(2,'0'),String(value.getDate()).padStart(2,'0')].join('-'):'';
}
export function dateEntryMessage(value:string,{required=false,minDate,maxDate}:{required?:boolean;minDate?:Date;maxDate?:Date}):string {
  if(!value)return required?'Enter a date.':'';
  if(!parseDateValue(value))return 'Enter a valid date as YYYY-MM-DD.';
  const minimum=formatDateValue(minDate),maximum=formatDateValue(maxDate);
  if(minimum&&value<minimum)return 'Enter a date on or after '+minimum+'.';
  if(maximum&&value>maximum)return 'Enter a date on or before '+maximum+'.';
  return '';
}
export function rangeEntryMessage(from:string,to:string,bounds:{required?:boolean;minDate?:Date;maxDate?:Date}):string {
  if(!from&&!to)return bounds.required?'Choose start and end dates.':'';
  if(!from||!to)return 'Choose both start and end dates.';
  const invalid=dateEntryMessage(from,bounds)||dateEntryMessage(to,bounds);
  if(invalid)return invalid;
  return from>to?'The end date must be on or after the start date.':'';
}
