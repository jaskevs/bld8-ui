import {Catalog} from '@/components/catalog';
import {components} from '@/lib/catalog';
import {componentExampleCount,examplesFor} from '@/lib/component-examples';
export const metadata={title:'React components',description:'Editable React components for Next.js and Vite, with typed APIs, complete examples and clear keyboard behaviour. Free under MIT.'};
export default function Page(){
  const exampleCounts=Object.fromEntries(components.map(component=>[component.id,examplesFor(component.id).length]));
  return <div className="page"><header className="page-intro"><p className="eyebrow">REACT COMPONENTS</p><h1>React components.<br/><span>Ready to adapt.</span></h1><p className="lead">Editable controls for Next.js and Vite, with typed APIs, complete examples and shared styles. Free under MIT.</p><p className="bui-hint">{components.length} component families · {componentExampleCount} named examples. Search by what the control needs to do.</p></header><Catalog exampleCounts={exampleCounts}/></div>;
}
