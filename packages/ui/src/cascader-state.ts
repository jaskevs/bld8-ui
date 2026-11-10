import {isAsyncOptionValue,validateAsyncOption,validateAsyncPage,validateAsyncValues,type AsyncOption,type AsyncOptionsPage,type AsyncOptionsRequest} from './async-options.js';

/** Globally stable IDs identify nodes; parent metadata makes a restored path verifiable. */
export interface CascaderNode extends AsyncOption {parentValue:string|null;hasChildren:boolean}
export interface CascaderOptionsRequest extends AsyncOptionsRequest {parentValue:string|null;path:readonly string[]}
export type CascaderOptionsLoader<T extends CascaderNode=CascaderNode>=(request:CascaderOptionsRequest)=>Promise<AsyncOptionsPage<T>>;
export type CascaderPathResolver<T extends CascaderNode=CascaderNode>=(request:{values:readonly string[];signal:AbortSignal})=>Promise<readonly T[]>;

function depthLimit(maxDepth:number){if(!Number.isInteger(maxDepth)||maxDepth<1||maxDepth>8)throw new Error('Use a cascader depth from 1 through 8.');return maxDepth;}
export function validateCascaderValues(values:readonly string[],maxDepth=8):string[]{
  const limit=depthLimit(maxDepth),copy=validateAsyncValues(values);if(copy.length>limit)throw new Error('The selected path exceeds the supported depth.');return copy;
}
export function validateCascaderNode<T extends CascaderNode=CascaderNode>(value:unknown):T {
  const node=validateAsyncOption<T>(value);
  if(node.parentValue!==null&&!isAsyncOptionValue(node.parentValue)||typeof node.hasChildren!=='boolean'||node.parentValue===node.value)throw new Error('The location source returned invalid hierarchy data.');
  return node;
}
/** Validate one current-level page, not an entire tree or a global search result. */
export function validateCascaderPage<T extends CascaderNode=CascaderNode>(value:unknown,path:readonly string[],parentValue:string|null=path.at(-1)??null,maxDepth=8):AsyncOptionsPage<T> {
  const ancestors=validateCascaderValues(path,maxDepth),limit=depthLimit(maxDepth);
  if(ancestors.length>=limit||parentValue!==(ancestors.at(-1)??null))throw new Error('The requested parent path is invalid.');
  const page=validateAsyncPage<T>(value),items=page.items.map(item=>validateCascaderNode<T>(item));
  if(items.some(node=>node.parentValue!==parentValue||ancestors.includes(node.value)))throw new Error('The location source returned a node outside the requested branch.');
  return {items,nextCursor:page.nextCursor};
}
/** A resolver must return the complete requested path in order, ending at a leaf. */
export function validateCascaderResolvedPath<T extends CascaderNode=CascaderNode>(value:unknown,values:readonly string[],maxDepth=8):T[] {
  const ids=validateCascaderValues(values,maxDepth);
  if(!Array.isArray(value)||value.length!==ids.length)throw new Error('The complete selected path could not be resolved.');
  const nodes=Array.from(value).map(item=>validateCascaderNode<T>(item));
  if(nodes.some((node,index)=>node.value!==ids[index]||node.parentValue!==(ids[index-1]??null)||node.hasChildren!==(index<nodes.length-1)))throw new Error('The source did not return an ordered path ending at a leaf.');
  return nodes;
}
