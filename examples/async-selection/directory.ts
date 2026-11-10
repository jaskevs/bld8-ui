export type DirectorySource='product'|'research';
export interface DirectoryPerson {value:string;label:string;description:string;role:string;initials:string;disabled?:boolean}

/** Illustrative directory records; no real accounts or personal information are queried. */
export function directoryPeople(source:DirectorySource):DirectoryPerson[]{
  const first=['Avery','Robin','Casey','Alex','Morgan','Jamie','Taylor','Jordan','Riley','Cameron','Drew','Quinn','Harper','Reese','Rowan','Sage','Emery','Parker','Finley'];
  const last=['Lee','Patel','Morgan'];
  return Array.from({length:60},(_,index)=>{
    const labels=source==='product'?['Maya Chen','Sam Rivera','Oliver Reed']:['Maya Field','Sam Ortiz','Oliver Chao'];
    const label=index<3?labels[index]:first[(index-3)%first.length]+' '+last[Math.floor((index-3)/first.length)];
    const role=['Engineering','Design','Research'][index%3];
    return {value:index<3?['maya','sam','oliver'][index]:'person-'+(index+1),label,role,description:role+' · '+(source==='product'?'Product studio':'Research studio'),initials:label.split(' ').map(word=>word[0]).join(''),...(index===59?{disabled:true}:{})};
  });
}

export function handlePeopleDirectory(request:Request):Response{
  const headers={'Cache-Control':'no-store'};
  if(request.method!=='GET')return Response.json({error:'Use GET for the sample directory.'},{status:405,headers:{...headers,Allow:'GET'}});
  const params=new URL(request.url).searchParams;
  if([...params.keys()].some(key=>!['query','cursor','values','source','fail'].includes(key))||[...new Set(params.keys())].some(key=>params.getAll(key).length!==1))return Response.json({error:'Unsupported directory query.'},{status:400,headers});
  const source=params.get('source')??'product',query=params.get('query')??'',cursor=params.get('cursor')??'0',values=params.get('values');
  if(!['product','research'].includes(source)||query.length>1000||!/^(0|[1-9]\d{0,3})$/.test(cursor)||Number(cursor)>60||params.has('fail')&&params.get('fail')!=='1')return Response.json({error:'Invalid directory query.'},{status:400,headers});
  if(params.get('fail')==='1')return Response.json({error:'The sample directory is temporarily unavailable.'},{status:503,headers});
  const people=directoryPeople(source as DirectorySource);
  if(values!==null){
    const ids=values?values.split(','):[];
    if(ids.length>100||new Set(ids).size!==ids.length||ids.some(id=>!/^[-\w]{1,128}$/.test(id)))return Response.json({error:'Invalid directory selection.'},{status:400,headers});
    return Response.json(ids.flatMap(id=>people.find(person=>person.value===id)??[]),{headers});
  }
  const needle=query.trim().toLocaleLowerCase('en-US'),matches=people.filter(person=>(person.label+' '+person.description).toLocaleLowerCase('en-US').includes(needle));
  const offset=Number(cursor),items=matches.slice(offset,offset+20);
  return Response.json({items,nextCursor:offset+20<matches.length?String(offset+20):null},{headers});
}
