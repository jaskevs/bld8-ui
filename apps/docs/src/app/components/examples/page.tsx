import {ExampleCatalog} from '@/components/example-catalog';
import {LibraryBrowseHeader} from '@/components/library-browse-header';
import {components} from '@/lib/catalog';
import {componentExampleCount} from '@/lib/component-examples';
import './examples.css';
export const metadata={title:'Complete React component examples',description:'Search complete React examples, preview the real source and install focused patterns with their dependencies. Next.js and Vite, free under MIT.'};
export default function Page(){return <div className="page library-browse-page"><LibraryBrowseHeader mode="examples" families={components.length} examples={componentExampleCount}/><ExampleCatalog/></div>;}
