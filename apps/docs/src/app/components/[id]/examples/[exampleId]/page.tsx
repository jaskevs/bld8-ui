import Link from 'next/link';
import {notFound} from 'next/navigation';
import {Badge,Breadcrumb} from '@bld8/ui';
import {ExampleCard} from '@/components/component-examples';
import {allComponentExamples,findComponentExample} from '@/lib/component-examples';
import {findComponent} from '@/lib/catalog';
import {siteUrl} from '@/lib/site';
export function generateStaticParams(){return allComponentExamples().map(item=>({id:item.componentId,exampleId:item.id}));}
export async function generateMetadata({params}:{params:Promise<{id:string;exampleId:string}>}){const {id,exampleId}=await params;const item=findComponentExample(id,exampleId);return item?{title:item.title,description:item.description,alternates:{canonical:siteUrl+item.documentationPath}}:{title:'Example not found'};}
export default async function Page({params}:{params:Promise<{id:string;exampleId:string}>}){const{id,exampleId}=await params;const example=findComponentExample(id,exampleId),family=findComponent(id);if(!example||!family)notFound();return <div className="page detail-page"><Breadcrumb items={[{label:'Components',href:'/components'},{label:family.title,href:'/components/'+family.id},{label:example.title}]}/><header className="page-intro"><Badge>{family.title} example</Badge><h1>{example.title}.</h1><p className="lead">{example.description}</p><p className="bui-hint">Complete React client module · MIT · Next.js and Vite</p></header><section className="component-examples" aria-label={example.title+' complete example'}><ExampleCard example={example}/></section><nav className="detail-next" aria-label="More examples"><Link className="plain-link" href={'/components/examples?component='+family.id}>More {family.title.toLowerCase()} examples</Link><Link className="plain-link" href={'/components/'+family.id}>API and behavior</Link></nav></div>;}
