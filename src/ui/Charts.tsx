import type { ReactNode } from 'react';

/* The Analytics tab's furniture: a donut with a legend beside it, the card that
 * frames one, and the light-row breakdown list the right column uses. */

export interface Slice { label: string; value: number; color: string; }

export function Donut({ slices, size = 230, thickness = 58 }: {
  slices: Slice[]; size?: number; thickness?: number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;

  /* Nothing recorded yet is a real state — an empty ring reads as broken, so a
   * zero total draws one full neutral band instead of no chart at all. */
  const drawn = total === 0 ? [{ label: 'No data', value: 1, color: '#E5E7EB' }] : slices.filter((s) => s.value > 0);
  const drawnTotal = drawn.reduce((s, x) => s + x.value, 0);

  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Status breakdown">
      {drawn.map((s) => {
        const len = (s.value / drawnTotal) * circ;
        const el = (
          <circle
            key={s.label}
            cx={c} cy={c} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${len} ${circ - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${c} ${c})`}
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

export const DonutLegend = ({ slices }: { slices: Slice[] }) => (
  <div className="flex flex-col gap-2">
    {slices.map((s) => (
      <div key={s.label} className="flex items-center gap-2.5 text-[12.5px]">
        <span className="size-2.5 flex-none rounded-sm" style={{ background: s.color }} />
        <span className="text-value">{s.label}</span>
        <span className="ml-auto pl-6 font-medium tabular-nums text-value">{s.value}</span>
      </div>
    ))}
  </div>
);

export function ChartCard({ title, subtitle, rate, children }: {
  title: string; subtitle?: string; rate?: string; children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line p-5">
      <div className="flex items-start gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[12px] text-label">{subtitle}</p>}
        </div>
        {rate && (
          <span className="ml-auto flex-none rounded bg-ok-soft px-2 py-1 text-[11.5px] font-medium text-ok">{rate}</span>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** The right column's breakdown: a picker, tinted rows, then a separated total. */
export function BreakdownCard({ title, options, value, onChange, rows, total }: {
  title: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  rows: { label: string; value: number }[];
  total?: { label: string; value: number };
}) {
  return (
    <div className="rounded-lg border border-line p-4">
      <h3 className="mb-3 text-[14px] font-semibold text-ink">{title}</h3>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mb-3 h-9 w-full rounded-md border border-line bg-white px-2.5 text-[12.5px] text-value focus:border-link focus:outline-none"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center rounded-md bg-strip px-3 py-2">
            <span className="text-[12.5px] text-value">{r.label}</span>
            <span className={`ml-auto text-[12.5px] font-medium tabular-nums ${r.value ? 'text-value' : 'text-label'}`}>{r.value}</span>
          </div>
        ))}
      </div>
      {total && (
        <div className="mt-3 flex items-center border-t border-line pt-3">
          <span className="text-[12.5px] font-medium text-ink">{total.label}</span>
          <span className="ml-auto text-[12.5px] font-semibold tabular-nums text-ink">{total.value}</span>
        </div>
      )}
    </div>
  );
}

/** The four overall-status boxes above the charts: label over a big number. */
export const StatBoxes = ({ stats }: { stats: { label: string; value: number; color?: string }[] }) => (
  <div className="grid grid-cols-4 gap-4">
    {stats.map((s) => (
      <div key={s.label} className="rounded-lg border border-line px-4 py-4 text-center">
        <div className="text-[12.5px] text-label">{s.label}</div>
        <div className="mt-1.5 text-[22px] font-semibold" style={{ color: s.value ? (s.color ?? '#16202B') : '#16202B' }}>
          {s.value}
        </div>
      </div>
    ))}
  </div>
);
