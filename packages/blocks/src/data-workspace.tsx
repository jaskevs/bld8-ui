/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useRef} from 'react';
import type {DataSource} from '@bld8/ui/data-workspace-state';
import type {UploadFileContext,UploadReceipt} from '@bld8/ui';
import {createMemoryIssueDataSource,issueDataColumns} from './issue-data-source.js';
import {issueFields,type Issue} from './issue-repository.js';
import type {ResourceFilterField} from './resource-workspace-state.js';
import {ResourceWorkspace} from './resource-workspace.js';
export interface DataWorkspaceProps {
  /** Stable service adapter. The default uses authored records in memory. */
  dataSource?:DataSource<Issue>;
  /** The host receives the inspected record ID and owns authorisation/storage. */
  onUploadFile?:(file:globalThis.File,context:UploadFileContext&{recordId:string})=>Promise<UploadReceipt>;
  className?:string;
}
/** Issue-specific labels and schema around the shared resource transaction controller. */
export function DataWorkspace({dataSource,onUploadFile,className}:DataWorkspaceProps){
 const fallback=useRef<DataSource<Issue>|null>(null);if(!fallback.current)fallback.current=createMemoryIssueDataSource();
 return <ResourceWorkspace dataSource={dataSource??fallback.current} columns={issueDataColumns} fields={issueFields as readonly ResourceFilterField<Issue>[]} onUploadFile={onUploadFile} className={className} labels={{label:'Data workspace',searchLabel:'Search issues',gridLabel:'Issue data grid',emptyTitle:'No matching issues.',recordName:'Issue',description:dataSource?'Connected through your data source. Changes stay in a draft until you save.':'Authored sample issues. Saved changes last for this page session.',unavailableMessage:'The issue service is unavailable. Your view and pending changes are kept.',attachmentsLabel:'Issue attachments',uploadLabel:'Issue supporting files',uploadHint:'The host receives this issue ID. Upload acknowledgement is separate from the record batch save.'}}/>;
}
export {DataWorkspace as IssueDataWorkspace};
