export interface TableSort { key:string; descending:boolean }
/** Query state shared by ordinary tables and host-owned saved views. Pages are one-based. */
export interface TableQuery {
  search:string;
  filters:Record<string,string>;
  sort:TableSort|null;
  /** Optional ordered multi-sort. When supplied, sort mirrors its first item. */
  sorts?:TableSort[];
  page:number;
  pageSize:number;
}
export const defaultTableQuery:TableQuery={search:'',filters:{},sort:null,page:1,pageSize:5};

/** Legacy single-sort queries remain valid; multi-sort is bounded to five columns. */
export function tableSorts(query:Pick<TableQuery,'sort'|'sorts'>):TableSort[] {
  return query.sorts ?? (query.sort?[query.sort]:[]);
}
export function cycleTableSort(current:readonly TableSort[],key:string,append=false):TableSort[] {
  const previous=current.find(item=>item.key===key);
  const next=previous?.descending?null:{key,descending:!!previous};
  if(!append)return next?[next]:[];
  const result=current.filter(item=>item.key!==key);
  if(next){const index=current.findIndex(item=>item.key===key);result.splice(index<0?result.length:index,0,next);}
  return result.slice(0,5);
}
