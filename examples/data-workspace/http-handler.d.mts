import type {DataSource} from '@bld8/ui/data-workspace-state';
import type {Issue} from '@bld8/blocks/issue-repository';
export function createIssueDataHandler(source:DataSource<Issue>,options?:{allowedOrigins?:readonly string[];path?:string}):(request:Request)=>Promise<Response>;
