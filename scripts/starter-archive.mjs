import {deflateRawSync,inflateRawSync} from 'node:zlib';

const crcTable=Array.from({length:256},(_,index)=>{let value=index;for(let bit=0;bit<8;bit++)value=value&1?0xedb88320^(value>>>1):value>>>1;return value>>>0;});
function crc32(buffer){let crc=0xffffffff;for(const byte of buffer)crc=crcTable[(crc^byte)&255]^(crc>>>8);return(crc^0xffffffff)>>>0;}
const maxBytes=16*1024*1024,maxFiles=800;
function checkPath(name){if(!name||name.startsWith('/')||name.includes('\\')||name.includes(':')||name.split('/').some(part=>!part||part==='.'||part==='..')||name.includes('\0'))throw Error('Invalid starter path');}
export function zip(files){
  const local=[],central=[];let offset=0,total=0;const entries=Object.entries(files);
  if(entries.length>maxFiles)throw Error('Starter contains too many files');
  for(const [name,input] of entries){
    checkPath(name);const filename=Buffer.from(name),data=Buffer.from(input);total+=data.length;if(total>maxBytes)throw Error('Starter is too large');
    const compressed=deflateRawSync(data),crc=crc32(data);
    const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(8,8);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(compressed.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(filename.length,26);
    const directory=Buffer.alloc(46);directory.writeUInt32LE(0x02014b50);directory.writeUInt16LE(20,4);directory.writeUInt16LE(20,6);directory.writeUInt16LE(0x800,8);directory.writeUInt16LE(8,10);directory.writeUInt16LE(33,14);directory.writeUInt32LE(crc,16);directory.writeUInt32LE(compressed.length,20);directory.writeUInt32LE(data.length,24);directory.writeUInt16LE(filename.length,28);directory.writeUInt32LE(offset,42);
    local.push(header,filename,compressed);central.push(directory,filename);offset+=header.length+filename.length+compressed.length;
  }
  const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...local,directory,end]);
}
/** Read only our bounded, allowlisted build archives; uploads are never accepted. */
export function unzip(input){
  const archive=Buffer.from(input),files=Object.create(null);let offset=0,total=0,count=0;
  if(archive.length>maxBytes||archive.length<22)throw Error('Invalid starter archive');
  while(offset+30<=archive.length&&archive.readUInt32LE(offset)===0x04034b50){
    const size=archive.readUInt32LE(offset+18),length=archive.readUInt16LE(offset+26),extra=archive.readUInt16LE(offset+28),start=offset+30+length+extra;
    if(++count>maxFiles||start+size>archive.length||(archive.readUInt16LE(offset+6)&8)||archive.readUInt16LE(offset+8)!==8)throw Error('Unsupported starter archive');
    const name=archive.subarray(offset+30,offset+30+length).toString('utf8');checkPath(name);if(Object.hasOwn(files,name))throw Error('Duplicate starter path');
    const expected=archive.readUInt32LE(offset+22);if(expected>maxBytes-total)throw Error('Starter is too large');
    const data=inflateRawSync(archive.subarray(start,start+size),{maxOutputLength:maxBytes-total});total+=data.length;
    if(data.length!==expected||crc32(data)!==archive.readUInt32LE(offset+14))throw Error('Starter integrity check failed');
    files[name]=data;offset=start+size;
  }
  if(offset+4>archive.length||archive.readUInt32LE(offset)!==0x02014b50||!count)throw Error('Invalid starter directory');return files;
}

/** Apply a validated theme to both the document root and bundled styles/fonts. */
export function themeStarter(input,{framework,config,mode,css,serialized}){
  const files={...input},base=framework==='nextjs'?'app':'src',entry=framework==='nextjs'?'app/layout.tsx':'src/main.tsx';
  const fonts=config.typography==='standard'?['dm-sans','manrope']:config.typography==='geometric'?['manrope']:[];
  let fontCss='';for(const name of ['dm-sans','manrope']){
    const file=base+'/fonts/'+name+'.woff2';
    if(fonts.includes(name)){if(!files[file])throw Error('Missing starter font');fontCss+=`@font-face{font-family:"${name==='dm-sans'?'DM Sans':'Manrope'}";font-style:normal;font-weight:100 900;font-display:swap;src:url("./fonts/${name}.woff2") format("woff2");}\n`;}
    else delete files[file];
  }
  files[base+'/bld8-theme.css']=fontCss+css;
  let source=Buffer.from(files[entry]).toString('utf8');if(!source.includes("import './bld8-theme.css'"))source+="\nimport './bld8-theme.css';\n";
  if(framework==='nextjs'){
    source=source.replace(/<html\b[^>]*>/,'<html lang="en" className="bld8-theme" data-ui-theme="'+mode+'">');
    files[entry]=source;
  }else{
    files[entry]=source;files['index.html']=Buffer.from(files['index.html']).toString('utf8').replace(/<html\b[^>]*>/,'<html lang="en" class="bld8-theme" data-ui-theme="'+mode+'">');
  }
  files['bld8-theme.json']=serialized;
  const readme=Buffer.from(files['README.md']).toString('utf8').split('\n## Your theme\n')[0];files['README.md']=readme+'\n## Your theme\n\nEdit '+base+'/bld8-theme.css for colours, spacing and typography. The document root carries the theme class and initial colour mode so portalled controls inherit it. bld8-theme.json preserves the configuration. Selected DM Sans/Manrope fonts are self-hosted in '+base+'/fonts; keep their OFL notices in font-licenses/. System typography adds no font asset.\n';
  return files;
}
