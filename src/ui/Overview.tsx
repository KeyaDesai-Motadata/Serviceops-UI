import { useState, type ComponentType } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

/* The deployment Overview's cards, ported from the working prototype.
 *
 * An OS Upgrade run gets the count-and-preview card over the overall stats
 * beside one drill-down. ⚠️ There is deliberately NO Patches card: the payload
 * is an operating system image, and a card counting patches states the wrong
 * thing about what is being pushed.
 */

export interface StatusSplit { success: number; failed: number; inProgress: number; other: number; }

export const BREAKDOWN_STATUSES = [
  { key: 'success' as const, label: 'Success', color: '#16A34A' },
  { key: 'failed' as const, label: 'Failed', color: '#DC2626' },
  { key: 'inProgress' as const, label: 'In Progress', color: '#D97706' },
  { key: 'other' as const, label: 'Other', color: '#94A3B8' },
];

/** Count block beside the first three records — the Overview's top row. */
export function CountListCard({ label, icon: Icon, total, caption, items, onClick }: {
  label: string;
  icon: ComponentType<{ size?: number }>;
  total: number;
  caption: string;
  items: { key: string; primary: string; secondary?: string; dot: string }[];
  onClick?: () => void;
}) {
  const PREVIEW = 3;
  const rest = Math.max(0, items.length - PREVIEW);
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex size-7 flex-none items-center justify-center rounded bg-chip text-ink-soft"><Icon size={15} /></span>
        <h3 className="text-[14px] font-semibold text-ink">{label}</h3>
        {onClick && (
          <button onClick={onClick} className="ml-auto flex items-center gap-1 text-[12.5px] font-medium text-link hover:underline">
            View more<ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex w-[132px] flex-none flex-col items-center justify-center rounded-lg bg-strip px-4 py-5 text-center">
          <div className="text-[28px] font-semibold leading-none tabular-nums text-ink">{total}</div>
          <div className="mt-2 text-[12px] leading-tight text-label">{caption}</div>
        </div>

        <div className="min-w-0 flex-1">
          {items.slice(0, PREVIEW).map((it) => (
            <div key={it.key} className="mb-1.5 flex items-center gap-2.5 rounded-md bg-strip px-3 py-2 last:mb-0">
              <span className="size-2 flex-none rounded-full" style={{ background: it.dot }} />
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-value">{it.primary}</span>
              {it.secondary && <span className="flex-none text-[12px] text-label">{it.secondary}</span>}
            </div>
          ))}
          {rest > 0 && onClick && (
            <button onClick={onClick} className="mt-1 text-[12px] font-medium text-link hover:underline">+{rest} more ›</button>
          )}
        </div>
      </div>
    </div>
  );
}

/** One overall-status cell. `stretch` lets the 2×2 block fill the drill-down's height. */
export const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex h-full flex-col justify-center rounded-lg border border-line px-4 py-3">
    <div className="text-[12.5px] text-label">{label}</div>
    <div className="mt-1 text-[22px] font-semibold tabular-nums" style={{ color: value > 0 ? color : '#94A3B8' }}>{value}</div>
  </div>
);

/** Picker → proportional bar → tinted rows → separated total. */
export function StatusBreakdownCard({ title, icon: Icon, data, totalLabel, allLabel }: {
  title: string;
  icon: ComponentType<{ size?: number }>;
  data: Record<string, StatusSplit>;
  totalLabel: string;
  allLabel: string;
}) {
  const entries = Object.keys(data);
  const options = [allLabel, ...entries];
  const [selected, setSelected] = useState(allLabel);
  const [open, setOpen] = useState(false);

  // "All …" aggregates every entry; a named row drills into just that one.
  const d = selected === allLabel
    ? entries.reduce((a, k) => ({
        success: a.success + data[k].success, failed: a.failed + data[k].failed,
        inProgress: a.inProgress + data[k].inProgress, other: a.other + data[k].other,
      }), { success: 0, failed: 0, inProgress: 0, other: 0 } as StatusSplit)
    : (data[selected] ?? { success: 0, failed: 0, inProgress: 0, other: 0 });
  const total = d.success + d.failed + d.inProgress + d.other;

  return (
    <div className="flex flex-col rounded-lg border border-line bg-white p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex size-7 flex-none items-center justify-center rounded bg-chip text-ink-soft"><Icon size={15} /></span>
        <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
      </div>

      <div className="relative mb-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex h-9 w-full items-center justify-between rounded-md border px-3 text-[12.5px] ${open ? 'border-link' : 'border-line hover:border-link'}`}
        >
          <span className="truncate text-value">{selected}</span>
          <ChevronDown size={15} className={`flex-none text-label transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[240px] overflow-y-auto rounded-md border border-line bg-white py-1 shadow-lg">
              {options.map((o) => (
                <button
                  key={o}
                  onClick={() => { setSelected(o); setOpen(false); }}
                  className={`block w-full px-3 py-2 text-left text-[12.5px] ${o === selected ? 'bg-chip font-medium text-ink' : 'text-value hover:bg-strip'}`}
                >
                  {o}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Proportional bar — the distribution at a glance, above the digits. */}
      <div className="mb-3 flex h-1.5 w-full gap-px overflow-hidden rounded-full">
        {total === 0
          ? <span className="flex-1 bg-chip" />
          : BREAKDOWN_STATUSES.filter((s) => d[s.key] > 0).map((s) => (
              <span key={s.key} style={{ flexGrow: d[s.key], background: s.color }} />
            ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {BREAKDOWN_STATUSES.map((s) => (
          <div key={s.key} className="flex items-center justify-between rounded-md bg-strip px-3 py-2">
            <span className="inline-flex items-center gap-2 text-[12.5px] text-label">
              <span className="size-2 flex-none rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: d[s.key] > 0 ? s.color : '#94A3B8' }}>
              {d[s.key]}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3">
        <span className="text-[12.5px] font-medium text-ink">{totalLabel}</span>
        <span className="text-[15px] font-bold tabular-nums text-ink">{total}</span>
      </div>
    </div>
  );
}
