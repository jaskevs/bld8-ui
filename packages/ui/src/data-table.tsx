'use client';
import { useMemo, useState, type ReactNode } from 'react';
import { Button, EmptyState, Input, Pagination } from './core.js';
export interface Column<T> { key: string; header: string; cell: (row: T) => ReactNode; sortValue?: (row: T) => string | number }
export interface DataTableProps<T> { caption: string; rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string; searchText?: (row: T) => string; pageSize?: number }
export function DataTable<T>({ caption, rows, columns, rowKey, searchText, pageSize = 5 }: DataTableProps<T>) {
  const [query, setQuery] = useState(''); const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; descending: boolean } | null>(null);
  const visible = useMemo(() => {
    const result = rows.filter(row => !searchText || searchText(row).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    const column = columns.find(item => item.key === sort?.key);
    if (column?.sortValue) { const get = column.sortValue; result.sort((a,b) => { const av = get(a), bv = get(b); const order = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), undefined, { numeric: true }); return sort?.descending ? -order : order; }); }
    return result;
  }, [rows, columns, searchText, query, sort]);
  const size = Math.max(1, Math.floor(pageSize)); const pages = Math.max(1, Math.ceil(visible.length / size)); const activePage = Math.min(page, pages);
  return <div className="bui-data-table">{searchText && <div className="bui-table-toolbar"><Input type="search" aria-label={'Search ' + caption.toLowerCase()} placeholder="Filter records…" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} /><span className="bui-hint" aria-live="polite">{visible.length} results</span></div>}<div className="bui-table-scroll" tabIndex={0} role="region" aria-label={caption + ' table'}><table className="bui-table"><caption className="bui-sr-only">{caption}</caption><thead><tr>{columns.map(column => <th scope="col" key={column.key} aria-sort={column.sortValue ? sort?.key === column.key ? sort.descending ? 'descending' : 'ascending' : 'none' : undefined}>{column.sortValue ? <button type="button" onClick={() => { setSort({ key: column.key, descending: sort?.key === column.key && !sort.descending }); setPage(1); }}>{column.header}<span aria-hidden="true">{sort?.key === column.key ? sort.descending ? '↓' : '↑' : '↕'}</span></button> : column.header}</th>)}</tr></thead><tbody>{visible.slice((activePage - 1) * size, activePage * size).map(row => <tr key={rowKey(row)}>{columns.map(column => <td key={column.key}>{column.cell(row)}</td>)}</tr>)}</tbody></table></div>{visible.length === 0 && <EmptyState title="No matching records" action={<Button variant="secondary" size="sm" onClick={() => setQuery('')}>Clear filter</Button>}>Try another search.</EmptyState>}<Pagination page={activePage} totalPages={pages} onPageChange={setPage} /></div>;
}