import type { ReactNode } from 'react';

/* The OS Upgrade dashboard's two chart forms: a donut with the total in the
 * hole and its labels led out to the sides, and a vertical bar chart with a
 * value above each bar. */

export interface Slice { label: string; value: number; color: string; }

export function DonutSplit({ slices, size = 200, thickness = 44 }: {
  slices: Slice[]; size?: number; thickness?: number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const drawn = total === 0 ? [{ label: 'No data', value: 1, color: 'var(--color-line)' }] : slices.filter((s) => s.value > 0);
  const drawnTotal = drawn.reduce((s, x) => s + x.value, 0);

  let offset = 0;
  const mids: { label: string; value: number; color: string; angle: number }[] = [];
  const arcs = drawn.map((s) => {
    const len = (s.value / drawnTotal) * circ;
    const midAngle = ((offset + len / 2) / circ) * 360 - 90;
    mids.push({ label: s.label, value: s.value, color: s.color, angle: midAngle });
    const el = (
      <circle
        key={s.label}
        cx={c} cy={c} r={r} fill="none"
        stroke={s.color} strokeWidth={thickness}
        strokeDasharray={`${Math.max(len - 2, 0)} ${circ - Math.max(len - 2, 0)}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${c} ${c})`}
      >
        <title>{`${s.label}: ${s.value}`}</title>
      </circle>
    );
    offset += len;
    return el;
  });

  return (
    <div className="flex items-center justify-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Split">
        {arcs}
        <text x={c} y={c + 7} textAnchor="middle" fontSize={22} fontWeight={600} fill="var(--color-ink)">{total}</text>
      </svg>
      <div className="flex flex-col gap-2.5">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-[12.5px]">
            <span className="size-2.5 flex-none rounded-sm" style={{ background: s.color }} />
            <span className="text-value">{s.label}</span>
            <span className="ml-auto pl-5 font-semibold tabular-nums" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VBars({ rows, height = 210, axisLabel, yLabel, color = 'var(--color-risk)' }: {
  rows: { label: string; value: number }[];
  height?: number; axisLabel?: string; yLabel?: string; color?: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  const ticks = max <= 4 ? Array.from({ length: max + 1 }, (_, i) => i) : [0, Math.round(max / 2), max];
  return (
    <div className="flex gap-2">
      {yLabel && (
        <div className="flex items-center">
          <span className="whitespace-nowrap text-[11px] text-label" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{yLabel}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex" style={{ height }}>
          <div className="relative w-7 flex-none">
            {ticks.map((t) => (
              <span key={t} className="absolute right-1 -translate-y-1/2 text-[11px] tabular-nums text-label"
                style={{ top: `${100 - (t / max) * 100}%` }}>{t}</span>
            ))}
          </div>
          <div className="relative flex min-w-0 flex-1 items-end justify-around border-b border-l border-line px-2">
            {ticks.map((t) => (
              <span key={t} className="absolute left-0 right-0 border-t border-line-soft"
                style={{ bottom: `${(t / max) * 100}%` }} />
            ))}
            {rows.map((r) => (
              <div key={r.label} className="relative z-10 flex h-full flex-1 flex-col items-center justify-end">
                <span className="mb-1 text-[11.5px] font-semibold tabular-nums text-ink">{r.value}</span>
                <div
                  title={`${r.label}: ${r.value}`}
                  className="w-8 rounded-t transition-opacity hover:opacity-85"
                  style={{ height: `${(r.value / max) * 88}%`, background: r.value ? color : 'transparent' }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex pl-7">
          {rows.map((r) => (
            <span key={r.label} className="flex-1 px-1 pt-1.5 text-center text-[11px] leading-tight text-label">{r.label}</span>
          ))}
        </div>
        {axisLabel && <p className="mt-1.5 text-center text-[11.5px] text-label">{axisLabel}</p>}
      </div>
    </div>
  );
}

export function FpCard({ title, control, children }: { title: string; control?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col rounded-lg border border-line bg-white">
      <header className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        {control && <div className="ml-auto">{control}</div>}
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-5">{children}</div>
    </section>
  );
}
