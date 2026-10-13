import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
const merge = extendTailwindMerge({ prefix:'bui' });
/** Merge BLD8 utilities; preserve compatibility and consumer CSS classes. */
export function cn(...values:ClassValue[]) { return merge(clsx(values)); }
