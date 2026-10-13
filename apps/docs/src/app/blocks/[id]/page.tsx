import { notFound } from 'next/navigation';
import { library, findLibraryItem } from '@/lib/library';
import { LibraryItemPage } from '@/components/library-item-page';
export function generateStaticParams() { return library.blocks.map(item => ({id:item.id})); }
export async function generateMetadata({params}:{params:Promise<{id:string}>}) { const item=findLibraryItem((await params).id,'blocks');return {title:item?.name || 'Block not found',description:item?.description}; }
export default async function Page({params}:{params:Promise<{id:string}>}) { const item=findLibraryItem((await params).id,'blocks');if(!item) notFound();return <LibraryItemPage item={item} kind="blocks" />; }
