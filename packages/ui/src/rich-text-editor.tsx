/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useCallback,useEffect,useId,useLayoutEffect,useMemo,useRef,useState,type Ref} from 'react';
import {useEditor,useEditorState,EditorContent,type Editor,type JSONContent,type Range} from '@tiptap/react';
import {BubbleMenu} from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import {exitSuggestion,type SuggestionProps} from '@tiptap/suggestion';
import {PluginKey,TextSelection} from '@tiptap/pm/state';
import {Popover as PrimitivePopover} from '@base-ui/react/popover';
import {Bold,Italic,Strikethrough,Code2,Link2,Undo2,Redo2,List,ListOrdered,AtSign,Check} from 'lucide-react';
import {Button,Field,Icon,IconButton,Input,cx} from './core.js';
import {Toolbar,ToolbarButton,ToolbarGroup,ToolbarSeparator} from './toolbar.js';
import {Select} from './controls.js';
import {Popover} from './overlays.js';
import {UIPortal,useUIConfig} from './ui-config.js';
import {EMPTY_RICH_TEXT_DOCUMENT,isSafeRichTextLink,parseRichTextDocument,richTextToText,validateRichTextMentions,type RichTextDocument,type RichTextMention,type RichTextMentionSource} from './rich-text-state.js';
export type {RichTextDocument,RichTextNode,RichTextMark,RichTextMention,RichTextMentionRequest,RichTextMentionSource} from './rich-text-state.js';
export {EMPTY_RICH_TEXT_DOCUMENT,isSafeRichTextLink,parseRichTextDocument,richTextToHtml,richTextToText} from './rich-text-state.js';

export interface RichTextEditorProps {
  label:string;value?:RichTextDocument;defaultValue?:RichTextDocument;onValueChange?:(value:RichTextDocument)=>void;
  name?:string;form?:string;required?:boolean;disabled?:boolean;readOnly?:boolean;hint?:string;error?:string;placeholder?:string;
  /** Plain-text character limit, from 1 to 100,000. Structured documents are additionally bounded. */
  maxLength?:number;inputRef?:Ref<HTMLDivElement>;onBlur?:()=>void;
  /** Changes establish a new document/history boundary. Controlled value echoes preserve selection. */
  documentKey?:string;toolbar?:'full'|'compact'|'none';contextToolbar?:boolean;className?:string;
  mentionSource?:RichTextMentionSource;mentionSourceKey?:string;mentionDebounceMs?:number;
}
interface ActiveMention {query:string;range:Range;rect:()=>DOMRect|null;command:(item:RichTextMention)=>void}
interface MentionResults {owner:RichTextMentionSource|undefined;sourceKey:string;query:string;from:number;epoch:number;phase:'loading'|'ready'|'error';items:RichTextMention[];error:string}
const assign=<T,>(ref:Ref<T>|undefined,node:T|null)=>{if(typeof ref==='function')ref(node);else if(ref)ref.current=node;};
const keyOf=(document:RichTextDocument)=>JSON.stringify(document);
const textOf=(document:RichTextDocument)=>richTextToText(document);

