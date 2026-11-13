import Link from 'next/link';
import {notFound} from 'next/navigation';
import {CodeBlock} from '@/components/code-block';
import {PropTable} from '@/components/prop-table';
import {hasDocumentationVersion,versionedDocumentation} from '@/lib/versioned-documentation';
import {sourceVersions} from '@/lib/source-versions';

export const dynamic='force-dynamic';
export const runtime='nodejs';
export const metadata={title:'Versioned source documentation'};

export default async function Page({params,searchParams}:{params:Promise<{version:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {version}=await params,query=await searchParams;
  if(!hasDocumentationVersion(version))notFound();
  let result:Awaited<ReturnType<typeof versionedDocumentation>>;
  try{result=await versionedDocumentation(version);}catch{return <div className="page detail-page"><header className="page-intro"><p className="eyebrow">SOURCE DOCUMENTATION</p><h1>Version {version}.</h1><p className="lead">Verified documentation is unavailable for this selected source version.</p></header><section className="detail-section"><p>Earlier source releases did not include retained API documentation. A newer release may still be unpublished, or its assets could not be verified. This page does not substitute current APIs.</p><p><Link href="/docs/versions/development">Open the labelled development preview</Link> or <Link href="/releases">review source versions</Link>.</p></section></div>;}
  const {catalog,preview,manifestSnapshot}=result;
  const entry=typeof query.entry==='string'?catalog.entries.find(item=>item.kind+':'+item.id===query.entry):undefined;
  const example=typeof query.example==='string'?catalog.entries.flatMap(item=>item.examples).find(item=>item.id===query.example):undefined;
  const guide=typeof query.guide==='string'?catalog.guides.find(item=>item.id===query.guide):undefined;
  if((query.entry&&!entry)||(query.example&&!example)||(query.guide&&!guide))notFound();
  const base='/docs/versions/'+version;
  return <div className="page detail-page"><header className="page-intro"><p className="eyebrow">{preview?'UNRELEASED DEVELOPMENT PREVIEW':'RETAINED SOURCE REFERENCE'}</p><h1>{entry?.title??example?.title??guide?.title??'Source documentation.'}</h1><p className="lead">BLD8 UI {catalog.release.version} · {catalog.release.status}. {preview?'Moving local source; these APIs may change.':'APIs and source from the selected manifest. Interactive demos on the main website follow its current build.'}</p></header>
    <section className="detail-section"><p><Link href={base}>All entries</Link> · <Link href="/docs/versions/development">Development preview</Link>{sourceVersions.map(item=><span key={item.version}> · <Link href={'/docs/versions/'+item.version}>{item.version}</Link></span>)}</p><dl className="file-map"><div><dt>Source revision</dt><dd><code>{catalog.release.sourceRevision??'Unreleased working source'}</code></dd></div><div><dt>{catalog.release.snapshotKind==='source-graph'?'Source graph':'Manifest'} snapshot</dt><dd><code>{catalog.release.snapshot}</code></dd></div>{!preview&&<div><dt>Manifest digest</dt><dd><code>{manifestSnapshot}</code></dd></div>}</dl>{!preview&&<p><a href={'/releases/'+version+'/documentation.zip'}>Download this documentation</a> · <a href={'/releases/'+version+'/docs/catalog.json'}>Read its verified catalogue</a></p>}</section>
    {entry&&<><section className="detail-section"><h2>{entry.title}</h2><p>{entry.description}</p><p>{entry.notes}</p>{entry.registry&&<CodeBlock code={'npx shadcn@latest add '+entry.registry.url}/>}<CodeBlock code={entry.example.code}/></section><section className="detail-section"><h2>Public API</h2><PropTable sections={entry.api}/></section><section className="detail-section"><h2>Complete examples</h2><ul>{entry.examples.map(item=><li key={item.id}><Link href={base+'?example='+encodeURIComponent(item.id)}>{item.title}</Link></li>)}</ul></section></>}
    {example&&<section className="detail-section"><h2>{example.title}</h2><p>{example.description}</p><p>{example.keyboard.join(' ')}</p><p>{example.states.join(' ')}</p><CodeBlock code={'npx shadcn@latest add '+example.registry.url}/><h3>Workspace source</h3><CodeBlock code={example.code}/><h3>Installed source</h3><CodeBlock code={example.registryCode}/></section>}
    {guide&&<section className="detail-section"><h2>{guide.title}</h2><CodeBlock code={guide.content}/></section>}
    {!entry&&!example&&!guide&&<><section className="detail-section"><h2>Components, blocks and templates</h2><ul>{catalog.entries.map(item=><li key={item.kind+':'+item.id}><Link href={base+'?entry='+encodeURIComponent(item.kind+':'+item.id)}>{item.title}</Link> — {item.description}</li>)}</ul></section><section className="detail-section"><h2>Guides</h2><ul>{catalog.guides.map(item=><li key={item.id}><Link href={base+'?guide='+encodeURIComponent(item.id)}>{item.title}</Link></li>)}</ul></section></>}
  </div>;
}
