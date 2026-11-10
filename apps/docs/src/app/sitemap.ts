import type { MetadataRoute } from 'next';
import { components } from '@/lib/catalog';
import { siteUrl } from '@/lib/site';
import { library } from '@/lib/library';
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/components', '/blocks', '/templates', '/icons', '/plans', '/motion', '/foundations', '/examples', '/getting-started', '/frameworks', '/community', '/playground', '/themes', '/registry', '/releases', '/integrations/react-hook-form', '/integrations/outline-http', '/integrations/issues', '/integrations/task-workspace', '/integrations/session-setup', '/integrations/file-browser', '/integrations/analytics', '/integrations/large-tables', '/integrations/scheduling', '/integrations/calendar', '/integrations/uploads', '/examples/outline-http', '/examples/table-ordering', '/examples/async-selection', '/examples/cascader', '/examples/upload-http', '/examples/data-workspace', '/agents', ...components.map(item => '/components/' + item.id), ...library.blocks.map(item => '/blocks/' + item.id), ...library.templates.map(item => '/templates/' + item.id)];
  return routes.map(route => ({ url: siteUrl + route }));
}
