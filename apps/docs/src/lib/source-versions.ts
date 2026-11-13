import catalog from '../../../../releases/catalog.json' with {type:'json'};

export const sourceVersions=catalog.versions;
export function sourceVersionAsset(version:string,path:string){
  const documentationAsset=path==='docs/catalog.json'||path==='documentation.zip';
  const entry=sourceVersions.find(item=>item.version===version);
  const root=['manifest.json','CHANGELOG.md','UPDATING.md','LICENSE','check-source-updates.mjs','source-release.mjs','capture-installation.mjs',"BRAND.md","packages/blocks/LICENSE","packages/ui/LICENSE","packages/ui/LUCIDE_LICENSE","packages/ui/DAY_PICKER_LICENSE","packages/ui/SHADCN_LICENSE","packages/ui/MOTION_LICENSE","packages/ui/DND_KIT_LICENSE","packages/ui/THIRD_PARTY_NOTICES.md","packages/ui/UPSTREAM.json","licenses/inventory.json","scripts/license-policy.mjs"];
  if(!entry||entry.tag!=='v'+version||!(/^(r|sources)\/[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(path)||/^downloads\/[a-z0-9]+(?:-[a-z0-9]+)*\.zip$/.test(path)||root.includes(path)||documentationAsset))return null;
  return `https://github.com/jaskevs/bld8-ui/releases/download/${entry.tag}/${path.replaceAll('/','--')}`;
}
