import {sourceNoticeBanner} from './generated/source-notice';

/** Keep complete copied modules portable; command and JSON snippets do not use this helper. */
export function withSourceNotice(source:string):string {
  return source.includes(sourceNoticeBanner.trim())?source:sourceNoticeBanner+source;
}
