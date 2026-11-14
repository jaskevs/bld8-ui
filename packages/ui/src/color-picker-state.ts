/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export interface ColorRGBA {r:number;g:number;b:number;a:number}
export type ColorFormat='hex'|'rgb'|'hsl';
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const round=(value:number,places=2)=>Number(value.toFixed(places));
const valid=(value:ColorRGBA)=>[value.r,value.g,value.b,value.a].every(Number.isFinite)&&value.r>=0&&value.r<=255&&value.g>=0&&value.g<=255&&value.b>=0&&value.b<=255&&value.a>=0&&value.a<=1;
/** Strict supported CSS colors; named colors and browser-dependent parsing are excluded. */
export function parseColorValue(input:string):ColorRGBA|null {
 if(typeof input!=='string'||input.length>100)return null;const text=input.trim();
 if(/^#[0-9a-f]{3,4}$/i.test(text)){const parts=text.slice(1).split('').map(value=>parseInt(value+value,16));return {r:parts[0],g:parts[1],b:parts[2],a:parts.length===4?parts[3]/255:1};}
 if(/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(text))return {r:parseInt(text.slice(1,3),16),g:parseInt(text.slice(3,5),16),b:parseInt(text.slice(5,7),16),a:text.length===9?parseInt(text.slice(7,9),16)/255:1};
 const match=/^(rgba?|hsla?)\(([^()]+)\)$/i.exec(text);if(!match)return null;
 const parts=match[2].replace(/\s*\/\s*/,',').trim().split(/\s*,\s*|\s+/).filter(Boolean);if(parts.length<3||parts.length>4)return null;
 const number=(value:string,percentScale=1)=>{if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:%|deg)?$/.test(value))return NaN;const numeric=parseFloat(value);return value.endsWith('%')?numeric*percentScale/100:numeric;};
 const a=parts.length===4?number(parts[3]):1;if(!Number.isFinite(a)||a<0||a>1||parts[3]?.endsWith('deg'))return null;
 if(match[1].toLowerCase().startsWith('rgb')){if(parts.slice(0,3).some(value=>value.endsWith('deg')))return null;const [r,g,b]=parts.slice(0,3).map(value=>number(value,255));return valid({r,g,b,a})?{r:Math.round(r),g:Math.round(g),b:Math.round(b),a}:null;}
 if(!parts[1].endsWith('%')||!parts[2].endsWith('%')||parts[0].endsWith('%'))return null;const hue=number(parts[0]),s=number(parts[1]),l=number(parts[2]);if(!Number.isFinite(hue)||!Number.isFinite(s)||!Number.isFinite(l)||s<0||s>1||l<0||l>1)return null;
 const h=((hue%360)+360)%360,c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2,pair=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return {r:Math.round((pair[0]+m)*255),g:Math.round((pair[1]+m)*255),b:Math.round((pair[2]+m)*255),a};
}
export function colorChannels(value:ColorRGBA){if(!valid(value))throw Error('Use finite RGB channels from 0 to 255 and alpha from 0 to 1.');const r=value.r/255,g=value.g/255,b=value.b/255,max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min,l=(max+min)/2;let h=0;if(delta){h=max===r?((g-b)/delta)%6:max===g?(b-r)/delta+2:(r-g)/delta+4;h*=60;if(h<0)h+=360;}const s=delta===0?0:delta/(1-Math.abs(2*l-1));return {r:Math.round(value.r),g:Math.round(value.g),b:Math.round(value.b),h:round(h),s:round(s*100),l:round(l*100),a:value.a};}
export function formatColorValue(value:ColorRGBA,format:ColorFormat='hex',alpha=true):string {const channels=colorChannels(value),a=alpha?clamp(value.a,0,1):1;if(format==='rgb')return a===1?`rgb(${channels.r}, ${channels.g}, ${channels.b})`:`rgba(${channels.r}, ${channels.g}, ${channels.b}, ${round(a,3)})`;if(format==='hsl')return a===1?`hsl(${channels.h}, ${channels.s}%, ${channels.l}%)`:`hsla(${channels.h}, ${channels.s}%, ${channels.l}%, ${round(a,3)})`;return '#'+[channels.r,channels.g,channels.b,...(a<1?[Math.round(a*255)]:[])].map(value=>value.toString(16).padStart(2,'0')).join('').toUpperCase();}
