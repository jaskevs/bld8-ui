import {deflateRawSync} from 'node:zlib';
import {MAX_DOCUMENTATION_ARCHIVE_BYTES} from './documentation-versions.mjs';

const crcTable=Array.from({length:256},(_,index)=>{let value=index;for(let bit=0;bit<8;bit++)value=value&1?0xedb88320^(value>>>1):value>>>1;return value>>>0;});
function crc32(buffer){let crc=0xffffffff;for(const byte of buffer)crc=crcTable[(crc^byte)&255]^(crc>>>8);return(crc^0xffffffff)>>>0;}
/** Separate limits from starter uploads: this accepts only generated in-memory docs. */
export function documentationArchive(files){
  const entries=Object.entries(files).sort(([a],[b])=>a.localeCompare(b));
  if(entries.length>1000)throw Error('Documentation archive has too many files.');
  const local=[],central=[];let offset=0,total=0;
  for(const [name,input] of entries){
    if(!/^(?:[a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+$/.test(name)||name.split('/').some(part=>part==='.'||part==='..'))throw Error('Invalid documentation archive path.');
    const filename=Buffer.from(name),data=Buffer.from(input);total+=data.length;if(total>64*1024*1024)throw Error('Generated documentation exceeds the archive limit.');
    const compressed=deflateRawSync(data),crc=crc32(data);
    const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(8,8);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(compressed.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(filename.length,26);
    const directory=Buffer.alloc(46);directory.writeUInt32LE(0x02014b50);directory.writeUInt16LE(20,4);directory.writeUInt16LE(20,6);directory.writeUInt16LE(0x800,8);directory.writeUInt16LE(8,10);directory.writeUInt16LE(33,14);directory.writeUInt32LE(crc,16);directory.writeUInt32LE(compressed.length,20);directory.writeUInt32LE(data.length,24);directory.writeUInt16LE(filename.length,28);directory.writeUInt32LE(offset,42);
    local.push(header,filename,compressed);central.push(directory,filename);offset+=header.length+filename.length+compressed.length;
    if(offset>MAX_DOCUMENTATION_ARCHIVE_BYTES)throw Error('Compressed documentation exceeds the archive limit.');
  }
  const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
  const archive=Buffer.concat([...local,directory,end]);if(archive.length>MAX_DOCUMENTATION_ARCHIVE_BYTES)throw Error('Compressed documentation exceeds the archive limit.');return archive;
}
