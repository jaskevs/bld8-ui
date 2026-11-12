'use client';
import {TreeSelect,type TreeSelectNode} from '@bld8/ui';
const nodes:readonly TreeSelectNode[]=[{id:'interface',label:'Interface',children:[{id:'components',label:'Components'},{id:'motion',label:'Motion'},{id:'keyboard',label:'Keyboard behaviour'}]},{id:'platform',label:'Platform',children:[{id:'forms',label:'Forms'},{id:'data',label:'Data contracts'}]}];
export function TreeSelectDemo(){return <TreeSelect label="Component topics" nodes={nodes} defaultValue={['components']} defaultExpandedIds={['interface']} hint="Choose a branch or its individual topics."/>;}
