export interface TimeOption { value:string; label:string; disabled?:boolean }
export interface TimeOptions {
  minTime?:string; maxTime?:string; interval?:5|10|15|20|30|60;
  locale?:string; hourCycle?:'h12'|'h23'; disabledTimes?:readonly string[];
}
export function parseTimeValue(value:string):number|null {
  if(typeof value!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))return null;
  return Number(value.slice(0,2))*60+Number(value.slice(3));
}
export function formatTimeLabel(value:string,locale='en-AU',hourCycle?:'h12'|'h23'):string {
  const minutes=parseTimeValue(value);if(minutes===null)throw new Error('Use a time in HH:mm format.');
  return new Intl.DateTimeFormat(locale,{timeZone:'UTC',hour:'numeric',minute:'2-digit',...(hourCycle?{hourCycle}:{})}).format(new Date(Date.UTC(2000,0,1,Math.floor(minutes/60),minutes%60)));
}
/** Date-free wall-clock choices, anchored to midnight. No timezone conversion. */
export function createTimeOptions({minTime='00:00',maxTime='23:59',interval=15,locale='en-AU',hourCycle,disabledTimes=[]}:TimeOptions={}):TimeOption[] {
  const min=parseTimeValue(minTime),max=parseTimeValue(maxTime);
  if(min===null||max===null||min>max)throw new Error('Use valid start and end times within the same day.');
  if(![5,10,15,20,30,60].includes(interval))throw new Error('Choose a supported time interval.');
  if(disabledTimes.length>288||disabledTimes.some(time=>parseTimeValue(time)===null))throw new Error('Use supported HH:mm values for unavailable times.');
  const formatter=new Intl.DateTimeFormat(locale,{timeZone:'UTC',hour:'numeric',minute:'2-digit',...(hourCycle?{hourCycle}:{})});
  const options:TimeOption[]=[];
  for(let minutes=Math.ceil(min/interval)*interval;minutes<=max;minutes+=interval){const value=String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');options.push({value,label:formatter.format(new Date(Date.UTC(2000,0,1,Math.floor(minutes/60),minutes%60))),disabled:disabledTimes.includes(value)});}
  return options;
}
