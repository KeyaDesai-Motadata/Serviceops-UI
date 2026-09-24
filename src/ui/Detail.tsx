import type { ReactNode, ComponentType } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, MoreVertical, Tag, Plus, Maximize2 } from 'lucide-react';

/* The detail-page parts, taken from the two reference screens.
 *
 * Both pages are built the same way — header, key-field grid, tag row, an
 * optional description card, a pill tab bar, then the tab's body with a rail
 * of "Other Info" pinned right. These are those parts, so an OS Upgrade page
 * and a Deployment page cannot drift from each other or from the product. */

// ── header ────────────────────────────────────────────────────────────────

export function DetailHeader({
  icon: Icon, id, title, subtitle, dot, action, paging = true, onBack,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  id: string;
  title: string;
  /** The timestamp line the endpoint page carries under its title. */
  subtitle?: ReactNode;
  /** Health dot before the id pill, as on the endpoint page. */
  dot?: string;
  /** The one dark primary button (Scan Now / Deploy), or a Decline-style action. */
  action?: ReactNode;
  /** Record paging. Off where the product does not offer it (a deployment run). */
  paging?: boolean;
  onBack?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 px-5 pt-4">
      <button onClick={onBack} className="mt-0.5 flex size-6 flex-none items-center justify-center rounded text-ink-soft hover:bg-strip">
        <ChevronLeft size={18} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {dot && <span className="size-2.5 flex-none rounded-full" style={{ background: dot }} />}
          <span className="inline-flex items-center gap-1.5 rounded-md bg-chip px-2 py-1 text-[12px] font-semibold text-ink">
            <Icon size={13} className="text-ink-soft" />
            {id}
          </span>
          <h1 className="truncate text-[17px] font-semibold text-ink">{title}</h1>
        </div>
        {subtitle && <div className="mt-1 text-[12px] text-label">{subtitle}</div>}
      </div>

      {/* Record paging, refresh, the page's own action, then the kebab. */}
      <div className="flex flex-none items-center gap-1.5">
        {paging && (
          <>
            <button className="flex size-8 items-center justify-center rounded-md border border-line text-ink-soft hover:bg-strip" title="Previous record">
              <ChevronLeft size={16} />
            </button>
            <button className="flex size-8 items-center justify-center rounded-md border border-line text-ink-soft hover:bg-strip" title="Next record">
              <ChevronRight size={16} />
            </button>
          </>
        )}
        <button className="flex size-8 items-center justify-center rounded-md border border-line text-ink-soft hover:bg-strip" title="Refresh">
          <RefreshCw size={15} />
        </button>
        {action}
        <button className="flex size-8 items-center justify-center rounded-md text-ink-soft hover:bg-strip" title="More">
          <MoreVertical size={17} />
        </button>
      </div>
    </div>
  );
}

export const PrimaryAction = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
  <button onClick={onClick} className="flex h-8 items-center gap-1.5 rounded-md bg-ink px-3 text-[12.5px] font-medium text-white hover:bg-ink-soft">
    {children}
  </button>
);

export const DangerAction = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
  <button onClick={onClick} className="flex h-8 items-center gap-1.5 rounded-md bg-risk-soft px-3 text-[12.5px] font-medium text-risk hover:brightness-95">
    {children}
  </button>
);

// ── key fields ────────────────────────────────────────────────────────────

export interface Field { label: string; value: ReactNode; }

/** The label-over-value grid under the header. Five to a row, as the product has. */
export function KeyFields({ fields, cols = 5 }: { fields: Field[]; cols?: number }) {
  return (
    <div
      className="grid gap-x-6 gap-y-5 px-5 py-5"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {fields.map((f, i) => (
        <div key={i} className="min-w-0">
          <div className="mb-1.5 text-[12px] text-label">{f.label}</div>
          <div className="break-words text-[13px] text-value">{f.value}</div>
        </div>
      ))}
    </div>
  );
}

export const Dash = () => <span className="text-label">---</span>;

export const Dot = ({ color, children }: { color: string; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="size-2 flex-none rounded-full" style={{ background: color }} />
    {children}
  </span>
);

export const TagRow = () => (
  <div className="flex items-center gap-2 px-5 pb-4">
    <span className="flex size-7 items-center justify-center rounded-md border border-line text-ink-soft">
      <Tag size={14} />
    </span>
    <button className="flex size-7 items-center justify-center rounded-md bg-ink text-white hover:bg-ink-soft" title="Add tag">
      <Plus size={14} />
    </button>
  </div>
);

/** The bordered "Patch Details" style card — a heading, prose, and an expander. */
export const DescriptionCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="mx-5 mb-4 rounded-lg border border-line px-4 py-3">
    <div className="flex items-start justify-between gap-3">
      <h3 className="text-[13.5px] font-semibold text-ink">{title}</h3>
      <button className="flex size-6 flex-none items-center justify-center rounded text-label hover:bg-strip" title="Expand">
        <Maximize2 size={13} />
      </button>
    </div>
    <p className="mt-1.5 text-[13px] leading-relaxed text-value">{children}</p>
  </div>
);

// ── tabs ──────────────────────────────────────────────────────────────────

export interface TabDef { id: string; label: string; icon: ComponentType<{ size?: number; className?: string }>; }

/* Pill tabs on a grey strip, the active one filled near-black. Note this is the
 * same fill the left rail's active module and the primary button use. */
export function PillTabs({ tabs, active, onChange }: {
  tabs: TabDef[]; active: string; onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-strip px-5 py-2.5">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-medium transition-colors ${
            active === id ? 'bg-ink text-white' : 'text-ink-soft hover:bg-white'
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ── right rail ────────────────────────────────────────────────────────────

export function InfoRail({ sections }: { sections: { title: string; fields: Field[] }[] }) {
  return (
    <aside className="scroll-y w-[290px] flex-none border-l border-line bg-white px-5 py-4">
      {sections.map((s, i) => (
        <section key={i} className={i ? 'mt-6' : ''}>
          <h3 className="mb-3 text-[14px] font-semibold text-ink">{s.title}</h3>
          <div className="flex flex-col gap-3.5">
            {s.fields.map((f, j) => (
              <div key={j}>
                <div className="mb-1 text-[12px] text-label">{f.label}</div>
                <div className="break-words text-[13px] text-value">{f.value}</div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}
