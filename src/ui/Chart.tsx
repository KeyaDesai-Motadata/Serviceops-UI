import { Fragment, useState, type ReactNode } from 'react';
import { Table2, BarChart3 } from 'lucide-react';

/* Chart primitives.
 *
 * Mark spec, applied everywhere: thin marks, a 2px SURFACE GAP between adjacent
 * fills (so stacked segments read as separate quantities rather than one blur),
 * 4px rounded data-ends anchored to the baseline, 2px lines, and selective
 * direct labels — never a number on every point.
 *
 * Every chart carries a legend when it has 2+ series and a table view, so
 * identity is never colour-alone. Status hues are the validated set in
 * index.css; nothing here picks a colour of its own.
 */

export interface Seg { label: string; value: number; color: string; }
export interface Row { label: string; id: string; segments: Seg[]; }

// ── frame ─────────────────────────────────────────────────────────────────

export function ChartFrame({ title, subtitle, legend, table, children, wide }: {
  title: string;
  subtitle?: string;
  legend?: Seg[];
  /** Rendered when the reader switches to the table view. */
  table?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className={`rounded-lg border border-line bg-white p-4 ${wide ? 'col-span-2' : ''}`}>
      <header className="mb-4 flex items-start gap-3">
        <div className="min-w-0">
          <h3 className="text-[13.5px] font-semibold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[12px] text-label">{subtitle}</p>}
        </div>
        {table && (
          <button
            onClick={() => setAsTable((v) => !v)}
            title={asTable ? 'Show chart' : 'Show data table'}
            className="ml-auto flex size-7 flex-none items-center justify-center rounded-md text-label hover:bg-strip hover:text-ink"
          >
            {asTable ? <BarChart3 size={14} /> : <Table2 size={14} />}
          </button>
        )}
      </header>

      {asTable && table ? table : children}

      {/* A legend is always present for 2+ series — identity never rides on
          colour alone. */}
      {legend && legend.length > 1 && !asTable && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {legend.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5 text-[12px] text-label">
              <span className="size-2.5 flex-none rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

const Tip = ({ text }: { text: string }) => <title>{text}</title>;

// ── one composition, full width ───────────────────────────────────────────

export function StackedBarSingle({ segments, height = 40, unit = 'endpoints', lead }: {
  segments: Seg[]; height?: number; unit?: string;
  /** What the right-hand figure means. Omitted, no percentage is shown —
   *  "65% ready" is true of readiness and nonsense on a lifecycle split. */
  lead?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const shown = segments.filter((s) => s.value > 0);
  return (
    <div>
      <div className="flex w-full gap-[2px] overflow-hidden" style={{ height }}>
        {shown.map((s, i) => (
          <div
            key={s.label}
            title={`${s.label}: ${s.value.toLocaleString()} (${Math.round((s.value / total) * 100)}%)`}
            className="flex items-center justify-center transition-opacity hover:opacity-85"
            style={{
              width: `${(s.value / total) * 100}%`,
              background: s.color,
              borderRadius: shown.length === 1 ? 4 : i === 0 ? '4px 0 0 4px' : i === shown.length - 1 ? '0 4px 4px 0' : 0,
            }}
          >
            {/* Direct label inside the segment where it fits; the legend carries
                the rest. Never a number on every mark. */}
            {(s.value / total) > 0.08 && (
              <span className="px-2 text-[12px] font-semibold text-white">{s.value.toLocaleString()}</span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-label">
        <span>{total.toLocaleString()} {unit} in scope</span>
        {lead && <span>{Math.round((segments[0].value / total) * 100)}% {lead}</span>}
      </div>
    </div>
  );
}

// ── ranked bars, one measure ──────────────────────────────────────────────

export function RankedBars({ rows, color = 'var(--color-risk)', unit = '', onRow, drillTo, labelWidth = 180 }: {
  rows: { label: string; value: number }[]; color?: string; unit?: string;
  onRow?: (label: string) => void; drillTo?: string; labelWidth?: number;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (!rows.length) return <p className="py-10 text-center text-[12.5px] text-label">No data for this selection.</p>;
  return (
    <div className="flex w-full flex-col gap-2.5">
      {rows.map((r) => {
        const hint = drillTo ? `${r.label}: ${r.value.toLocaleString()}${unit} — open ${drillTo}` : `${r.label}: ${r.value.toLocaleString()}${unit}`;
        return (
          <div key={r.label} className="grid items-center gap-3" style={{ gridTemplateColumns: `minmax(0,${labelWidth}px) 1fr auto` }}>
            <button
              onClick={() => onRow?.(r.label)}
              disabled={!onRow}
              className={`truncate text-left text-[12px] ${onRow ? 'text-link hover:underline' : 'cursor-default text-value'}`}
              title={hint}
            >
              {r.label}
            </button>
            <div className="h-3.5 w-full rounded-sm bg-strip">
              <div
                role={onRow ? 'button' : undefined}
                onClick={onRow ? () => onRow(r.label) : undefined}
                title={hint}
                className={`h-full transition-opacity hover:opacity-85 ${onRow ? 'cursor-pointer' : ''}`}
                style={{ width: `${(r.value / max) * 100}%`, background: color, borderRadius: '2px 4px 4px 2px' }}
              />
            </div>
            <span className="w-10 text-right text-[12px] font-semibold tabular-nums text-ink">{r.value.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── rows of compositions ──────────────────────────────────────────────────

export function StackedRows({ rows, onRow, onSegment, labelWidth = 200 }: {
  rows: Row[]; onRow?: (id: string) => void;
  /** A segment carries BOTH coordinates the drill-through needs: which row, which status. */
  onSegment?: (id: string, segment: string) => void;
  labelWidth?: number;
}) {
  const max = Math.max(...rows.map((r) => r.segments.reduce((s, x) => s + x.value, 0)), 1);
  if (!rows.length) return <p className="py-10 text-center text-[12.5px] text-label">No data for this selection.</p>;
  return (
    <div className="flex w-full flex-col gap-2.5">
      {rows.map((r) => {
        const total = r.segments.reduce((s, x) => s + x.value, 0);
        return (
          <div key={r.id} className="grid items-center gap-3" style={{ gridTemplateColumns: `minmax(0,${labelWidth}px) 1fr auto` }}>
            <button
              onClick={() => onRow?.(r.id)}
              disabled={!onRow}
              className={`truncate text-left text-[12px] ${onRow ? 'text-link hover:underline' : 'cursor-default text-value'}`}
              title={r.label}
            >
              {r.label}
            </button>
            <div className="flex h-3.5 gap-[2px]" style={{ width: `${(total / max) * 100}%` }}>
              {r.segments.filter((s) => s.value > 0).map((s, i, arr) => (
                <div
                  key={s.label}
                  role={onSegment ? 'button' : undefined}
                  onClick={onSegment ? () => onSegment(r.id, s.label) : undefined}
                  title={`${r.label} — ${s.label}: ${s.value.toLocaleString()}`}
                  className={`h-full transition-opacity hover:opacity-85 ${onSegment ? 'cursor-pointer' : ''}`}
                  style={{
                    flexGrow: s.value,
                    background: s.color,
                    borderRadius: arr.length === 1 ? 4 : i === 0 ? '4px 0 0 4px' : i === arr.length - 1 ? '0 4px 4px 0' : 0,
                  }}
                />
              ))}
            </div>
            <span className="w-10 text-right text-[12px] font-semibold tabular-nums text-ink">{total.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── cumulative line ───────────────────────────────────────────────────────

export function CumulativeLine({ points, height = 170 }: {
  points: { x: string; ok: number; bad: number }[]; height?: number;
}) {
  if (points.length < 2) {
    return <p className="py-10 text-center text-[12.5px] text-label">Not enough completed installs yet to plot a curve.</p>;
  }
  const W = 560, H = height, PAD = { l: 34, r: 12, t: 10, b: 24 };
  const max = Math.max(...points.map((p) => p.ok + p.bad), 1);
  const x = (i: number) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b);
  const path = (k: 'ok' | 'bad') => points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p[k])}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Cumulative installs over the run">
      {/* Recessive grid — three ticks, every label naming a value the chart reaches. */}
      {[0, Math.round(max / 2), max].map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--color-line-soft)" strokeWidth={1} />
          <text x={PAD.l - 6} y={y(v) + 4} textAnchor="end" fontSize={10.5} fill="var(--color-label)">{v}</text>
        </g>
      ))}
      {points.map((p, i) => (
        i % Math.ceil(points.length / 6) === 0
          ? <text key={p.x} x={x(i)} y={H - 6} textAnchor="middle" fontSize={10.5} fill="var(--color-label)">{p.x}</text>
          : null
      ))}
      <path d={path('ok')} fill="none" stroke="var(--color-ok)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path('bad')} fill="none" stroke="var(--color-risk)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Emphasised endpoint, not a marker on every point. */}
      <circle cx={x(points.length - 1)} cy={y(points[points.length - 1].ok)} r={4.5} fill="var(--color-ok)" stroke="#fff" strokeWidth={2}>
        <Tip text={`Installed: ${points[points.length - 1].ok}`} />
      </circle>
      <circle cx={x(points.length - 1)} cy={y(points[points.length - 1].bad)} r={4.5} fill="var(--color-risk)" stroke="#fff" strokeWidth={2}>
        <Tip text={`Failed: ${points[points.length - 1].bad}`} />
      </circle>
    </svg>
  );
}

// ── cross-tab cells ───────────────────────────────────────────────────────

export function MatrixCells({ rows, cols, get }: {
  rows: string[]; cols: string[]; get: (r: string, c: string) => number;
}) {
  const max = Math.max(...rows.flatMap((r) => cols.map((c) => get(r, c))), 1);
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `auto repeat(${cols.length}, minmax(76px, 1fr))` }}>
        <span />
        {cols.map((c) => <span key={c} className="px-1 pb-1 text-center text-[11.5px] text-label">{c}</span>)}
        {rows.map((r) => (
          <Fragment key={r}>
            <span className="flex items-center pr-3 text-[12px] text-value">{r}</span>
            {cols.map((c) => {
              const v = get(r, c);
              return (
                <div
                  key={`${r}-${c}`}
                  title={`${r} · ${c}: ${v}`}
                  className="flex h-12 items-center justify-center rounded-sm text-[13px] font-semibold tabular-nums"
                  style={{
                    /* Sequential: ONE hue, light → dark. Never a rainbow. */
                    background: v ? `color-mix(in oklab, var(--color-link) ${12 + (v / max) * 58}%, white)` : 'var(--color-strip)',
                    color: v && (v / max) > 0.55 ? '#fff' : v ? 'var(--color-ink)' : 'var(--color-label)',
                  }}
                >
                  {v}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ── shared table view ─────────────────────────────────────────────────────

export const DataTableView = ({ head, rows }: { head: string[]; rows: (string | number)[][] }) => (
  <table className="w-full">
    <thead>
      <tr className="border-b border-line">
        {head.map((h, i) => (
          <th key={h} className={`px-2 py-1.5 text-[12px] font-semibold text-value ${i ? 'text-right' : 'text-left'}`}>{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((r, i) => (
        <tr key={i} className="border-b border-line-soft">
          {r.map((c, j) => (
            <td key={j} className={`px-2 py-1.5 text-[12px] ${j ? 'text-right tabular-nums text-ink' : 'text-value'}`}>{c}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

// ── census strip ──────────────────────────────────────────────────────────

/* The one pattern worth taking from the reference dashboard: a leading total,
 * then the estate split across it. Zeros stay visible — "nothing left on
 * Windows 8" is a finding, and a hidden zero reads as missing data. */
export function CensusStrip({ total, totalLabel, rows, icon }: {
  total: number; totalLabel: string; rows: { label: string; value: number }[]; icon: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-stretch rounded-lg border border-line bg-white">
      <div className="flex items-center gap-3 border-r border-line px-5 py-4">
        <span className="flex size-10 flex-none items-center justify-center rounded-full bg-chip text-ink-soft">{icon}</span>
        <div>
          <div className="text-[12.5px] text-label">{totalLabel}</div>
          <div className="mt-0.5 text-[22px] font-semibold leading-none tabular-nums text-ink">{total}</div>
        </div>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="flex-1 border-r border-line px-5 py-4 text-center last:border-r-0">
          <div className="text-[12.5px] text-label">{r.label}</div>
          <div
            className="mt-0.5 text-[22px] font-semibold leading-none tabular-nums"
            style={{ color: r.value ? 'var(--color-link)' : 'var(--color-none)' }}
          >
            {r.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── flow rows ─────────────────────────────────────────────────────────────

/* from → to, with the population on the hop. A pair of labels joined by an
 * arrow says "upgrade" in a way no bar or slice does. */
export function FlowRows({ rows }: { rows: { from: string; to: string; value: number }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div key={`${r.from}-${r.to}`} className="rounded-md bg-strip px-3 py-2">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="truncate text-value" title={r.from}>{r.from}</span>
            <span className="flex-none text-label">→</span>
            <span className="truncate font-medium text-ink" title={r.to}>{r.to}</span>
            <span className="ml-auto flex-none font-semibold tabular-nums text-ink">{r.value}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-white">
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: 'var(--color-ok)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
