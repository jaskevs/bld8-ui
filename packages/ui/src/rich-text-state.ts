/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
/** Portable rich-text data. This deliberately excludes raw HTML, media and executable attributes. */
export interface RichTextMark {type:'bold'|'italic'|'strike'|'code'|'link';attrs?:{href:string}}
export interface RichTextNode {
  type:'paragraph'|'heading'|'bulletList'|'orderedList'|'listItem'|'codeBlock'|'hardBreak'|'mention'|'text';
  text?:string;content?:RichTextNode[];marks?:RichTextMark[];attrs?:{level?:1|2|3;start?:number;id?:string;label?:string};
}
export interface RichTextDocument {type:'doc';content:RichTextNode[]}
export interface RichTextMention {id:string;label:string;description?:string;disabled?:boolean}
export interface RichTextMentionRequest {query:string;signal:AbortSignal}
export type RichTextMentionSource=(request:RichTextMentionRequest)=>Promise<readonly RichTextMention[]>;
export const EMPTY_RICH_TEXT_DOCUMENT:RichTextDocument={type:'doc',content:[{type:'paragraph'}]};
const reserved=new Set(['__proto__','prototype','constructor']);
const plain=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
const safeId=(value:unknown):value is string=>typeof value==='string'&&!!value.trim()&&value.length<=128&&!/[\u0000-\u001f\u007f]/.test(value)&&!reserved.has(value);
/** Safe, explicit destinations only. Relative links start with one slash or #. */
export function isSafeRichTextLink(value:unknown):value is string {
  if(typeof value!=='string'||!value||value.length>2048||value!==value.trim()||/[\u0000-\u0020\u007f\\]/.test(value))return false;
  if(value.startsWith('#'))return value.length>1;
  if(value.startsWith('/'))return !value.startsWith('//');
  try{const url=new URL(value);return (url.protocol==='https:'||url.protocol==='http:')&&!!url.hostname||url.protocol==='mailto:'&&!!url.pathname;}catch{return false;}
}
/** Validate and clone at most 2,000 nodes, 12 levels and 100,000 text characters. */
export function parseRichTextDocument(value:unknown):RichTextDocument|null {
  try{
    if(typeof value==='string'){if(value.length>500000)return null;value=JSON.parse(value);}
    if(!plain(value)||value.type!=='doc'||!Array.isArray(value.content)||!value.content.length)return null;
    let count=0,length=0;
    const blocks=new Set(['paragraph','heading','bulletList','orderedList','codeBlock']),inline=new Set(['text','hardBreak','mention']);
    function visit(input:unknown,depth:number,parent:string):RichTextNode {
      if(++count>2000||depth>12||!plain(input)||typeof input.type!=='string')throw Error();
      const type=input.type as RichTextNode['type'];
      if(parent==='doc'&&!blocks.has(type)||['paragraph','heading'].includes(parent)&&!inline.has(type)||parent==='codeBlock'&&type!=='text'||['bulletList','orderedList'].includes(parent)&&type!=='listItem'||parent==='listItem'&&!blocks.has(type))throw Error();
      if(!blocks.has(type)&&!inline.has(type)&&type!=='listItem')throw Error();
      const node:RichTextNode={type};
      if(type==='text'){
        if(typeof input.text!=='string'||!input.text.length)throw Error();length+=input.text.length;if(length>100000)throw Error();node.text=input.text;
        if(input.marks!==undefined){if(!Array.isArray(input.marks)||input.marks.length>5||parent==='codeBlock'&&input.marks.length)throw Error();const seen=new Set();node.marks=input.marks.map(mark=>{if(!plain(mark)||!['bold','italic','strike','code','link'].includes(String(mark.type))||seen.has(mark.type))throw Error();seen.add(mark.type);if(mark.type==='link'){if(!plain(mark.attrs)||!isSafeRichTextLink(mark.attrs.href))throw Error();return {type:'link',attrs:{href:mark.attrs.href}};}return {type:mark.type} as RichTextMark;});if(!node.marks.length)delete node.marks;}
      }else if(type==='mention'){
        if(!plain(input.attrs)||!safeId(input.attrs.id)||typeof input.attrs.label!=='string'||!input.attrs.label.trim()||input.attrs.label.length>200)throw Error();node.attrs={id:input.attrs.id,label:input.attrs.label};length+=input.attrs.label.length;if(length>100000)throw Error();
      }else if(type==='heading'){
        if(!plain(input.attrs)||typeof input.attrs.level!=='number'||![1,2,3].includes(input.attrs.level))throw Error();node.attrs={level:input.attrs.level as 1|2|3};
      }else if(type==='orderedList'){
        const start=plain(input.attrs)?input.attrs.start:undefined;if(start!==undefined&&(!Number.isInteger(start)||Number(start)<1||Number(start)>1000000))throw Error();if(start!==undefined&&start!==1)node.attrs={start:start as number};
      }
      if(input.content!==undefined){if(!Array.isArray(input.content)||inline.has(type))throw Error();node.content=Array.from(input.content).map(child=>visit(child,depth+1,type));if(!node.content.length)delete node.content;}
      if(['bulletList','orderedList'].includes(type)&&!node.content?.length||type==='listItem'&&(!node.content?.length||node.content[0].type!=='paragraph'))throw Error();
      return node;
    }
    return {type:'doc',content:Array.from(value.content).map(node=>visit(node,1,'doc'))};
  }catch{return null;}
}
export function validateRichTextMentions(value:unknown):RichTextMention[] {
  if(!Array.isArray(value)||value.length>50)throw Error('The mention source must return at most 50 people.');const ids=new Set<string>();
  return Array.from(value).map(item=>{if(!plain(item)||!safeId(item.id)||ids.has(item.id)||typeof item.label!=='string'||!item.label.trim()||item.label.length>200||item.description!==undefined&&(typeof item.description!=='string'||item.description.length>500)||item.disabled!==undefined&&typeof item.disabled!=='boolean')throw Error('The mention source returned invalid or duplicate identities.');ids.add(item.id);return {id:item.id,label:item.label,description:item.description as string|undefined,disabled:item.disabled as boolean|undefined};});
}
const escape=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
/** The returned HTML consists only of validated tags and escaped text/attributes. */
export function richTextToHtml(value:RichTextDocument):string {
  const document=parseRichTextDocument(value);if(!document)throw Error('Unsupported rich-text document.');
  function render(node:RichTextNode):string {
    if(node.type==='text'){let text=escape(node.text!);for(const mark of node.marks??[]){if(mark.type==='link')text='<a href="'+escape(mark.attrs!.href)+'" rel="noopener noreferrer">'+text+'</a>';else{const tag={bold:'strong',italic:'em',strike:'s',code:'code'}[mark.type];text='<'+tag+'>'+text+'</'+tag+'>';}}return text;}
    if(node.type==='hardBreak')return '<br>';
    if(node.type==='mention')return '<span data-mention-id="'+escape(node.attrs!.id!)+'">@'+escape(node.attrs!.label!)+'</span>';
    const inside=(node.content??[]).map(render).join('');
    if(node.type==='codeBlock')return '<pre><code>'+inside+'</code></pre>';
    const tag=node.type==='heading'?'h'+node.attrs!.level:({paragraph:'p',bulletList:'ul',orderedList:'ol',listItem:'li'} as Record<string,string>)[node.type];
    return '<'+tag+(node.type==='orderedList'&&node.attrs?.start?' start="'+node.attrs.start+'"':'')+'>'+inside+'</'+tag+'>';
  }
  return document.content.map(render).join('');
}
export function richTextToText(value:RichTextDocument):string {
  const document=parseRichTextDocument(value);if(!document)throw Error('Unsupported rich-text document.');
  function render(node:RichTextNode):string {if(node.type==='text')return node.text!;if(node.type==='mention')return '@'+node.attrs!.label;if(node.type==='hardBreak')return '\n';const content=(node.content??[]).map(render).join(['bulletList','orderedList','listItem'].includes(node.type)?'\n':'');return content;}
  return document.content.map(render).join('\n\n');
}
