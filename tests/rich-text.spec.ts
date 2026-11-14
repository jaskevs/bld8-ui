/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {parseRichTextDocument,richTextToHtml,richTextToText,isSafeRichTextLink,validateRichTextMentions,type RichTextDocument} from '../packages/ui/src/rich-text-state';
const document=(text:string):RichTextDocument=>({type:'doc',content:[{type:'paragraph',content:text?[{type:'text',text}]:undefined}]});
async function open(page:Page,family:string,id:string){await page.goto('/components/'+family+'/examples/'+id);const example=page.locator('[data-example-id='+id+']');await expect(example.locator('[data-example-ready]')).toBeVisible();return example;}

test('rich text schema clones bounded known nodes and refuses malformed or executable content',()=>{
  const original=document('Original');const clone=parseRichTextDocument(original)!;clone.content[0].content![0].text='Changed';expect(original.content[0].content![0].text).toBe('Original');
  for(const value of ['<p>Raw HTML</p>',{type:'doc',content:[{type:'image',attrs:{src:'javascript:alert(1)'}}]},{type:'doc',content:[{type:'heading',attrs:{level:9}}]},{type:'doc',content:[{type:'heading',attrs:{level:'2'}}]},{type:'doc',content:[{type:'bulletList'}]},document('x'.repeat(100001)),{type:'doc',content:Array.from({length:2001},()=>({type:'paragraph'}))}])expect(parseRichTextDocument(value)).toBeNull();
  const unsafe={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Link',marks:[{type:'link',attrs:{href:'javascript:alert(1)'}}]}]}]};expect(parseRichTextDocument(unsafe)).toBeNull();expect(()=>richTextToHtml(unsafe as RichTextDocument)).toThrow();
});

test('safe serialization escapes text and preserves only allowed hrefs and stable mention identities',()=>{
  const value:RichTextDocument={type:'doc',content:[{type:'heading',attrs:{level:2},content:[{type:'text',text:'A < B & C'}]},{type:'paragraph',content:[{type:'text',text:'Documentation',marks:[{type:'link',attrs:{href:'https://example.com/?a=1&b=2'}}]},{type:'mention',attrs:{id:'person-1',label:'<Maya>'}}]}]};
  expect(richTextToHtml(value)).toBe('<h2>A &lt; B &amp; C</h2><p><a href="https://example.com/?a=1&amp;b=2" rel="noopener noreferrer">Documentation</a><span data-mention-id="person-1">@&lt;Maya&gt;</span></p>');expect(richTextToText(value)).toBe('A < B & C\n\nDocumentation@<Maya>');
  for(const href of ['https://example.com','http://localhost:3000/docs','mailto:review@example.com','/docs','#section'])expect(isSafeRichTextLink(href)).toBe(true);
  for(const href of ['javascript:alert(1)','data:text/html,<script>','//evil.test','https://safe.test\\@evil.test',' https://safe.test','java\nscript:alert(1)','vbscript:msgbox(1)'])expect(isSafeRichTextLink(href)).toBe(false);
  expect(()=>validateRichTextMentions([{id:'same',label:'One'},{id:'same',label:'Two'}])).toThrow();expect(()=>validateRichTextMentions([{id:'__proto__',label:'One'}])).toThrow();
});

test('required rich text focuses the real editor and external form submits canonical readonly values',async({page})=>{
  const example=await open(page,'rich-text-editor','rich-text-review-form'),editor=example.getByRole('textbox',{name:'Review note',exact:true});await expect(editor).toHaveAttribute('contenteditable','true');await example.getByRole('button',{name:'Read note values',exact:true}).click();await expect(editor).toBeFocused();await expect(example.getByRole('alert')).toHaveText('Enter some text.');
  await editor.fill('A useful review.');await example.getByRole('button',{name:'Read note values',exact:true}).click();await expect(example.getByRole('status')).toHaveText('Note: A useful review. | Locked: Read-only reference. | Disabled: false');const json=parseRichTextDocument(await example.locator('input[name=note]').inputValue());expect(richTextToText(json!)).toBe('A useful review.');await expect(example.getByRole('textbox',{name:'Locked reference',exact:true})).toHaveAttribute('contenteditable','false');await expect(example.getByRole('textbox',{name:'Locked reference',exact:true})).toHaveAttribute('aria-readonly','true');const unavailable=example.getByRole('textbox',{name:'Unavailable reference',exact:true});await expect(unavailable).toHaveAttribute('aria-disabled','true');await expect(unavailable).toHaveAttribute('tabindex','-1');
});

test('native reset and prevented reset preserve editor ownership and reset local history',async({page})=>{
  const pageErrors:string[]=[];page.on('pageerror',error=>pageErrors.push(error.message));
  const example=await open(page,'rich-text-editor','rich-text-review-form'),editor=example.getByRole('textbox',{name:'Review note',exact:true});await editor.fill('Keep this draft.');await example.getByRole('checkbox',{name:'Prevent note reset',exact:true}).check();await example.getByRole('button',{name:'Reset note',exact:true}).click();await expect(editor).toHaveText('Keep this draft.');await example.getByRole('checkbox',{name:'Prevent note reset',exact:true}).uncheck();await example.getByRole('button',{name:'Reset note',exact:true}).click();await expect(editor).toHaveText('');await expect(example.locator('.bui-rich-toolbar').first().getByRole('button',{name:'Undo',exact:true})).toBeDisabled();for(const draft of ['Second reset draft.','Third reset draft.']){await editor.fill(draft);await example.getByRole('button',{name:'Reset note',exact:true}).click();await expect(editor).toHaveText('');await expect(editor).toHaveAttribute('contenteditable','true');await expect(example.locator('.bui-rich-toolbar').first().getByRole('button',{name:'Undo',exact:true})).toBeDisabled();}expect(pageErrors).toEqual([]);
});

test('controlled JSON echoes retain middle-of-text selection and a replacement starts separate history',async({page})=>{
  const example=await open(page,'rich-text-editor','rich-text-controlled-document'),editor=example.getByRole('textbox',{name:'Controlled note',exact:true});await editor.focus();await editor.press('Home');await editor.press('ArrowRight');await page.keyboard.type('12');await expect(editor).toHaveText('K12eep the useful details together.');await page.keyboard.type('3');await expect(editor).toHaveText('K123eep the useful details together.');await example.getByRole('button',{name:'Replace document',exact:true}).click();await expect(editor).toHaveText('A separate review.');await expect(example.getByRole('toolbar',{name:'Text formatting',exact:true}).getByRole('button',{name:'Undo',exact:true})).toBeDisabled();await example.getByRole('checkbox',{name:'Read-only note',exact:true}).check();await expect(editor).toHaveAttribute('contenteditable','false');
});

test('formatting, history and safe link editing preserve the document selection',async({page})=>{
  const example=await open(page,'rich-text-editor','rich-text-controlled-document'),editor=example.getByRole('textbox',{name:'Controlled note',exact:true}),toolbar=example.getByRole('toolbar',{name:'Text formatting',exact:true});await editor.focus();await editor.press('ControlOrMeta+A');await toolbar.getByRole('button',{name:'Bold',exact:true}).click();await expect(editor.locator('strong')).toHaveText('Keep the useful details together.');await toolbar.getByRole('button',{name:'Undo',exact:true}).click();await expect(editor.locator('strong')).toHaveCount(0);await toolbar.getByRole('button',{name:'Redo',exact:true}).click();await expect(editor.locator('strong')).toHaveCount(1);
  await toolbar.getByRole('button',{name:'Edit link',exact:true}).click();const popup=page.getByRole('dialog',{name:'Edit link',exact:true});await popup.getByRole('textbox',{name:'Link address',exact:true}).fill('javascript:alert(1)');await popup.getByRole('button',{name:'Apply',exact:true}).click();await expect(popup.getByRole('alert')).toContainText('Use an http');await expect(editor.locator('a')).toHaveCount(0);await popup.getByRole('textbox',{name:'Link address',exact:true}).fill('https://example.com/docs');await popup.getByRole('button',{name:'Apply',exact:true}).click();await expect(popup).toBeHidden();await expect(editor.locator('a')).toHaveAttribute('href','https://example.com/docs');
});

test('clipboard HTML never becomes executable or unexpected editor markup',async({page})=>{
  const example=await open(page,'rich-text-editor','rich-text-review-form'),editor=example.getByRole('textbox',{name:'Review note',exact:true});await editor.focus();await editor.evaluate(element=>{const clipboard=new DataTransfer();clipboard.setData('text/html','<img src=x onerror="window.__richExecuted=true"><script>window.__richExecuted=true</script>');clipboard.setData('text/plain','Pasted <b>text</b>');element.dispatchEvent(new ClipboardEvent('paste',{clipboardData:clipboard,bubbles:true,cancelable:true}));});await expect(editor).toHaveText('Pasted <b>text</b>');await expect(editor.locator('img,script,b')).toHaveCount(0);expect(await page.evaluate(()=>(window as unknown as {__richExecuted?:boolean}).__richExecuted)).toBeUndefined();
});

test('async mentions retry without draft loss and submit stable IDs instead of display labels',async({page})=>{
  const example=await open(page,'mentions','mentions-async-directory'),editor=example.getByRole('textbox',{name:'Comment with people',exact:true});await example.getByRole('checkbox',{name:'Fail next directory lookup',exact:true}).check();await editor.fill('@ma');await expect(page.locator('.bui-rich-mention-error').getByRole('alert')).toHaveText('Directory unavailable. Try again.');await expect(editor).toBeFocused();await expect(editor).toHaveText('@ma');await editor.press('Enter');await expect(page.getByRole('option',{name:/Maya Chen/})).toBeVisible();await editor.press('Enter');await expect(editor.locator('[data-type=mention]')).toHaveAttribute('data-id','person-maya');await example.getByRole('button',{name:'Read comment values',exact:true}).click();await expect(example.getByRole('status')).toContainText('"id":"person-maya"');
});

test('late ignored-abort mention responses cannot replace a newer query or selection',async({page})=>{
  const example=await open(page,'mentions','mentions-async-directory'),editor=example.getByRole('textbox',{name:'Comment with people',exact:true});await example.getByRole('checkbox',{name:'Ignore cancellation for slow ol lookup',exact:true}).check();await editor.fill('@ol');await expect(example.locator('[data-mention-request]')).toHaveText('Latest query: ol');await editor.fill('@ma');await expect(page.getByRole('option',{name:/Maya Chen/})).toBeVisible();await expect(example.locator('[data-mention-settled]')).toHaveText('Latest completed query: ol');await expect(page.getByRole('option',{name:/Oliver Reed/})).toHaveCount(0);await editor.press('Enter');await expect(editor.locator('[data-type=mention]')).toHaveAttribute('data-id','person-maya');
});

for(const width of [320,390])test('editor and RTL mention interfaces remain accessible and contained at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:1000});for(const [family,id] of [['rich-text-editor','rich-text-review-form'],['rich-text-editor','rich-text-scoped-arabic']] as const){const example=await open(page,family,id);await expect(example.getByRole('textbox',{name:id.includes('arabic')?'ملاحظة المراجعة':'Review note',exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const result=await new AxeBuilder({page}).include('[data-example-id='+id+']').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations).toEqual([]);}
});

