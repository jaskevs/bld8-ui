import {Catalog} from '@/components/catalog';
import {LibraryBrowseHeader} from '@/components/library-browse-header';
import {components} from '@/lib/catalog';
import {componentExampleCount,examplesFor} from '@/lib/component-examples';
export const metadata={title:'React components',description:'Editable React components for Next.js and Vite, with typed APIs, complete examples and clear keyboard behaviour. Free under MIT.'};
export default function Page(){const exampleCounts=Object.fromEntries(components.map(component=>[component.id,examplesFor(component.id).length]));return <div className="page library-browse-page"><LibraryBrowseHeader mode="components" families={components.length} examples={componentExampleCount}/><Catalog exampleCounts={exampleCounts}/></div>;}