/** Structured editing with a bounded schema; no raw HTML is accepted or inserted. */
export function RichTextEditor({label,value,defaultValue=EMPTY_RICH_TEXT_DOCUMENT,onValueChange,name,form,required=false,disabled=false,readOnly=false,hint,error,placeholder,maxLength=20000,inputRef,onBlur,
  documentKey='',toolbar='full',contextToolbar=true,className,mentionSource,mentionSourceKey='',mentionDebounceMs=150}:RichTextEditorProps){
  return <RichTextEditorResetBoundary key={documentKey} {...{label,value,defaultValue,onValueChange,name,form,required,disabled,readOnly,hint,error,placeholder,maxLength,inputRef,onBlur,documentKey,toolbar,contextToolbar,className,mentionSource,mentionSourceKey,mentionDebounceMs}}/>;
}
/** A native reset owns a complete editor lifetime, including history and menu plugins. */
function RichTextEditorResetBoundary(props:RichTextEditorProps){
  const [resetEpoch,setResetEpoch]=useState(0),initial=useRef(parseRichTextDocument(props.defaultValue??EMPTY_RICH_TEXT_DOCUMENT)??parseRichTextDocument(EMPTY_RICH_TEXT_DOCUMENT)!);
  const reset=useCallback(()=>setResetEpoch(value=>value+1),[]);
  return <RichTextEditorInstance key={resetEpoch} {...props} defaultValue={initial.current} onNativeReset={reset}/>;
}
/** Each document identity owns its defaults, accepted content, requests and undo history. */
function RichTextEditorInstance({onNativeReset,label,value,defaultValue=EMPTY_RICH_TEXT_DOCUMENT,onValueChange,name,form,required=false,disabled=false,readOnly=false,hint,error,placeholder,maxLength=20000,inputRef,onBlur,
  documentKey='',toolbar='full',contextToolbar=true,className,mentionSource,mentionSourceKey='',mentionDebounceMs=150}:RichTextEditorProps&{onNativeReset:()=>void}){
  const ui=useUIConfig(),m=ui.message,id=useId(),owner=useRef<HTMLDivElement>(null),proxy=useRef<HTMLInputElement>(null),initial=useRef(parseRichTextDocument(defaultValue)??parseRichTextDocument(EMPTY_RICH_TEXT_DOCUMENT)!);
  const [internal,setInternal]=useState(initial.current),[controlledRevision,setControlledRevision]=useState(0),[localError,setLocalError]=useState(''),[touched,setTouched]=useState(false),[active,setActive]=useState<ActiveMention|null>(null),[retry,setRetry]=useState(0),[highlight,setHighlight]=useState(0),[linkOpen,setLinkOpen]=useState(false),[link,setLink]=useState(''),[linkError,setLinkError]=useState('');
  const lastValid=useRef(initial.current),selected=parseRichTextDocument(value===undefined?internal:value);if(selected)lastValid.current=selected;const accepted=selected??lastValid.current,key=keyOf(accepted),plain=textOf(accepted),limit=Number.isInteger(maxLength)&&maxLength>0&&maxLength<=100000?maxLength:20000;
  const live=useRef({value,accepted,onValueChange,disabled,readOnly,limit,mentionSource,onBlur});live.current={value,accepted,onValueChange,disabled,readOnly,limit,mentionSource,onBlur};
  const request=useRef<AbortController|null>(null),requestId=useRef(0),mentionKey=useMemo(()=>new PluginKey('bui-rich-mention-'+id),[id]),keyboard=useRef<(event:KeyboardEvent)=>boolean>(()=>false),activeRef=useRef(active);activeRef.current=active;
  const [results,setResults]=useState<MentionResults>({owner:undefined,sourceKey:'',query:'',from:0,epoch:0,phase:'loading',items:[],error:''});
  function closeMentions(){request.current?.abort();requestId.current++;setActive(null);}
  const extensions=useMemo(()=>[
    StarterKit.configure({heading:{levels:[1,2,3]},blockquote:false,horizontalRule:false,underline:false,trailingNode:false,link:{openOnClick:false,autolink:false,linkOnPaste:false,isAllowedUri:isSafeRichTextLink,HTMLAttributes:{rel:'noopener noreferrer',target:null}}}),
    Mention.configure({HTMLAttributes:{class:'bui-rich-mention'},renderText:({node})=>'@'+(node.attrs.label??node.attrs.id),renderHTML:({node})=>['span',{'data-type':'mention','data-id':String(node.attrs.id??''),class:'bui-rich-mention'},'@'+String(node.attrs.label??node.attrs.id??'')],suggestion:{pluginKey:mentionKey,char:'@',allowSpaces:false,items:()=>[],allow:({editor})=>!!live.current.mentionSource&&!live.current.disabled&&!live.current.readOnly&&!editor.isActive('codeBlock')&&!editor.isActive('code'),render:()=>{
      const update=(props:SuggestionProps)=>{setActive({query:props.query,range:props.range,rect:()=>props.clientRect?.()??null,command:item=>props.command({id:item.id,label:item.label})});};
      return {onStart:update,onUpdate:update,onExit:closeMentions,onKeyDown:({event})=>keyboard.current(event)};
    }}}),
  ],[mentionKey]);
  const message=!selected?m('rich.unsupported','The supplied document is unsupported.'):localError||(plain.length>limit?m('rich.tooLong','Use at most {count} characters.',{count:limit}):'')||((required&&!plain.trim())?m('rich.required','Enter some text.'):'');
  const feedback=error||((touched||!selected||localError)?message:''),description=[hint&&id+'-hint',feedback&&id+'-error',id+'-keys'].filter(Boolean).join(' ');
  const contentAttributes={id:id+'-input',role:'textbox','aria-multiline':'true','aria-labelledby':id+'-label','aria-describedby':description,'aria-invalid':feedback?'true':'false','aria-readonly':readOnly?'true':'false','aria-disabled':disabled?'true':'false','aria-required':required?'true':'false',class:'bui-rich-content',tabindex:disabled?'-1':'0',dir:ui.direction,lang:ui.locale,'aria-placeholder':placeholder??m('rich.placeholder','Write something useful…'),'data-placeholder':placeholder??m('rich.placeholder','Write something useful…'),'aria-autocomplete':mentionSource?'list':'none',...(active?{'aria-controls':id+'-mentions',...(results.query===active.query&&results.from===active.range.from&&results.owner===mentionSource&&results.sourceKey===mentionSourceKey&&results.phase==='ready'&&results.items[highlight]?{'aria-activedescendant':id+'-mention-'+highlight}:{})}:{})};
  const editor=useEditor({extensions,content:accepted as JSONContent,immediatelyRender:false,shouldRerenderOnTransaction:false,editable:!disabled&&!readOnly,injectCSS:false,
    editorProps:{attributes:state=>({...contentAttributes,'data-empty':state.doc.content.size===2?'true':'false'}),
      handlePaste:(view,event)=>{if(live.current.disabled||live.current.readOnly)return true;event.preventDefault();const text=event.clipboardData?.getData('text/plain')??'';if(text){const clean=text.replace(/\r\n?/g,'\n');if(clean.length>live.current.limit){setLocalError(m('rich.tooLong','Use at most {count} characters.',{count:live.current.limit}));return true;}view.dispatch(view.state.tr.insertText(clean));}return true;},
      handleDrop:(_view,event)=>{event.preventDefault();return true;},
      handleDOMEvents:{blur:()=>{live.current.onBlur?.();return false;}},
    },
    onUpdate:({editor})=>{const next=parseRichTextDocument(editor.getJSON());if(!next){setLocalError(m('rich.invalidDocument','This document exceeds the supported structure. Undo to recover.'));return;}if(textOf(next).length>live.current.limit){setLocalError(m('rich.tooLong','Use at most {count} characters.',{count:live.current.limit}));return;}setLocalError('');if(live.current.value===undefined)setInternal(next);live.current.onValueChange?.(next);if(live.current.value!==undefined)setControlledRevision(value=>value+1);},
  },[]);
  const state=useEditorState({editor,selector:({editor})=>editor?{bold:editor.isActive('bold'),italic:editor.isActive('italic'),strike:editor.isActive('strike'),bullet:editor.isActive('bulletList'),ordered:editor.isActive('orderedList'),code:editor.isActive('codeBlock'),heading:editor.isActive('heading')?String(editor.getAttributes('heading').level):'paragraph',undo:editor.can().undo(),redo:editor.can().redo()}:null});
  useLayoutEffect(()=>{if(editor&&!editor.isDestroyed&&editor.isEditable!==(!disabled&&!readOnly))editor.setEditable(!disabled&&!readOnly);},[editor,disabled,readOnly]);
  useLayoutEffect(()=>{if(!editor||editor.isDestroyed||!selected)return;const current=parseRichTextDocument(editor.getJSON());if(current&&keyOf(current)===key)return;const selection=editor.state.selection;editor.commands.setContent(accepted as JSONContent,{emitUpdate:false});const size=editor.state.doc.content.size;try{editor.view.dispatch(editor.state.tr.setSelection(TextSelection.near(editor.state.doc.resolve(Math.min(selection.from,size)))));}catch{}closeMentions();},[editor,key,controlledRevision]);
  useLayoutEffect(()=>{if(!editor)return;assign(inputRef,editor.view.dom as HTMLDivElement);return()=>assign(inputRef,null);},[editor,inputRef]);
  useLayoutEffect(()=>{proxy.current?.setCustomValidity(disabled||readOnly?'':message);},[message,disabled,readOnly]);
  useEffect(()=>{if(disabled||readOnly){if(editor)exitSuggestion(editor.view,mentionKey);closeMentions();setLinkOpen(false);}},[disabled,readOnly,editor,mentionKey]);
  useEffect(()=>{const root=owner.current,native=proxy.current,associated=form?root?.ownerDocument.getElementById(form):null,target=associated?.tagName==='FORM'?associated as HTMLFormElement:native?.form??root?.closest('form');if(!target)return;const timers=new Set<ReturnType<typeof setTimeout>>();
    const reset=(event:Event)=>{const timer=setTimeout(()=>{timers.delete(timer);if(event.defaultPrevented)return;onNativeReset();},0);timers.add(timer);};target.addEventListener('reset',reset);return()=>{target.removeEventListener('reset',reset);for(const timer of timers)clearTimeout(timer);};},[form,onNativeReset]);
  useEffect(()=>{closeMentions();setLinkOpen(false);},[documentKey]);
  useEffect(()=>()=>{request.current?.abort();requestId.current++;},[]);
  useEffect(()=>{
    const controller=new AbortController(),serial=++requestId.current;request.current?.abort();request.current=controller;
    if(!active||!mentionSource||disabled||readOnly)return()=>controller.abort();
    const token={owner:mentionSource,sourceKey:mentionSourceKey,query:active.query,from:active.range.from,epoch:retry};setResults({...token,phase:'loading',items:[],error:''});setHighlight(0);
    const timer=setTimeout(async()=>{try{if(active.query.length>100)throw Error(m('rich.mentionQuery','Use a shorter mention search.'));const items=validateRichTextMentions(await mentionSource({query:active.query,signal:controller.signal}));if(controller.signal.aborted||serial!==requestId.current)return;setResults({...token,phase:'ready',items,error:''});setHighlight(Math.max(0,items.findIndex(item=>!item.disabled)));}catch(cause){if(!controller.signal.aborted&&serial===requestId.current)setResults({...token,phase:'error',items:[],error:cause instanceof Error?cause.message:m('rich.mentionFailed','People could not be loaded.')});}},Math.max(0,Math.min(1000,mentionDebounceMs)));
    return()=>{controller.abort();clearTimeout(timer);};
  },[active?.query,active?.range.from,mentionSource,mentionSourceKey,retry,disabled,readOnly,mentionDebounceMs]);
  const currentResults=!!active&&results.owner===mentionSource&&results.sourceKey===mentionSourceKey&&results.query===active.query&&results.from===active.range.from&&results.epoch===retry;
  const phase=currentResults?results.phase:'loading',items=currentResults?results.items:[];
  function selectMention(item:RichTextMention){if(item.disabled||!activeRef.current||disabled||readOnly)return;activeRef.current.command(item);closeMentions();}
  keyboard.current=event=>{if(!activeRef.current||event.isComposing)return false;if(event.key==='Escape'||event.key==='Tab'){if(editor)exitSuggestion(editor.view,mentionKey);closeMentions();return event.key==='Escape';}if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){const enabled=items.map((item,index)=>!item.disabled?index:-1).filter(index=>index>=0);if(enabled.length){const index=enabled.indexOf(highlight),next=event.key==='Home'?enabled[0]:event.key==='End'?enabled[enabled.length-1]:enabled[(index+(event.key==='ArrowUp'?-1:1)+enabled.length)%enabled.length];setHighlight(next);}return true;}if(event.key==='Enter'){if(phase==='error')setRetry(value=>value+1);else if(items[highlight])selectMention(items[highlight]);return true;}return false;};
  useEffect(()=>{if(!active||!editor)return;const document=editor.view.dom.ownerDocument;const outside=(event:PointerEvent)=>{if(!owner.current?.contains(event.target as Node)&&!(event.target as Element)?.closest?.('[data-rich-owner="'+CSS.escape(id)+'"]')){exitSuggestion(editor.view,mentionKey);closeMentions();}};document.addEventListener('pointerdown',outside,true);return()=>document.removeEventListener('pointerdown',outside,true);},[active,editor,id,mentionKey]);
  useEffect(()=>{if(active&&phase==='ready')owner.current?.ownerDocument.getElementById(id+'-mention-'+highlight)?.scrollIntoView({block:'nearest',inline:'nearest'});},[active,phase,highlight,id]);
  const locked=disabled||readOnly||!editor;
  function command(run:(editor:Editor)=>void){if(editor&&!locked)run(editor);}
  function tool(text:string,icon:typeof Bold,pressed:boolean|undefined,run:(editor:Editor)=>void,unavailable=false){return <ToolbarButton key={text} disabled={locked||unavailable} focusableWhenDisabled={false} render={<IconButton label={text} icon={icon} size="sm" variant="ghost" aria-pressed={pressed} onMouseDown={event=>event.preventDefault()}/>} onClick={()=>command(run)}/>;}
  function applyLink(){if(!editor||locked)return;if(link&&!isSafeRichTextLink(link)){setLinkError(m('rich.safeLink','Use an http, https, mailto, /path or #anchor link.'));return;}if(link)editor.chain().focus().extendMarkRange('link').setLink({href:link}).run();else editor.chain().focus().extendMarkRange('link').unsetLink().run();setLinkOpen(false);setLinkError('');}
  const marks=(compact=false)=><ToolbarGroup>{tool(m('rich.bold','Bold'),Bold,state?.bold,editor=>editor.chain().focus().toggleBold().run())}{tool(m('rich.italic','Italic'),Italic,state?.italic,editor=>editor.chain().focus().toggleItalic().run())}{!compact&&tool(m('rich.strike','Strikethrough'),Strikethrough,state?.strike,editor=>editor.chain().focus().toggleStrike().run())}</ToolbarGroup>;
  return <div ref={owner} className={cx('bui-field bui-rich-field',className)} data-disabled={disabled||undefined} data-readonly={readOnly||undefined}>
    <label id={id+'-label'} htmlFor={id+'-input'} className="bui-label">{label}{required&&<span aria-hidden="true"> *</span>}</label>
    <div className="bui-rich-editor" data-invalid={!!feedback||undefined}>
      {toolbar!=='none'&&<Toolbar label={m('rich.formatting','Text formatting')} className="bui-rich-toolbar" disabled={locked}>
        {toolbar==='full'&&<Select label={m('rich.block','Text style')} labelVisibility="hidden" density="compact" disabled={locked} value={state?.heading??'paragraph'} onValueChange={value=>command(editor=>{if(value==='paragraph')editor.chain().focus().setParagraph().run();else if(value)editor.chain().focus().toggleHeading({level:Number(value) as 1|2|3}).run();})} options={[{value:'paragraph',label:m('rich.paragraph','Paragraph')},{value:'1',label:m('rich.heading1','Heading 1')},{value:'2',label:m('rich.heading2','Heading 2')},{value:'3',label:m('rich.heading3','Heading 3')}]}/>}
        {marks(toolbar==='compact')}
        {toolbar==='full'&&<><ToolbarSeparator/>{tool(m('rich.bullets','Bullet list'),List,state?.bullet,editor=>editor.chain().focus().toggleBulletList().run())}{tool(m('rich.ordered','Numbered list'),ListOrdered,state?.ordered,editor=>editor.chain().focus().toggleOrderedList().run())}{tool(m('rich.codeBlock','Code block'),Code2,state?.code,editor=>editor.chain().focus().toggleCodeBlock().run())}</>}
        <Popover title={m('rich.editLink','Edit link')} open={linkOpen} onOpenChange={open=>{setLinkOpen(open);if(open){setLink(String(editor?.getAttributes('link').href??''));setLinkError('');}}} trigger={<ToolbarButton disabled={locked} focusableWhenDisabled={false} render={<IconButton label={m('rich.editLink','Edit link')} icon={Link2} variant="ghost" size="sm"/>}/> }>
          <form noValidate className="bui-rich-link-form" onSubmit={event=>{event.preventDefault();applyLink();}}><Field label={m('rich.linkAddress','Link address')} error={linkError}><Input value={link} maxLength={2048} inputMode="url" autoComplete="url" onChange={event=>setLink(event.target.value)}/></Field><div className="bui-rich-link-actions"><Button size="sm" variant="ghost" onClick={()=>setLinkOpen(false)}>{m('cancel','Cancel')}</Button><Button size="sm" type="submit">{m('apply','Apply')}</Button></div></form>
        </Popover><ToolbarSeparator/>{tool(m('rich.undo','Undo'),Undo2,undefined,editor=>editor.chain().focus().undo().run(),!state?.undo)}{tool(m('rich.redo','Redo'),Redo2,undefined,editor=>editor.chain().focus().redo().run(),!state?.redo)}
        {mentionSource&&tool(m('rich.mention','Mention a person'),AtSign,undefined,editor=>editor.chain().focus().insertContent('@').run())}
      </Toolbar>}
      <EditorContent editor={editor} className="bui-rich-content-frame"/>
      {!editor&&<p className="bui-hint bui-rich-loading" role="status">{m('rich.loading','Preparing editor…')}</p>}
      {editor&&contextToolbar&&!locked&&<BubbleMenu editor={editor} pluginKey={'bui-rich-bubble-'+id} appendTo={()=>owner.current??editor.view.dom.parentElement!} options={{placement:'top',offset:8}} shouldShow={({state})=>!state.selection.empty&&!active&&!linkOpen&&!editor.isActive('codeBlock')} className="bui-rich-bubble"><Toolbar label={m('rich.selectionFormatting','Selection formatting')} className="bui-rich-context-toolbar">{marks(true)}</Toolbar></BubbleMenu>}
    </div>
    <span id={id+'-keys'} className="bui-sr-only">{m('rich.keys','Use standard text editing shortcuts. Tab moves to the next control. Type @ to mention a person; arrows choose, Enter inserts, Escape closes.')}</span>
    <input ref={proxy} type="text" className="bui-sr-only" tabIndex={-1} aria-hidden="true" value={plain} readOnly={readOnly} required={required} disabled={disabled} form={form} onChange={()=>{}} onInvalid={event=>{event.preventDefault();setTouched(true);editor?.commands.focus();}}/>
    {name&&<input type="hidden" name={name} form={form} value={key} disabled={disabled}/>}
    {hint&&<p id={id+'-hint'} className="bui-hint">{hint}</p>}{feedback&&<p id={id+'-error'} className="bui-error" role="alert">{feedback}</p>}
    {active&&editor&&<PrimitivePopover.Root open modal={false}><UIPortal render={PrimitivePopover.Portal}><PrimitivePopover.Positioner className="bui-positioner" anchor={{getBoundingClientRect:()=>active.rect()??editor.view.dom.getBoundingClientRect()}} align="start" sideOffset={6} collisionPadding={12} render={props=><div {...props}><div className="bui-popup bui-rich-mentions-popup" data-rich-owner={id}>
      <div id={id+'-mentions'} role="listbox" aria-label={m('rich.people','People to mention')} aria-busy={phase==='loading'||undefined} className="bui-rich-mention-options">
        {phase==='ready'&&items.length?items.map((item,index)=><div key={item.id} id={id+'-mention-'+index} role="option" aria-selected={index===highlight} aria-disabled={item.disabled||undefined} className="bui-option bui-rich-mention-option" onPointerMove={()=>{if(!item.disabled)setHighlight(index);}} onMouseDown={event=>event.preventDefault()} onClick={()=>selectMention(item)}><span className="bui-rich-avatar" aria-hidden="true">{item.label.slice(0,1)}</span><span><span>{item.label}</span>{item.description&&<small>{item.description}</small>}</span>{index===highlight&&<Icon icon={Check} size={15}/>}</div>):<div role="option" aria-disabled="true" className="bui-rich-mention-empty">{phase==='loading'?m('rich.loadingPeople','Finding people…'):phase==='error'?m('rich.peopleUnavailable','People unavailable'):m('rich.noPeople','No matching people.')}</div>}
      </div>{phase==='error'&&<div className="bui-rich-mention-error"><p role="alert">{results.error}</p><Button size="sm" variant="secondary" tabIndex={-1} onMouseDown={event=>event.preventDefault()} onClick={()=>setRetry(value=>value+1)}>{m('rich.retry','Retry search')}</Button><span className="bui-sr-only">{m('rich.retryKeys','Press Enter in the editor to retry.')}</span></div>}
    </div></div>}/></UIPortal></PrimitivePopover.Root>}
  </div>;
}
export interface MentionsProps extends Omit<RichTextEditorProps,'toolbar'|'mentionSource'> {mentionSource:RichTextMentionSource}
/** A compact composition for comments containing stable-ID mentions. No notification is sent. */
export function Mentions(props:MentionsProps){return <RichTextEditor {...props} toolbar="compact"/>;}
