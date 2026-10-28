import {parseTimeValue} from '@bld8/ui/time-options';
export interface SessionPreferences { workspace:string; seats:number|null; duration:number|null; startTime:string|null; timeZone:string; locale:string }
export interface CompleteSessionPreferences extends SessionPreferences { seats:number; duration:number; startTime:string }
export interface SessionDraft { version:1; values:SessionPreferences; step:0|1|2; complete:boolean }
export const sessionZones=[{value:'Australia/Melbourne',label:'Melbourne · Australia'},{value:'Europe/London',label:'London · United Kingdom'},{value:'America/New_York',label:'New York · United States'},{value:'UTC',label:'UTC'}];
export const sessionLocales=[{value:'en-AU',label:'Australia · 24-hour'},{value:'en-US',label:'United States · 12-hour'},{value:'de-DE',label:'Germany · 24-hour'}];
export const initialSessionPreferences=():SessionPreferences=>({workspace:'',seats:3,duration:45,startTime:'09:30',timeZone:'Australia/Melbourne',locale:'en-AU'});
export function validateSessionPreferences(values:SessionPreferences,step:0|1|2=2):Record<string,string> {
  const errors:Record<string,string>={};
  if(!values.workspace.trim()||values.workspace.trim().length>80)errors.workspace='Use a workspace name between 1 and 80 characters.';
  if(values.seats===null||!Number.isInteger(values.seats)||values.seats<1||values.seats>12)errors.seats='Use between 1 and 12 seats.';
  if(!sessionLocales.some(option=>option.value===values.locale))errors.locale='Choose a supported display format.';
  if(step>0){if(values.duration===null||!Number.isInteger(values.duration)||values.duration<15||values.duration>120||values.duration%15!==0)errors.duration='Choose 15 to 120 minutes, in 15-minute steps.';
    const start=values.startTime===null?null:parseTimeValue(values.startTime);if(start===null||start<540||start>1020||start%15!==0)errors.startTime='Choose a start time from 09:00 to 17:00, in 15-minute steps.';
    if(!sessionZones.some(option=>option.value===values.timeZone))errors.timeZone='Choose a supported time zone.';
  }
  return errors;
}
export function parseSessionDraft(text:string):SessionDraft|null {
  try{if(text.length>8000)return null;const draft=JSON.parse(text),values=draft?.values;if(draft?.version!==1||![0,1,2].includes(draft.step)||typeof draft.complete!=='boolean'||!values||typeof values.workspace!=='string'||values.workspace.length>80||![values.seats,values.duration].every(value=>value===null||typeof value==='number'&&Number.isFinite(value)&&Math.abs(value)<=100000)||values.startTime!==null&&(typeof values.startTime!=='string'||parseTimeValue(values.startTime)===null)||!sessionZones.some(option=>option.value===values.timeZone)||!sessionLocales.some(option=>option.value===values.locale))return null;
    const clean:SessionPreferences={workspace:values.workspace,seats:values.seats,duration:values.duration,startTime:values.startTime,timeZone:values.timeZone,locale:values.locale};
    const firstValid=!Object.keys(validateSessionPreferences(clean,0)).length,allValid=!Object.keys(validateSessionPreferences(clean)).length;
    return {version:1,values:clean,step:!firstValid?0:!allValid&&draft.step===2?1:draft.step,complete:draft.complete&&allValid};
  }catch{return null;}
}
