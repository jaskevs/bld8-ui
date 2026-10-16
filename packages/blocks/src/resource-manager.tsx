'use client';
import { useState, type FormEvent } from 'react';
import { Archive, Download, FileText, Plus, Undo2 } from 'lucide-react';
import { Alert, Badge, Button, DataTable, Dialog, FileUpload, Icon, createTableCSV, type Column } from '@bld8/ui';

export interface ResourceRecord {id:string;name:string;type:string;size:number;status:'Active'|'Archived'}
export interface ResourceManagerProps { initialRecords?:ResourceRecord[]; onImport?:(files:File[])=>Promise<ResourceRecord[]>; onRecordsChange?:(records:ResourceRecord[])=>void }
const initial:ResourceRecord[]=[
  {id:'1',name:'Interface brief.pdf',type:'PDF',size:148200,status:'Active'},
  {id:'2',name:'Research notes.txt',type:'TXT',size:4200,status:'Active'},
  {id:'3',name:'Navigation sketches.png',type:'PNG',size:824000,status:'Active'},
  {id:'4',name:'Old checklist.txt',type:'TXT',size:2080,status:'Archived'},
];
const columns:Column<ResourceRecord>[]=[
  {key:'name',header:'File',hideable:false,width:300,minWidth:220,flex:1,sortValue:row=>row.name,cell:row=><span className="bblocks-date"><Icon icon={FileText} /><strong>{row.name}</strong></span>},
  {key:'type',header:'Type',width:96,minWidth:80,sortValue:row=>row.type,cell:row=><Badge>{row.type}</Badge>},
  {key:'size',header:'Size',width:120,minWidth:104,align:'end',sortValue:row=>row.size,cell:row=><span>{(row.size/1024).toFixed(1)} KB</span>},
  {key:'status',header:'Status',width:128,minWidth:112,sortValue:row=>row.status,cell:row=><Badge tone={row.status==='Active' ? 'success' : 'neutral'}>{row.status}</Badge>},
];
function download(rows:ResourceRecord[]) {
  const blob=new Blob(['\uFEFF'+createTableCSV(rows,columns)],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download='resource-metadata.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function ResourceManager({initialRecords=initial,onImport,onRecordsChange}:ResourceManagerProps) {
  const [records,setRecords]=useState(initialRecords);const [selected,setSelected]=useState<string[]>([]);const [files,setFiles]=useState<File[]>([]);
  const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('');
  const [undo,setUndo]=useState<{id:string;status:ResourceRecord['status']}[]>([]);
  const change=(next:ResourceRecord[])=>{setRecords(next);onRecordsChange?.(next);};
  async function add(event:FormEvent) {
    event.preventDefault();if(!files.length) {setError('Choose at least one file.');return;} setError('');setBusy(true);
    try {
      const added=onImport ? await onImport(files) : files.map(file=>({id:crypto.randomUUID(),name:file.name,type:file.name.split('.').pop()?.toUpperCase() ?? 'FILE',size:file.size,status:'Active' as const}));
      change([...records,...added]);setFiles([]);setOpen(false);setMessage(onImport ? added.length+' resources imported.' : added.length+' metadata records added. File contents were not stored or uploaded.');
    } catch(cause) {setError(cause instanceof Error ? cause.message : 'Import failed. Try again.');} finally {setBusy(false);}
  }
  return <section className="bblocks-panel" aria-label="Resource library"><div className="bblocks-heading"><div><p className="bblocks-kicker">THE MATERIAL, IN REACH</p><h2>A home for the references.</h2><p className="bblocks-muted">Filter records, export metadata and archive with a way back.</p></div><Dialog title="Add resources" description="Select files to add their metadata to the library." open={open} onOpenChange={next=>{if(!busy)setOpen(next);}} trigger={<Button leadingIcon={Plus}>Add resources</Button>}>
    <form className="bblocks-stack" onSubmit={add}><FileUpload label="Resource files" value={files} onValueChange={setFiles} accept=".pdf,.txt,.png,.jpg" maxFiles={5} maxSize={10*1024*1024} disabled={busy} />{error && <Alert title="Unable to add resources" tone="danger" live>{error}</Alert>}<p className="bblocks-note">{onImport ? 'Your import callback owns file storage.' : 'This local example saves metadata only. File contents never leave your browser.'}</p><Button type="submit" loading={busy}>Add to library</Button></form>
  </Dialog></div>
    <DataTable caption="Resources" rows={records} columns={columns} rowKey={row=>row.id} rowLabel={row=>row.name} searchText={row=>row.name+' '+row.type} pageSize={4} selectable selectedKeys={selected} onSelectedKeysChange={setSelected} columnVisibility density="compact" filters={[{key:'status',label:'Statuses',options:[{value:'Active',label:'Active'},{value:'Archived',label:'Archived'}],value:row=>row.status},{key:'type',label:'Types',options:['PDF','TXT','PNG','JPG'].map(value=>({value,label:value})),value:row=>row.type}]} renderBulkActions={chosen=><><Button leadingIcon={Download} variant="secondary" size="sm" onClick={()=>{download(chosen);setMessage(chosen.length+' metadata records exported.');}}>Export CSV</Button><Button leadingIcon={Archive} size="sm" onClick={()=>{setUndo(chosen.map(row=>({id:row.id,status:row.status})));change(records.map(row=>chosen.some(item=>item.id===row.id) ? {...row,status:'Archived'} : row));setSelected([]);setMessage(chosen.length+' resources archived.');}}>Archive</Button></>} />
    <div className="bblocks-resource-footer"><p role="status" className="bblocks-status">{message}</p>{undo.length>0 && <Button variant="ghost" size="sm" leadingIcon={Undo2} onClick={()=>{change(records.map(row=>{const previous=undo.find(item=>item.id===row.id);return previous ? {...row,status:previous.status} : row;}));setUndo([]);setMessage('Archive undone.');}}>Undo archive</Button>}</div>
    <p className="bblocks-note">Illustrative file metadata. No file hosting or storage service is included.</p>
  </section>;
}
