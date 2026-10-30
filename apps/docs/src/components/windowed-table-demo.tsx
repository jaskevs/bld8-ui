'use client';
import {useMemo,useState} from 'react';
import {Badge,Button,DataTable,Dialog,Field,Input,Select,WindowedTable,type Column,type TableGrouping,type TableQuery} from '@bld8/ui';

interface RecordRow {id:string;title:string;status:string;owner:string}
const statuses=['Planned','In review','Ready'];
const names=['Maya Chen','Sam Rivera','Oliver Reed'];
const topics=['Dialog focus','Field validation','Navigation labels','Table selection','Loading feedback'];
const columns:Column<RecordRow>[]=[
  {key:'id',header:'ID',width:132,minWidth:120,sortValue:row=>row.id,cell:row=>row.id},
  {key:'title',header:'Record',width:300,minWidth:220,flex:1,sortValue:row=>row.title,cell:row=><strong>{row.title}</strong>},
  {key:'status',header:'Status',width:150,minWidth:140,sortValue:row=>row.status,cell:row=><Badge tone={row.status==='Ready'?'success':'neutral'}>{row.status}</Badge>},
  {key:'owner',header:'Owner',width:160,minWidth:150,sortValue:row=>row.owner,cell:row=>row.owner},
];
export function WindowedTableDemo(){
  const [count,setCount]=useState('1000'),[query,setQuery]=useState(''),[group,setGroup]=useState('status');
  const [selected,setSelected]=useState<string[]>([]),[collapsed,setCollapsed]=useState<string[]>([]);
  const [display,setDisplay]=useState('scroll'),[sort,setSort]=useState<TableQuery['sort']>({key:'id',descending:false});
  const [detail,setDetail]=useState<RecordRow|null>(null);
  const source=useMemo(()=>Array.from({length:Number(count)},(_,index)=>({id:'ROW-'+String(index+1).padStart(5,'0'),title:topics[index%topics.length]+' '+(index+1),status:statuses[index%statuses.length],owner:names[index%names.length]})),[count]);
  const rows=useMemo(()=>{
    const needle=query.trim().toLocaleLowerCase();
    const result=source.filter(row=>(row.id+' '+row.title+' '+row.owner+' '+row.status).toLocaleLowerCase().includes(needle));
    const column=columns.find(column=>column.key===sort?.key);
    if(column?.sortValue){const value=column.sortValue;result.sort((a,b)=>String(value(a)).localeCompare(String(value(b)),undefined,{numeric:true})*(sort?.descending?-1:1));}
    return result;
  },[source,query,sort]);
  const grouping=useMemo<TableGrouping<RecordRow>|undefined>(()=>group==='status'?{key:row=>row.status,label:key=>key}:undefined,[group]);
  return <div className="windowed-demo">
    <div className="windowed-demo-controls"><Field label="Find records"><Input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search records…"/></Field><Select label="Record count" value={count} options={[{value:'1000',label:'1,000 records'},{value:'10000',label:'10,000 records'},{value:'20000',label:'20,000 records'}]} onValueChange={value=>{setCount(value??'1000');setSelected([]);}}/><Select label="Group records by" value={group} options={[{value:'none',label:'None'},{value:'status',label:'Status'}]} onValueChange={value=>{setGroup(value??'none');setCollapsed([]);}}/></div>
    <div className="windowed-demo-views"><div role="group" aria-label="Table display"><Button size="sm" variant="ghost" aria-pressed={display==='scroll'} onClick={()=>setDisplay('scroll')}>Scroll</Button><Button size="sm" variant="ghost" aria-pressed={display==='pages'} onClick={()=>setDisplay('pages')}>Pages</Button></div><span className="bui-hint" role="status">{rows.length.toLocaleString('en-AU')} matching records · {selected.length} selected</span></div>
    {display==='scroll'?<WindowedTable caption="Release records" rows={rows} columns={columns} rowKey={row=>row.id} rowLabel={row=>row.id} height={400} rowHeight={52} grouping={grouping} collapsedGroupKeys={collapsed} onCollapsedGroupKeysChange={setCollapsed} selectedKeys={selected} onSelectedKeysChange={setSelected} selectable sort={sort} onSortChange={setSort} onRowAction={setDetail}/>:<DataTable caption="Release records" rows={rows} columns={columns.map(column=>({...column,sortValue:undefined}))} rowKey={row=>row.id} rowLabel={row=>row.id} pageSize={20} grouping={grouping} collapsedGroupKeys={collapsed} onCollapsedGroupKeysChange={setCollapsed} selectedKeys={selected} onSelectedKeysChange={setSelected} selectable/>}
    <div className="actions"><Button size="sm" variant="secondary" onClick={()=>setSelected([])} disabled={!selected.length}>Clear selected records</Button><Button size="sm" variant="ghost" onClick={()=>{setQuery('');setGroup('status');setCollapsed([]);setSelected([]);setSort({key:'id',descending:false});}}>Reset table</Button></div>
    <p className="bui-hint">Illustrative records. Use Pages to browse every record with standard table navigation.</p>
    <Dialog title="Record details" description="The complete record, outside the scrolling view." open={!!detail} onOpenChange={open=>{if(!open)setDetail(null);}}>{detail&&<dl className="windowed-record-details"><div><dt>ID</dt><dd>{detail.id}</dd></div><div><dt>Record</dt><dd>{detail.title}</dd></div><div><dt>Status</dt><dd>{detail.status}</dd></div><div><dt>Owner</dt><dd>{detail.owner}</dd></div></dl>}</Dialog>
  </div>;
}
