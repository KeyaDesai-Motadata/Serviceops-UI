import type { LucideIcon } from 'lucide-react';
import { useState, type ReactNode, type ComponentType } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronDown, Search, X, Filter, Download, RefreshCw, ArrowUpDown,
  SlidersHorizontal, MoreVertical, PanelLeft, Plus, Check,
} from 'lucide-react';

/* The new UI's listing parts, built once: the page head (panel toggle · title ·
 * saved-view picker · blue Create), the KPI card strip, the icon toolbar, the
 * borderless grid with UPPERCASE headers and blue id pills, and the
 * "Showing 1–N of N · Rows per page · ‹ 1 ›" pagination bar. */

export interface Column<T> {
  key: string;
  header: string;
  /** Fixed width where the product pins one; otherwise the cell sizes itself. */
  width?: number;
  cell: (row: T) => ReactNode;
}

export function DataTable<T>({ columns, rows, empty, selectable = true, rowKey, onRowClick, selected, onSelectedChange }: {
  columns: Column<T>[];
  rows: T[];
  empty: ReactNode;
  selectable?: boolean;
  rowKey: (row: T) => string;
  /** The whole row opens the record, as in the new UI's grids. */
  onRowClick?: (row: T) => void;
  /** Controlled selection — pass both to make the checkboxes real (bulk actions). */
  selected?: Set<string>;
  onSelectedChange?: (next: Set<string>) => void;
}) {
  const controlled = !!selected && !!onSelectedChange;
  const keys = rows.map(rowKey);
  const allOn = controlled && keys.length > 0 && keys.every((k) => selected!.has(k));
  const toggle = (k: string) => {
    if (!controlled) return;
    const next = new Set(selected); next.has(k) ? next.delete(k) : next.add(k); onSelectedChange!(next);
  };
  return (
    <div className="scroll-y min-h-0 flex-1 overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="border-b border-[#e5e7eb]">
            {selectable && (
              <th className="w-10 py-3 pl-6 pr-2 text-left">
                <input
                  type="checkbox"
                  className="size-4 rounded border-[#CBD5E1] accent-[#3D8BD0]"
                  {...(controlled ? { checked: allOn, onChange: () => onSelectedChange!(allOn ? new Set() : new Set(keys)) } : {})}
                />
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c.key}
                style={c.width ? { width: c.width, minWidth: c.width } : undefined}
                className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb] bg-white">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-14 text-center text-[13px] text-[#7B8FA5]">
                {empty}
              </td>
            </tr>
          ) : rows.map((r) => (
            <tr
              key={rowKey(r)}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={`hover:bg-[#f9fafb] ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {selectable && (
                <td className="py-3 pl-6 pr-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="size-4 rounded border-[#CBD5E1] accent-[#3D8BD0]"
                    {...(controlled ? { checked: selected!.has(rowKey(r)), onChange: () => toggle(rowKey(r)) } : {})}
                  />
                </td>
              )}
              {columns.map((c) => (
                <td key={c.key} className="whitespace-nowrap px-4 py-3 text-[13px] text-[#364658]">
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

/* Unlike the new UI's grids, the bar is shown even for short lists: the old
 * prototype always printed the count, and the count is information. */
export function Pagination({ total, noun, perPage: initial = 25 }: {
  total: number; noun?: string; perPage?: number;
}) {
  const [perPage, setPerPage] = useState(initial);
  const arrow = 'flex h-8 w-8 items-center justify-center rounded-md border border-[#DFE5ED] bg-white text-[#64748B] disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <div className="flex flex-none flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] bg-white px-6 py-2.5">
      <span className="text-[12px] tabular-nums text-[#64748B]">
        {total === 0 ? 'No results' : (
          <>Showing <span className="font-medium text-[#364658]">1–{Math.min(total, perPage)}</span> of{' '}
          <span className="font-medium text-[#364658]">{total}</span>{noun && noun !== 'items' ? ` ${noun}` : ''}</>
        )}
      </span>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-[12px] text-[#64748B]">Rows per page</span>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="h-8 cursor-pointer rounded border border-[#DFE5ED] bg-white pl-2.5 text-[12px] font-medium text-[#364658] focus:border-[#3D8BD0] focus:outline-none"
          >
            {[10, 20, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button disabled className={arrow} title="Previous page"><ChevronLeft size={16} /></button>
          <span className="flex h-8 min-w-8 items-center justify-center rounded bg-[#EBF5FF] px-2 text-[12px] font-semibold text-[#3D8BD0]">1</span>
          <button disabled className={arrow} title="Next page"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative w-full max-w-[420px] flex-1">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded border border-[#DFE5ED] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/* Bucket filter pills with a count badge — the new UI's Endpoint-tab buckets
 * (Missing · Installed · Ignored), replacing the old stacked side nav. */
export function BucketPills({ items, active, onChange }: {
  items: { id: string; label: string; count?: number }[]; active: string; onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((it) => {
        const on = it.id === active;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
              on ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#364658] hover:border-[#3D8BD0] hover:bg-[#F5F7FA]'
            }`}
          >
            {it.label}
            {it.count !== undefined && (
              <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold ${
                on ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#64748B]'
              }`}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export const IdPill = ({ children }: { children: ReactNode }) => (
  <span className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[13px] font-semibold text-[#3D8BD0]">{children}</span>
);

/** A grey count box, as the new grids print Missing / Installed System. */
export const CountChip = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex min-w-[46px] items-center justify-center rounded bg-[#F1F5F9] px-3 py-0.5 text-[12px] font-medium tabular-nums text-[#364658]">{children}</span>
);

// ── listing chrome ────────────────────────────────────────────────────────

export interface ViewOption { id: string; label: string }

/** Page head: panel toggle, title, optional saved-view picker, then the CTA. */
export function ListingHeader({ title, views, view, onView, cta }: {
  title: string;
  /** Saved views. With them the title becomes the active view's name, as in the new UI. */
  views?: ViewOption[];
  view?: string;
  onView?: (id: string) => void;
  cta?: { label: string; onClick?: () => void };
}) {
  const [open, setOpen] = useState(false);
  const current = views?.find((v) => v.id === view);
  return (
    <div className="flex flex-none items-center gap-3 px-6 pb-3 pt-3">
      <button title="Toggle panel" className="flex size-8 items-center justify-center rounded border border-[#DFE5ED] text-[#64748B] hover:bg-[#F5F7FA]">
        <PanelLeft size={16} />
      </button>
      {views ? (
        <div className="relative">
          <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 text-[18px] font-semibold text-[#364658] hover:text-[#3D8BD0]">
            {current?.label ?? title}
            <ChevronDown size={16} className={`text-[#7B8FA5] transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 w-[260px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
                <div className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">{title}</div>
                {views.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { onView?.(v.id); setOpen(false); }}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] ${
                      v.id === view ? 'bg-[#F1F5F9] text-[#364658]' : 'text-[#364658] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    {v.label}
                    {v.id === view && <Check size={15} className="text-[#3D8BD0]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <h1 className="text-[18px] font-semibold text-[#364658]">{title}</h1>
      )}
      {cta && (
        <button onClick={cta.onClick} className="ml-auto flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0]">
          <Plus size={15} /> {cta.label}
        </button>
      )}
    </div>
  );
}

export interface KpiCard {
  label: string; value: number | string; sub?: string; color?: string;
  onClick?: () => void; active?: boolean;
}

/** The "List + KPI" strip: one bordered card per figure, a click filters the grid. */
export function KpiStrip({ cards }: { cards: KpiCard[] }) {
  return (
    <div className="grid flex-none gap-3 px-6 pb-3" style={{ gridTemplateColumns: `repeat(${cards.length}, minmax(0, 1fr))` }}>
      {cards.map((c) => (
        <button
          key={c.label}
          onClick={c.onClick}
          className={`rounded-lg border bg-white px-4 py-3 text-left transition-colors ${
            c.active ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : 'border-[#DFE5ED] hover:border-[#3D8BD0]'
          } ${c.onClick ? '' : 'cursor-default'}`}
        >
          <div className="text-[13px] text-[#64748B]">{c.label}</div>
          <div className="mt-1 text-[22px] font-semibold tabular-nums" style={{ color: c.color ?? '#364658' }}>{c.value}</div>
          {c.sub && <div className="mt-0.5 text-[11px] text-[#7B8FA5]">{c.sub}</div>}
        </button>
      ))}
    </div>
  );
}

const ToolBtn = ({ icon: Icon, title }: { icon: LucideIcon; title: string }) => (
  <button title={title} className="flex size-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#64748B] hover:bg-[#F5F7FA]">
    <Icon size={15} />
  </button>
);

/** Search + Filters on the left, the grid's icon actions on the right. */
export function Toolbar({ search, onSearch, placeholder, children, more = true }: {
  search: string; onSearch: (v: string) => void; placeholder?: string;
  /** Chips that explain the current filter, shown after the Filters button. */
  children?: ReactNode;
  /** The ⋮ at the far right. Off on pages that have nothing behind it. */
  more?: boolean;
}) {
  return (
    <div className="flex flex-none flex-wrap items-center gap-2 px-6 pb-3">
      <SearchBar value={search} onChange={onSearch} placeholder={placeholder} />
      <button className="flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] hover:bg-[#F5F7FA]">
        <Filter size={14} /> Filters
      </button>
      {children}
      <div className="ml-auto flex items-center gap-2">
        <ToolBtn icon={Download} title="Export" />
        <ToolBtn icon={RefreshCw} title="Refresh" />
        <ToolBtn icon={ArrowUpDown} title="Sort" />
        <ToolBtn icon={SlidersHorizontal} title="Columns" />
        {more && <ToolBtn icon={MoreVertical} title="More" />}
      </div>
    </div>
  );
}

/** A removable chip naming an applied filter, so what is hidden is never invisible. */
export const FilterChip = ({ label, value, onClear }: { label: string; value: string; onClear: () => void }) => (
  <span className="inline-flex h-8 flex-none items-center gap-1.5 rounded border border-[#3D8BD0] bg-[#EBF5FF] px-2.5 text-[12px] text-[#364658]">
    <span className="text-[#64748B]">{label}:</span>
    <span className="font-medium">{value}</span>
    <button onClick={onClear} title="Clear this filter" className="text-[#64748B] hover:text-[#DC2626]"><X size={13} /></button>
  </span>
);

// ── bulk actions ──────────────────────────────────────────────────────────

export interface BulkAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  /** Why it can't run for this selection — shown under it, and the item is off. */
  disabledReason?: string;
}

/* The new UI's selection bar (PatchComputersTab): appears once rows are ticked —
   a neutral "Take Action" dropdown, the count in a blue chip, and a way out. */
export function BulkActionBar({ count, actions, onClear }: {
  count: number; actions: BulkAction[]; onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (!count) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-[#E3E8EF] bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_6px_rgba(16,24,40,0.06)]">
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex h-8 items-center gap-1.5 rounded border bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors ${open ? 'border-[#3D8BD0] bg-[#F8FAFC]' : 'border-[#DFE5ED] hover:bg-[#F5F7FA]'}`}
        >
          Take Action <ChevronDown size={14} className={`text-[#7B8FA5] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full z-50 mt-1 w-[240px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
              {actions.map(({ label, icon: Icon, onClick, disabledReason }) => (
                <button
                  key={label}
                  disabled={!!disabledReason}
                  onClick={() => { setOpen(false); onClick(); }}
                  className="flex w-full items-start gap-2.5 px-4 py-2 text-left text-[13px] text-[#364658] enabled:hover:bg-[#F9FAFB] disabled:cursor-not-allowed"
                >
                  {Icon && <Icon size={15} className={`mt-0.5 flex-shrink-0 ${disabledReason ? 'text-[#CBD5E1]' : 'text-[#6B7280]'}`} />}
                  <span className="min-w-0">
                    <span className={`block ${disabledReason ? 'text-[#9CA3AF]' : ''}`}>{label}</span>
                    {disabledReason && <span className="mt-0.5 block text-[11.5px] leading-[1.4] text-[#9CA3AF]">{disabledReason}</span>}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 text-[13px]">
        <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-md bg-[#EAF2FB] px-1.5 text-[12px] font-semibold tabular-nums text-[#3D8BD0]">{count}</span>
        <span className="text-[#64748B]">{count === 1 ? 'record' : 'records'} selected</span>
      </div>
      <button onClick={onClear} title="Clear selection" className="ml-auto flex size-7 items-center justify-center rounded text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#364658]">
        <X size={15} />
      </button>
    </div>
  );
}
