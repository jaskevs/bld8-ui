/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export const facetExamples = [
  {
    "id": "facets-table",
    "componentId": "faceted-filter",
    "title": "Grouped filters over table records",
    "description": "Whole-group selection, mixed states and readable selected summaries filter a local table.",
    "states": [
      "Grouped alternatives",
      "Counted options",
      "Clear filters"
    ],
    "keyboard": [
      "Search narrows choices; Space toggles a row or whole group.",
      "Escape closes the picker and returns focus."
    ],
    "source": "'use client';\nimport {useState} from 'react';\nimport {Avatar,Button,DataTable,FacetedFilter,type Column,type FacetOption} from '@bld8/ui';\ntype Row={id:string;title:string;status:string};\nconst rows:Row[]=[{id:'ISS-1',title:'Review keyboard focus',status:'review'},{id:'ISS-2',title:'Check responsive tables',status:'active'},{id:'ISS-3',title:'Document the reset path',status:'done'}];\nconst options:FacetOption[]=[{value:'review',label:'In review',group:'Open',count:1},{value:'active',label:'In progress',group:'Open',count:1},{value:'done',label:'Done',group:'Closed',count:1},{value:'archived',label:'Archived',group:'Closed',count:0}];\nconst columns:Column<Row>[]=[{key:'title',header:'Issue',cell:row=>row.title},{key:'status',header:'Status',cell:row=>options.find(option=>option.value===row.status)?.label}];\nexport function TableFacets(){const [selected,setSelected]=useState<string[]>([]);const visible=rows.filter(row=>!selected.length||selected.includes(row.status));return <section className=\"bui-stack\"><FacetedFilter label=\"Issue status\" options={options} value={selected} onValueChange={setSelected} showChips hint=\"Group selection includes choices hidden by search.\"/><DataTable caption=\"Filtered issues\" rows={visible} columns={columns} rowKey={row=>row.id}/><p role=\"status\">{visible.length} matching issues</p></section>;}\n"
  },
  {
    "id": "facets-resources",
    "componentId": "faceted-filter",
    "title": "Resource filters that combine dimensions",
    "description": "Types are alternatives; an owner filter narrows the same resource list.",
    "states": [
      "OR within a facet",
      "AND across facets",
      "Removable summaries"
    ],
    "keyboard": [
      "Tab moves between facets and removable summary buttons.",
      "Space toggles choices without closing the picker."
    ],
    "source": "'use client';\nimport {useState} from 'react';\nimport {Avatar,Button,DataTable,FacetedFilter,type Column,type FacetOption} from '@bld8/ui';\nconst resources=[{id:'brief',title:'Interface brief',type:'doc',owner:'design'},{id:'tokens',title:'Token reference',type:'code',owner:'engineering'},{id:'review',title:'Review notes',type:'doc',owner:'engineering'}];\nexport function ResourceFacets(){const [types,setTypes]=useState<string[]>([]),[owners,setOwners]=useState<string[]>([]);const visible=resources.filter(row=>(!types.length||types.includes(row.type))&&(!owners.length||owners.includes(row.owner)));return <section className=\"bui-stack\"><div className=\"bui-form-grid\"><FacetedFilter label=\"Resource type\" options={[{value:'doc',label:'Documents',group:'Content'},{value:'code',label:'Code',group:'Content'}]} value={types} onValueChange={setTypes} showChips/><FacetedFilter label=\"Resource owner\" options={[{value:'design',label:'Design'},{value:'engineering',label:'Engineering'}]} value={owners} onValueChange={setOwners} showChips/></div><ul aria-label=\"Filtered resources\">{visible.map(row=><li key={row.id}>{row.title}</li>)}</ul>{!visible.length&&<p>No resources match both filters.</p>}<p role=\"status\">{visible.length} resources</p><Button variant=\"ghost\" onClick={()=>{setTypes([]);setOwners([]);}}>Clear resource filters</Button></section>;}\n"
  },
  {
    "id": "facets-people",
    "componentId": "faceted-filter",
    "title": "People selection by discipline",
    "description": "Select a discipline or individual people while submitting canonical IDs.",
    "states": [
      "Whole discipline selection",
      "Native repeated values",
      "Uncontrolled reset"
    ],
    "keyboard": [
      "Arrow keys move through people and group headings.",
      "Space toggles a person; reset restores the initial selection."
    ],
    "source": "'use client';\nimport {useState} from 'react';\nimport {Avatar,Button,DataTable,FacetedFilter,type Column,type FacetOption} from '@bld8/ui';\nconst people:FacetOption[]=[{value:'maya',label:'Maya Chen',group:'Design',description:'Product design'},{value:'sam',label:'Sam Rivera',group:'Design',description:'Research'},{value:'oliver',label:'Oliver Reed',group:'Engineering',description:'UI engineering'},{value:'lee',label:'Lee Patel',group:'Engineering',disabled:true,description:'Unavailable'}];\nexport function PeopleFacets(){const [message,setMessage]=useState('');return <form className=\"bui-stack\" onSubmit={event=>{event.preventDefault();setMessage(new FormData(event.currentTarget).getAll('reviewers').join(', ')||'No reviewers');}}><FacetedFilter label=\"Reviewers\" name=\"reviewers\" options={people} defaultValue={['maya']} showChips/><div className=\"bui-between\"><Button type=\"reset\" variant=\"secondary\">Reset reviewers</Button><Button type=\"submit\">Use reviewers</Button></div><p role=\"status\">{message}</p></form>;}\n"
  }
];
