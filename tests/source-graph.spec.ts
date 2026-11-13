import {test,expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import {createSourceGraph} from '../scripts/source-graph.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
test('mixed public UI and blocks examples install their exact source modules and aliases',()=>{
 const graph=createSourceGraph(root),source="'use client';\nimport {Button,type DataColumn} from '@bld8/ui';\nimport {ResourceWorkspace as Workspace,type ResourceFilterField} from '@bld8/blocks';\nimport {createMemoryResourceDataSource} from '@bld8/blocks/resource-data-source';\nimport '@bld8/blocks/styles.css';\n";
 const installed=graph.rewriteUiImports(source,'../');expect(installed.source).not.toContain('@bld8/');expect(installed.source).toContain("from '../blocks/resource-workspace'");expect(installed.source).toContain('ResourceWorkspace as Workspace');expect(installed.source).toContain("import '../blocks/styles.css'");expect([...installed.blockModules].sort()).toEqual(['resource-data-source','resource-workspace','resource-workspace-state']);expect([...installed.modules].sort()).toEqual(['core','data-workspace-state']);
 const selected=graph.collect({blocks:[...installed.blockModules],ui:[...installed.modules]});expect(selected.selected.block.has('use-resource-workspace')).toBe(true);expect(selected.selected.ui.has('data-grid')).toBe(true);expect(selected.selected.ui.has('tree-select')).toBe(false);expect(selected.external.block.has('@bld8/ui')).toBe(false);
 expect(()=>graph.rewriteUiImports("import {ImaginaryControl} from '@bld8/blocks';")).toThrow('Unknown public block export');expect(()=>graph.rewriteUiImports("import all from '@bld8/blocks';")).toThrow('Use named imports');expect(()=>graph.rewriteUiImports("import '@bld8/blocks/../../secret';")).toThrow('Unsupported source module');
});
