export { library } from './generated/catalog';
import { library } from './generated/catalog';
export type LibraryItem = (typeof library.blocks)[number] | (typeof library.templates)[number];
export function findLibraryItem(id: string, kind: 'blocks' | 'templates') { return library[kind].find(item => item.id === id); }
