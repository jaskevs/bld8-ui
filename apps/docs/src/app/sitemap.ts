import type { MetadataRoute } from 'next';
import { components } from '@/lib/catalog';
import { siteUrl } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/components', '/motion', '/foundations', '/examples', '/getting-started', ...components.map(item => '/components/' + item.id)];
  return routes.map(route => ({ url: siteUrl + route }));
}