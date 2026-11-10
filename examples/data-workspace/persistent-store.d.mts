import type {DataSource} from '@bld8/ui/data-workspace-state';
import type {Issue} from '@bld8/blocks/issue-repository';
export function createPersistentIssueDataSource(filePath:string):Promise<DataSource<Issue>>;
