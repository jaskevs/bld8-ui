'use client';
import {useMemo,useState} from 'react';
import {Button,DataGrid,Select,parseDataValue,createUploadHttpAdapter,type UploadFileContext,type DataCellError,type DataColumn,type DataEdit,type DataSource} from '@bld8/ui';
import {DataWorkspace} from '@bld8/blocks';
import {createMemoryIssueDataSource,createIssueDataHttpSource} from '@bld8/blocks/issue-data-source';
import type {Issue} from '@bld8/blocks/issue-repository';

export function DataWorkspaceDemo(){
  const [mode,setMode]=useState('sample');
  const source=useMemo<DataSource<Issue>>(()=>{
    const source=createMemoryIssueDataSource(mode==='empty'?[]:undefined);let failRead=mode==='read-error',failSave=mode==='write-error',conflict=mode==='conflict',lostReceipt=mode==='lost-receipt';
    return {
      async load(query,context){if(mode==='loading')return new Promise((_,reject)=>context.signal.addEventListener('abort',()=>reject(new DOMException('Cancelled','AbortError')),{once:true}));if(failRead){failRead=false;throw new Error('Example connection unavailable.');}return source.load(query,context);},
      async save(request,context){if(failSave){failSave=false;throw new Error('Example save interrupted. Retry the same batch.');}if(conflict){conflict=false;const change=request.changes[0];await source.save({requestId:crypto.randomUUID(),changes:[{id:change.id,expectedRevision:change.expectedRevision,values:{title:'Updated in another session'}}]},context);}if(mode==='source-change'){window.setTimeout(()=>setMode('empty'),50);await new Promise(resolve=>window.setTimeout(resolve,350));return source.save(request,{signal:new AbortController().signal});}const result=await source.save(request,context);if(lostReceipt){lostReceipt=false;throw new Error('The example committed the batch but its acknowledgement was lost.');}return result;},
    };
  },[mode]);
  return <div className="bblocks-stack"><Select label="Data workspace preview" value={mode} onValueChange={value=>setMode(value??'sample')} options={[{value:'sample',label:'Sample data'},{value:'read-error',label:'Connection error'},{value:'write-error',label:'Interrupted save'},{value:'lost-receipt',label:'Lost save acknowledgement'},{value:'conflict',label:'Newer server revision'},{value:'source-change',label:'Source changes during save'},{value:'empty',label:'Empty'},{value:'loading',label:'Loading'}]}/><DataWorkspace dataSource={source}/></div>;
}

export function DataWorkspaceHttpDemo(){
  const adapter=useMemo(()=>{let session:string|undefined;
    function sessionId(){if(!session){try{const stored=sessionStorage.getItem('bld8-data-workspace-session');session=stored&&/^[\w-]{36}$/.test(stored)?stored:crypto.randomUUID();sessionStorage.setItem('bld8-data-workspace-session',session);}catch{session=crypto.randomUUID();}}return session;}
    return {source:createIssueDataHttpSource('/api/examples/data-workspace',async(input,init)=>fetch(input,{...init,headers:{...init?.headers,'X-BLD8-Session':sessionId()}})),
      uploadFile:(file:File,context:UploadFileContext&{recordId:string})=>createUploadHttpAdapter({endpoint:'/api/examples/uploads',headers:{'X-BLD8-Session':sessionId(),'X-BLD8-Record-Id':context.recordId}})(file,context)};
  },[]);
  return <DataWorkspace dataSource={adapter.source} onUploadFile={adapter.uploadFile}/>;
}

type PreviewRow={id:string;revision:number;title:string;status:string;estimate:number};
const columns:DataColumn<PreviewRow>[]=[{key:'title',label:'Title',type:'text',editable:true,required:true,minLength:3,maxLength:120},{key:'status',label:'Status',type:'select',editable:true,options:[{value:'review',label:'In review'},{value:'done',label:'Done'},{value:'planned',label:'Planned'}]},{key:'estimate',label:'Estimate',type:'number',editable:true,min:0,max:99}];
const initial:PreviewRow[]=[{id:'ISS-1',revision:1,title:'Review keyboard flow',status:'review',estimate:3},{id:'ISS-2',revision:1,title:'Polish empty states',status:'planned',estimate:2},{id:'ISS-3',revision:1,title:'Align field spacing',status:'done',estimate:5}];
export function DataGridDemo(){
  const [history,setHistory]=useState<PreviewRow[][]>([initial]),[index,setIndex]=useState(0),[errors,setErrors]=useState<DataCellError[]>([]);
  const rows=history[index];
  function edit(edits:DataEdit<PreviewRow>[]){const invalid:DataCellError[]=[];const next=rows.map(row=>({...row}));for(const edit of edits){const row=next.find(row=>row.id===edit.id),column=columns.find(column=>column.key===edit.key);if(!row||!column)continue;const parsed=parseDataValue(column,edit.value);if(parsed.error)invalid.push({id:row.id,key:column.key,message:parsed.error});(row as unknown as Record<string,unknown>)[column.key]=parsed.error?edit.value:parsed.value;}setErrors(invalid);setHistory([...history.slice(0,index+1),next]);setIndex(index+1);}
  return <div className="bblocks-stack"><div><h3>Small changes, kept together.</h3><p className="bui-hint">Sample records. Enter edits a cell; Shift+arrows selects a range. No service writes.</p></div><DataGrid label="Editable issue sample" rows={rows} columns={columns} onEdit={edit} cellErrors={errors} onUndo={()=>{if(index){setIndex(index-1);setErrors([]);}}} onRedo={()=>{if(index<history.length-1){setIndex(index+1);setErrors([]);}}} canUndo={index>0} canRedo={index<history.length-1} dirtyCells={rows.flatMap((row,i)=>columns.filter(column=>row[column.key]!==initial[i][column.key]).map(column=>({id:row.id,key:column.key})))}/><Button variant="secondary" onClick={()=>{setHistory([initial]);setIndex(0);setErrors([]);}}>Reset sample</Button></div>;
}
