import catalog from '../../../../releases/catalog.json' with {type:'json'};

export const sourceVersions=catalog.versions;
export function sourceVersionAsset(version:string,path:string){
  const entry=sourceVersions.find(item=>item.version===version);
  const root=['manifest.json','CHANGELOG.md','UPDATING.md','LICENSE','check-source-updates.mjs','source-release.mjs','capture-installation.mjs'];
  if(!entry||entry.tag!=='v'+version||!(/^(r|sources)\/[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(path)||/^downloads\/[a-z0-9]+(?:-[a-z0-9]+)*\.zip$/.test(path)||root.includes(path)))return null;
  return `https://github.com/jaskevs/bld8-ui/releases/download/${entry.tag}/${path.replace('/','--')}`;
}
