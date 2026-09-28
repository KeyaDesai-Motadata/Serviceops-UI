import type { ReactNode } from 'react';
import { RefreshCw, Info, Menu } from 'lucide-react';

/* The dashboard's own furniture, as this product builds it: KPI tiles that
 * carry their own refresh and info, and widget cards with a title, the same
 * two icons, and a menu. */

/* A tile drills through when given onClick: the NUMBER is the control, because
 * that is what the reader is pointing at when they want the list behind it. */
export const KpiTile = ({ value, label, onClick, drillTo }: {
  value: number | string; label: string; onClick?: () => void; drillTo?: string;
}) => (
  <div className="relative rounded-lg border border-line bg-white px-4 pb-4 pt-3">
    <div className="absolute right-2 top-2 flex items-center gap-1">
      <button title="Refresh" className="flex size-6 items-center justify-center rounded text-label hover:bg-strip"><RefreshCw size={12} /></button>
      <button title={drillTo ? `Opens ${drillTo}` : 'About this metric'} className="flex size-6 items-center justify-center rounded text-label hover:bg-strip"><Info size={12} /></button>
    </div>
    {onClick ? (
      <button
        onClick={onClick}
        title={drillTo ? `Open ${drillTo}` : undefined}
        className="block text-[30px] font-semibold leading-none tabular-nums text-ink hover:text-link hover:underline"
      >
        {value}
      </button>
    ) : (
      <div className="text-[30px] font-semibold leading-none tabular-nums text-ink">{value}</div>
    )}
    <div className="mt-2 text-[12.5px] text-label">{label}</div>
  </div>
);

export const Widget = ({ title, control, children, className = '', center = false }: {
  title: string; control?: ReactNode; children: ReactNode; className?: string;
  /** A pie or donut centres in the card; rows of bars fill from the top. */
  center?: boolean;
}) => (
  <section className={`flex flex-col rounded-lg border border-line bg-white ${className}`}>
    <header className="flex items-start gap-2 px-4 pt-3">
      <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
      {control && <div className="ml-auto pr-2">{control}</div>}
      <div className={`flex flex-col items-end gap-1 ${control ? '' : 'ml-auto'}`}>
        <div className="flex items-center gap-1">
          <button title="Refresh" className="flex size-6 items-center justify-center rounded text-label hover:bg-strip"><RefreshCw size={12} /></button>
          <button title="About this widget" className="flex size-6 items-center justify-center rounded text-label hover:bg-strip"><Info size={12} /></button>
        </div>
        <button title="Widget menu" className="flex size-6 items-center justify-center rounded text-label hover:bg-strip"><Menu size={13} /></button>
      </div>
    </header>
    <div className={`flex flex-1 flex-col px-4 pb-4 pt-1 ${center ? 'items-center justify-center' : 'items-stretch justify-start'}`}>{children}</div>
  </section>
);

// ── pie with leader lines ─────────────────────────────────────────────────

export interface Slice { label: string; value: number; color: string; }

/* A pie, labelled the way this product labels one: a leader line from each
 * arc out to "Label: n (p%)", and the full category legend underneath — so a
 * slice too thin to label still has a name. */
export function Pie({ slices, size = 200 }: { slices: Slice[]; size?: number }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const drawn = slices.filter((s) => s.value > 0);
  const W = 640, H = size + 60;
  const cx = W / 2, cy = H / 2, r = size / 2;

  if (!total) {
    return <p className="py-14 text-[12.5px] text-label">No data for this selection.</p>;
  }

  let acc = 0;
  const arcs = drawn.map((s) => {
    const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += s.value;
    const a1 = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const mid = (a0 + a1) / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    // A single slice covering the whole pie can't be drawn as an arc.
    const d = drawn.length === 1
      ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
      : `M ${cx} ${cy} L ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`;
    return { ...s, d, mid, pct: ((s.value / total) * 100).toFixed(1) };
  });

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Distribution">
        {arcs.map((a) => <path key={a.label} d={a.d} fill={a.color} stroke="#fff" strokeWidth={2}><title>{`${a.label}: ${a.value}`}</title></path>)}
        {arcs.map((a) => {
          const right = Math.cos(a.mid) >= 0;
          const x1 = cx + (r + 2) * Math.cos(a.mid), y1 = cy + (r + 2) * Math.sin(a.mid);
          const x2 = cx + (r + 26) * Math.cos(a.mid), y2 = cy + (r + 26) * Math.sin(a.mid);
          const x3 = right ? x2 + 26 : x2 - 26;
          return (
            <g key={`l-${a.label}`}>
              <polyline points={`${x1},${y1} ${x2},${y2} ${x3},${y2}`} fill="none" stroke="var(--color-line)" strokeWidth={1} />
              <text
                x={right ? x3 + 5 : x3 - 5} y={y2 + 4}
                textAnchor={right ? 'start' : 'end'}
                fontSize={11.5} fill="var(--color-value)"
              >
                {`${a.label}: ${a.value} (${a.pct}%)`}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1.5">
        {slices.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-[11.5px] text-value">
            <span className="size-2.5 flex-none rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
