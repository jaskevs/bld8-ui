/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export interface ResizablePanelConstraint {id:string;minSize?:number;maxSize?:number;defaultSize?:number;collapsible?:boolean}
export type PanelLayout=Record<string,number>;
const epsilon=.00001;
function constraints(panels:readonly ResizablePanelConstraint[]){
  if(panels.length<2||panels.length>6||new Set(panels.map(panel=>panel.id)).size!==panels.length)throw Error('Provide two to six panels with distinct IDs.');
  return panels.map(panel=>{const min=panel.minSize??10,max=panel.maxSize??100;if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(panel.id)||!Number.isFinite(min)||!Number.isFinite(max)||min<1||max<min||max>100||panel.defaultSize!==undefined&&(!Number.isFinite(panel.defaultSize)||panel.defaultSize<0||panel.defaultSize>100))throw Error('Use stable panel IDs and percentage constraints from 1 to 100.');return {...panel,min,max};});
}
/** Restore only configured IDs and distribute unused space within each active panel's constraints. */
export function normalizePanelLayout(panels:readonly ResizablePanelConstraint[],input?:Readonly<PanelLayout>):PanelLayout{
  const config=constraints(panels),active=config.filter(panel=>!(panel.collapsible&&(input?.[panel.id]??panel.defaultSize)===0));if(!active.length)throw Error('Keep at least one panel open.');
  if(active.reduce((sum,panel)=>sum+panel.min,0)>100+epsilon||active.reduce((sum,panel)=>sum+panel.max,0)<100-epsilon)throw Error('Panel constraints cannot fill the available space.');
  const result:PanelLayout=Object.fromEntries(config.map(panel=>[panel.id,0]));
  for(const panel of active){const proposed=input?.[panel.id]??panel.defaultSize??100/active.length;if(!Number.isFinite(proposed)||proposed<0||proposed>100)throw Error('Panel sizes must be finite percentages.');result[panel.id]=Math.min(panel.max,Math.max(panel.min,proposed));}
  for(let pass=0;pass<config.length+2;pass++){const delta=100-Object.values(result).reduce((sum,value)=>sum+value,0);if(Math.abs(delta)<epsilon)break;const eligible=active.filter(panel=>delta>0?result[panel.id]<panel.max-epsilon:result[panel.id]>panel.min+epsilon);if(!eligible.length)throw Error('Panel constraints cannot fill the available space.');for(const panel of eligible)result[panel.id]=Math.min(panel.max,Math.max(panel.min,result[panel.id]+delta/eligible.length));}
  return result;
}
/** Adjacent panes exchange space; every other pane keeps its exact size. */
export function resizePanelPair(panels:readonly ResizablePanelConstraint[],layout:Readonly<PanelLayout>,index:number,firstSize:number):PanelLayout{
  const config=constraints(panels),current=normalizePanelLayout(panels,layout),first=config[index],second=config[index+1];if(!first||!second||!Number.isFinite(firstSize))return current;
  const total=current[first.id]+current[second.id],firstMin=first.collapsible?0:first.min,secondMin=second.collapsible?0:second.min;
  let value=Math.min(first.max,total-secondMin,Math.max(firstMin,total-second.max,firstSize));
  if(first.collapsible&&value<first.min&&total<=second.max)value=value<first.min/2?0:first.min;
  else if(value<first.min)value=first.min;
  let other=total-value;
  if(second.collapsible&&other<second.min&&total<=first.max){other=other<second.min/2?0:second.min;value=total-other;}
  else if(other<second.min){other=second.min;value=total-other;}
  if(value>first.max+epsilon||other>second.max+epsilon||value<0||other<0||value>0&&value<first.min-epsilon||other>0&&other<second.min-epsilon)return current;
  return {...current,[first.id]:value,[second.id]:other};
}
/** Collapse/restore redistributes space across the remaining open panes, respecting their limits. */
export function togglePanelLayout(panels:readonly ResizablePanelConstraint[],layout:Readonly<PanelLayout>,id:string,restoreSize?:number):PanelLayout{
  const panel=panels.find(panel=>panel.id===id);if(!panel?.collapsible)return normalizePanelLayout(panels,layout);const current=normalizePanelLayout(panels,layout);
  try{if(current[id]>0)return normalizePanelLayout(panels,{...current,[id]:0});const size=Math.min(panel.maxSize??100,Math.max(panel.minSize??10,restoreSize??panel.defaultSize??100/panels.length));return normalizePanelLayout(panels.map(item=>item.id===id?{...item,minSize:size,maxSize:size,collapsible:false}:item),{...current,[id]:size});}catch{return current;}
}
