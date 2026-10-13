import { LibraryCatalog } from '@/components/library-catalog';
export const metadata = {title:'Templates',description:'Free Next.js interface starters with complete source and BLD8 UI workspaces.'};
export default function Page() {return <div className="page"><header className="page-intro library-intro"><p className="eyebrow">A WHOLE INTERFACE</p><h1>A starting point.<br /><span>Make it yours.</span></h1><p className="lead">A workspace shell and a product page. Explore the views, download a runnable Next.js starter and adapt the details.</p></header><LibraryCatalog kind="templates" /></div>;}
