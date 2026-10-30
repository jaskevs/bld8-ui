'use client';
import {useState} from 'react';
import {FileCode2,FileText,Folder} from 'lucide-react';
import {Button,Tree,type TreeNode} from '@bld8/ui';

const example:readonly TreeNode[]=[
  {id:'src',label:'src',icon:Folder,children:[
    {id:'components',label:'components',icon:Folder,children:[
      {id:'button',label:'button.tsx',icon:FileCode2},
      {id:'dialog',label:'dialog.tsx',icon:FileCode2},
    ]},
    {id:'app',label:'app.tsx',icon:FileCode2},
    {id:'styles',label:'styles.css',icon:FileText},
  ]},
  {id:'readme',label:'README.md',icon:FileText},
  {id:'private',label:'Private notes',icon:Folder,disabled:true},
];
const find=(nodes:readonly TreeNode[],id:string|null):TreeNode|undefined=>{
  for(const node of nodes){if(node.id===id)return node;const child=node.children&&find(node.children,id);if(child)return child;}
};
const remove=(nodes:readonly TreeNode[],id:string):TreeNode[]=>nodes.filter(node=>node.id!==id).map(node=>({...node,...(node.children?{children:remove(node.children,id)}:{})}));
export function TreeDemo(){
  const[nodes,setNodes]=useState(example),[expanded,setExpanded]=useState<string[]>(['src']),[selected,setSelected]=useState<string|null>('readme'),[activation,setActivation]=useState('');
  const chosen=find(nodes,selected);
  return <div className="stack tree-example">
    <div><h2 className="tree-example-title">A place for the details.</h2><p className="bui-hint">Arrow keys move focus. Space selects; Enter activates. Right and Left open and close folders.</p></div>
    <Tree label="Project files" nodes={nodes} expandedIds={expanded} onExpandedChange={setExpanded} selectedId={selected} onSelectedChange={setSelected} onActivate={node=>setActivation(node.label+' activated.')} />
    <p className="bui-hint" role="status">Selected: {chosen?.label??'None'}{activation?' · '+activation:''}</p>
    <div className="actions"><Button variant="secondary" size="sm" onClick={()=>setExpanded([])}>Collapse folders</Button><Button variant="ghost" size="sm" disabled={!chosen} onClick={()=>{if(selected){setNodes(current=>remove(current,selected));setSelected(null);setActivation('');}}}>Remove selected item</Button><Button variant="ghost" size="sm" onClick={()=>{setNodes(example);setExpanded(['src']);setSelected('readme');setActivation('');}}>Restore example</Button></div>
    <p className="bui-hint">Example files only. Removing an item changes this preview for the current session.</p>
  </div>;
}
