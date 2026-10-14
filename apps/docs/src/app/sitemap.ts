import type { MetadataRoute } from 'next';
import { components } from '@/lib/catalog';
import { siteUrl } from '@/lib/site';
import { library } from '@/lib/library';
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/components', '/blocks', '/templates', '/icons', '/plans', '/motion', '/foundations', '/examples', '/getting-started', '/playground', '/registry', '/integrations/react-hook-form', '/integrations/outline-http', '/examples/outline-http', ...components.map(item => '/components/' + item.id), ...library.blocks.map(item => '/blocks/' + item.id), ...library.templates.map(item => '/templates/' + item.id)];
  return routes.map(route => ({ url: siteUrl + route }));
}
