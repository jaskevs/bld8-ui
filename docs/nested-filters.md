# Nested filters and query migration

FilterBuilder keeps its existing flat API. Opt into groups with `allowGroups` and
an `AnyFilterQuery` value. IssueTable enables this mode and saves the applied tree
with its existing view state; `/blocks/issue-table` is the complete example.

```tsx
import {useState} from 'react';
import {FilterBuilder,emptyFilterQuery,type AnyFilterQuery} from '@bld8/ui';

const [draft,setDraft]=useState<AnyFilterQuery>(()=>emptyFilterQuery());
<FilterBuilder allowGroups fields={fields} value={draft}
  onValueChange={setDraft} errors={errors}/>
```

Adding a group or excluding the root changes a legacy draft to version 2.
Conditions retain their stable IDs, unfinished values and keyboard focus. Match
all is AND, Match any is OR, and Exclude negates the complete group's predicate.
The host validates and applies the draft; typing does not silently change results.
Removing a condition or group repairs focus to a nearby condition or its parent's
Add filter action. Groups use shared easing and live reduced-motion behaviour.

## The version 2 envelope

```ts
const filters = {
  version: 2,
  root: {
    id: 'root', match: 'all', not: false,
    children: [
      {id: 'alternatives', match: 'any', not: false, children: [
        {id: 'review', field: 'status', operator: 'anyOf', values: ['review']},
        {id: 'urgent', field: 'priority', operator: 'anyOf', values: ['urgent']}
      ]},
      {id: 'person', field: 'assignee', operator: 'anyOf', values: ['oliver']}
    ]
  }
};
```

This means `(Status = Review OR Priority = Urgent) AND Assignee = Oliver`.
A node is a condition or a group, never both. Every group and condition needs a
unique supported ID. IDs are independent of labels and query comparison ignores
them; changing a label should not recreate the draft's identity.

## Validation and transport

`validateFilterQuery`, `serializeFilterQuery`, `filterQueryKey` and `filterRecords`
accept both envelopes. Parsing stays explicit for existing callers:

```ts
const result=parseFilterQuery(text,fields,{allowNested:true});
if (!result.query) throw new Error('Invalid filters');
const matches=filterRecords(ownedRecords,result.query,fields,getValue);
```

Without `allowNested:true`, the parser retains its legacy `FilterQuery | null`
return and rejects version 2. This prevents an existing flat consumer from
unexpectedly receiving a recursive shape. The pure query module is available at
`@bld8/ui/filter-query` without a React client boundary.

IssueView and the issue HTTP adapter accept both versions. The GET query remains
`{view,page}`; `view.filters` carries the nested envelope without flattening it.
The server must validate with the same allowed fields/operators before evaluation
and apply ownership restrictions separately. This is a frontend query model, not
SQL, database-specific compilation, authentication or authorisation.

## Limits and incomplete drafts

Queries allow 20 conditions, 8 groups including the root, and depth 3 below the
root (root depth is zero). Builder `maxRules` may choose a smaller limit. Each
condition permits 50 values of at most 200 characters. Serialized input/output
is limited to 16,000 characters. Unsupported fields/operators, duplicate or
reserved prototype IDs, cyclic/shared node objects and malformed values reject.

An unnegated empty Match all root means no filter. An empty Match any root,
negated empty root or empty nested group is an invalid draft: add a condition or
remove the group. Invalid drafts remain visible and must not reach evaluation.
Removing the last nested condition therefore requires removing its empty group
or adding a replacement before Apply succeeds.

## Legacy migration

Version 1 links and saved views remain accepted. Both empty v1 Match all and
empty v1 Match any match every record. `migrateFilterQuery(old,fields)` explicitly
converts a valid legacy query; an empty v1 Match any becomes an empty Match all
root so that behaviour is preserved. Migration does not mutate the source and
chooses a noncolliding root ID. It throws for incomplete conditions; the builder
preserves its own incomplete drafts while changing editing modes.

Saved view parsing accepts v2 only after complete query validation. Selection,
records and view names remain outside share links; links do contain filter/search
values and should not hold secrets. Retained source releases keep their original
APIs; these additions belong to the current development source.
