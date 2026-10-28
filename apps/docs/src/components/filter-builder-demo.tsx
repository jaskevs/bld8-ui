'use client';
import {useState} from 'react';
import {Button,FilterBuilder,emptyFilterQuery,filterRecords,validateFilterQuery,type FilterQuery} from '@bld8/ui';
import {issueFields,issueSeed} from '@bld8/blocks/issue-repository';

export function FilterBuilderDemo(){const[draft,setDraft]=useState<FilterQuery>(emptyFilterQuery),[applied,setApplied]=useState<FilterQuery>(emptyFilterQuery),[errors,setErrors]=useState<Record<string,string>>({});const rows=filterRecords(issueSeed,applied,issueFields,(row,key)=>row[key as keyof typeof row]);return <div className="filter-builder-demo"><FilterBuilder fields={issueFields} value={draft} onValueChange={value=>{setDraft(value);setErrors({});}} errors={errors}/><div className="actions"><Button onClick={()=>{const errors=validateFilterQuery(draft,issueFields);setErrors(errors);if(!Object.keys(errors).length)setApplied(draft);}}>Apply example filters</Button><span className="bui-hint" role="status">{rows.length} matching sample issues</span></div><ul className="filter-example-results">{rows.slice(0,3).map(row=><li key={row.id}><span>{row.id}</span>{row.title}</li>)}</ul></div>;}
