import {test,expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import {createSourceGraph} from '../scripts/source-graph.mjs';
test('optional editor, phone metadata and recurrence dependencies stay outside ordinary button installations',()=>{
 const root=fileURLToPath(new URL('../',import.meta.url)),graph=createSourceGraph(root),button=graph.collect({ui:['core']}),names=[...button.external.ui];expect(names.some(name=>name.startsWith('@tiptap/')||name==='libphonenumber-js'||name==='@js-temporal/polyfill')).toBe(false);
 const editor=graph.collect({ui:['rich-text-editor']}),phone=graph.collect({ui:['phone-input']}),recurrence=graph.collect({ui:['recurrence-state']});expect(editor.external.ui.has('@tiptap/react')).toBe(true);expect(phone.external.ui.has('libphonenumber-js')).toBe(true);expect(recurrence.external.ui.has('@js-temporal/polyfill')).toBe(true);expect([...recurrence.selected.ui.keys()]).toEqual(['recurrence-state']);
});