test('document identity resets uncontrolled defaults and history without carrying the previous record',async({page})=>{
 const example=await open(page,'rich-text-editor','rich-text-document-boundaries'),editor=example.getByRole('textbox',{name:'Uncontrolled record',exact:true});await expect(editor).toHaveText('Private document A.');await editor.fill('An unsaved private draft.');await example.getByRole('button',{name:'Open second uncontrolled document',exact:true}).click();await expect(editor).toHaveText('Document B starts here.');await expect(example.locator('.bui-rich-toolbar').first().getByRole('button',{name:'Undo',exact:true})).toBeDisabled();await editor.fill('A second record draft.');await example.getByRole('button',{name:'Reset boundary documents',exact:true}).click();await expect(editor).toHaveText('Document B starts here.');expect(await example.locator('input[name=record]').inputValue()).not.toContain('Private document A.');
});
test('rejected controlled updates restore accepted content and a new invalid document cannot reveal its predecessor',async({page})=>{
 const example=await open(page,'rich-text-editor','rich-text-document-boundaries'),editor=example.getByRole('textbox',{name:'Controlled boundary note',exact:true});await editor.fill('This controlled edit is rejected.');await expect(example.locator('[data-rejected-attempts]')).not.toHaveText('Edit attempts: 0');await expect(editor).toHaveText('Private document A.');expect(await example.locator('input[name=controlled]').inputValue()).not.toContain('rejected');await example.getByRole('button',{name:'Open unsupported controlled document',exact:true}).click();await expect(editor).toHaveText('');await expect(example.getByRole('alert')).toHaveText('The supplied document is unsupported.');expect(await example.locator('input[name=controlled]').inputValue()).not.toContain('Private document A.');await example.getByRole('button',{name:'Open second controlled document',exact:true}).click();await expect(editor).toHaveText('Document B starts here.');await expect(example.locator('.bui-rich-toolbar').nth(1).getByRole('button',{name:'Undo',exact:true})).toBeDisabled();
});

test('touch rich text retains readable editing without restricting native zoom',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  try{const page=await context.newPage(),example=await open(page,'rich-text-editor','rich-text-review-form'),editor=example.getByRole('textbox',{name:'Review note',exact:true});
    expect(await editor.evaluate(node=>parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
    await editor.fill('Readable on a touch screen.');await expect(editor).toBeFocused();
    expect(await editor.evaluate(node=>parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
    const viewport=await page.locator('meta[name=viewport]').getAttribute('content');expect(viewport).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:[,.]|$)/i);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }finally{await context.close();}
});
