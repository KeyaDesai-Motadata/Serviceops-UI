import type { ReactNode } from 'react';
import { ChevronsLeft, ChevronsRight, Search } from 'lucide-react';

/* The product's grid and its pagination bar, built once.
 *
 * The pagination is the product's own shape and deliberately not a generic one:
 * first / page / last, then the size select with "Items Per Page" AFTER it, and
 * the "Showing 1-1 of N" count pushed to the far right. */

export interface Column<T> {
  key: string;
  header: string;
  /** Fixed width where the product pins one; otherwise the cell sizes itself. */
  width?: number;
  cell: (row: T) => ReactNode;
}

export function DataTable<T>({ columns, rows, empty, selectable = true, rowKey }: {
  columns: Column<T>[];
  rows: T[];
  empty: ReactNode;
  selectable?: boolean;
  rowKey: (row: T) => string;
}) {
  return (
    <div className="scroll-y min-h-0 flex-1 overflow-x-auto">
      <table className="w-full min-w-max">
        <thead>
          <tr className="border-b border-line">
            {selectable && (
              <th className="w-10 px-4 py-2.5 text-left">
                <input type="checkbox" className="size-3.5 rounded border-line accent-[#2563EB]" />
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c.key}
                style={c.width ? { width: c.width, minWidth: c.width } : undefined}
                className="whitespace-nowrap px-4 py-2.5 text-left text-[12.5px] font-semibold text-value"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-14 text-center text-[13px] text-label">
                {empty}
              </td>
            </tr>
          ) : rows.map((r) => (
            <tr key={rowKey(r)} className="border-b border-line-soft hover:bg-strip">
              {selectable && (
                <td className="px-4 py-2.5">
                  <input type="checkbox" className="size-3.5 rounded border-line accent-[#2563EB]" />
                </td>
              )}
              {columns.map((c) => (
                <td key={c.key} className="whitespace-nowrap px-4 py-2.5 text-[12.5px] text-value">
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ total, noun = 'items', perPage = 25, onPerPage }: {
  total: number; noun?: string; perPage?: number; onPerPage?: (n: number) => void;
}) {
  return (
    <div className="flex flex-none flex-wrap items-center gap-3 border-t border-line px-4 py-2.5">
      <button className="flex size-7 items-center justify-center rounded text-label hover:bg-strip" title="First page">
        <ChevronsLeft size={15} />
      </button>
      <span className="flex h-7 min-w-7 items-center justify-center rounded border border-line px-2 text-[12.5px] font-medium text-ink">1</span>
      <button className="flex size-7 items-center justify-center rounded text-label hover:bg-strip" title="Last page">
        <ChevronsRight size={15} />
      </button>
      <select
        value={perPage}
        onChange={(e) => onPerPage?.(Number(e.target.value))}
        className="h-7 rounded border border-line bg-white px-2 text-[12.5px] text-value"
      >
        {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <span className="text-[12.5px] text-label">Items Per Page</span>
      <span className="ml-auto text-[12.5px] text-label">
        Showing {total === 0 ? 0 : 1}-{total} of {total} {noun}
      </span>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Select field to search...' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative flex-1">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-line bg-white pl-3 pr-9 text-[12.5px] text-value placeholder:text-label focus:border-link focus:outline-none"
      />
      <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-label" />
    </div>
  );
}

/* The vertical bucket nav from the endpoint page's Patches tab — a left column
 * of states, the selected one filled near-black. Horizontal pills were the
 * prototype's idea; the product stacks them. */
export function SideNav({ items, active, onChange }: {
  items: { id: string; label: string }[]; active: string; onChange: (id: string) => void;
}) {
  return (
    <nav className="w-[170px] flex-none border-r border-line py-1">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={`mx-2 mb-1 flex h-8 w-[calc(100%-16px)] items-center rounded-md px-3 text-left text-[12.5px] font-medium transition-colors ${
            active === it.id ? 'bg-ink text-white' : 'text-ink-soft hover:bg-strip'
          }`}
        >
          {it.label}
        </button>
      ))}
    </nav>
  );
}

export const IdPill = ({ children }: { children: ReactNode }) => (
  <span className="inline-block rounded bg-chip px-2 py-0.5 text-[12px] font-semibold text-ink">{children}</span>
);
