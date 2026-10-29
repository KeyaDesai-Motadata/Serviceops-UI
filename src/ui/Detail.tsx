import type { LucideIcon } from 'lucide-react';
import { useState, type ReactNode, type ComponentType } from 'react';
import {
  X, Minus, Square, Link2, Pencil, RefreshCw, MoreVertical, Search, ChevronDown, ChevronUp,
  FileText, Sparkles, Keyboard, Plus,
} from 'lucide-react';
import { IdPill } from './Table';

/* The new UI's record page, built once so every detail page reads the same:
 *
 *   record tab strip  (id · title · ✕, then minimise / maximise / close)
 *   header            (id pill + 18px title, the one-line KPI row under it,
 *                      link · edit · refresh · the page's action · kebab)
 *   underline tabs
 *   body              │ "<Record> Properties" panel (searchable field cards,
 *                     │  Ask AI box) │ mini icon rail
 *
 * The old prototype's key-field grid and "Other Info" rail both fold into the
 * Properties panel — every field they carried is still listed there. */

// ── record tab strip ───────────────────────────────────────────────────────

export function RecordTabs({ id, title, onClose }: { id: string; title: string; onClose?: () => void }) {
  return (
    <div className="flex h-[37px] flex-none items-stretch border-b border-[#e5e7eb] bg-[#F9FAFB]">
      <div className="flex min-w-0 max-w-[280px] items-center gap-2 border-b-2 border-[#3D8BD0] bg-white px-4">
        <span className="flex-none whitespace-nowrap text-[12px] font-semibold text-[#3D8BD0]">{id}</span>
        <span className="truncate text-[12px] text-[#364658]">{title}</span>
        <button onClick={onClose} title="Close" className="ml-1 flex-none text-[#7B8FA5] hover:text-[#364658]"><X size={14} /></button>
      </div>
      <div className="ml-auto flex items-center">
        <button title="Minimize panel" className="flex h-full items-center border-l border-[#e5e7eb] px-2.5 text-[#6b7280] hover:bg-[#e5e7eb]"><Minus size={16} /></button>
        <button title="Switch to small view" className="flex h-full items-center px-2.5 text-[#364658] hover:bg-[#e5e7eb]"><Square size={14} /></button>
        <button onClick={onClose} title="Close" className="flex h-full items-center px-2.5 text-[#364658] hover:bg-[#e5e7eb]"><X size={18} /></button>
      </div>
    </div>
  );
}

// ── header ────────────────────────────────────────────────────────────────

export interface Kpi { label: string; value: ReactNode }

/** "Label  Value" — the new UI's header KPI chip. */
export const KpiChip = ({ label, value }: Kpi) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
    <span className="text-[11px] text-[#7B8FA5]">{label}</span>
    <span className="text-[12px] font-medium text-[#364658]">{value}</span>
  </span>
);

export function DetailHeader({ id, title, badge, dot, kpis = [], action, menu = [] }: {
  id: string;
  title: string;
  /** A status tag beside the title, for a state that blocks the record. */
  badge?: ReactNode;
  /** Health dot before the id pill, as on the endpoint page. */
  dot?: string;
  /** The single-line KPI strip under the title. */
  kpis?: Kpi[];
  /** The page's own action(s): Approve / Decline, Scan Now. */
  action?: ReactNode;
  /** What the ⋮ menu offers. Without items the button is a plain icon. */
  menu?: MenuItem[];
}) {
  return (
    <div className="flex flex-none items-start justify-between gap-4 border-b border-[#e5e7eb] bg-white px-6 py-4">
      <div className="min-w-0 flex-1">
        <h1 className="flex min-w-0 items-center gap-2 text-[18px] font-semibold text-[#364658]">
          {dot && <span className="size-2.5 flex-none rounded-full" style={{ background: dot }} />}
          <IdPill>{id}</IdPill>
          <span className="truncate">{title}</span>
          {badge}
        </h1>
        {kpis.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {kpis.map((k, i) => (
              <span key={k.label} className="inline-flex items-center gap-2.5">
                {i > 0 && <span className="h-3 w-px bg-[#E5E7EB]" />}
                <KpiChip {...k} />
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-none items-center gap-2">
        {[{ icon: Link2, t: 'Copy URL' }, { icon: Pencil, t: 'Edit' }, { icon: RefreshCw, t: 'Refresh' }].map(({ icon: Icon, t }) => (
          <button key={t} title={t} className="inline-flex size-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] hover:bg-[#F5F7FA]">
            <Icon size={15} />
          </button>
        ))}
        {action}
        <HeaderMenu items={menu} />
      </div>
    </div>
  );
}

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  /** Why the item can't be used right now — shown under it, and the item is off. */
  disabledReason?: string;
}

/** The record's ⋮ menu: a 32px boxed button over a right-aligned list. */
function HeaderMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        title="More"
        onClick={() => items.length && setOpen((v) => !v)}
        className={`inline-flex size-8 items-center justify-center rounded border bg-white text-[#6b7280] hover:bg-[#F5F7FA] ${open ? 'border-[#3D8BD0]' : 'border-[#DFE5ED]'}`}
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-[230px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
            {items.map(({ label, icon: Icon, onClick, disabledReason }) => (
              <button
                key={label}
                disabled={!!disabledReason}
                onClick={() => { setOpen(false); onClick(); }}
                className="flex w-full items-start gap-2.5 px-3 py-2 text-left text-[13px] text-[#364658] enabled:hover:bg-[#F5F7FA] disabled:cursor-not-allowed"
              >
                {Icon && <Icon size={15} className={`mt-0.5 flex-none ${disabledReason ? 'text-[#CBD5E1]' : 'text-[#6B7280]'}`} />}
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
  );
}

export const PrimaryAction = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
  <button onClick={onClick} className="flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-4 text-[12px] font-medium text-white hover:bg-[#2d6ca0]">
    {children}
  </button>
);

export const ApproveAction = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
  <button onClick={onClick} className="flex h-8 items-center gap-1.5 rounded bg-[#16A34A] px-4 text-[12px] font-medium text-white hover:bg-[#15803D]">
    {children}
  </button>
);

export const DangerAction = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
  <button onClick={onClick} className="flex h-8 items-center gap-1.5 rounded bg-[#DC2626] px-4 text-[12px] font-medium text-white hover:bg-[#B91C1C]">
    {children}
  </button>
);

export const Dash = () => <span className="text-[#9ca3af]">---</span>;

export const Dot = ({ color, children }: { color: string; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="size-2 flex-none rounded-full" style={{ background: color }} />
    {children}
  </span>
);

/** Tag chips + "Add tag", as the Properties panel lists them. */
export function Tags({ initial = [] }: { initial?: string[] }) {
  const [tags, setTags] = useState(initial);
  return (
    <div className="flex flex-col items-start gap-1.5">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded bg-[#EEF2F6] px-2 py-0.5 text-[11px] text-[#364658]">
              {t}
              <button onClick={() => setTags(tags.filter((x) => x !== t))} className="text-[#64748B] hover:text-[#DC2626]"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
      <button className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3D8BD0] hover:underline">
        <Plus size={13} /> Add tag
      </button>
    </div>
  );
}

/** The Overview tab's Description card — heading, prose, View more. */
export function DescriptionCard({ title = 'Description', children }: { title?: string; children: ReactNode }) {
  const [more, setMore] = useState(false);
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-4">
      <h3 className="text-[14px] font-semibold text-[#364658]">{title}</h3>
      <p className={`mt-2 text-[13px] leading-relaxed text-[#364658] ${more ? '' : 'line-clamp-2'}`}>{children}</p>
      <button onClick={() => setMore((v) => !v)} className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline">
        View {more ? 'less' : 'more'} {more ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
    </div>
  );
}

// ── tabs ──────────────────────────────────────────────────────────────────

export interface TabDef {
  id: string; label: string;
  /** Kept on the type for the old tab tables; the new tab bar is text-only. */
  icon?: ComponentType<{ size?: number; className?: string }>;
  /** An amber dot on the tab: it holds something the user still has to do. */
  attention?: boolean;
}

/** Blue-underline tabs, as the new UI's record pages have. */
export function UnderlineTabs({ tabs, active, onChange }: {
  tabs: TabDef[]; active: string; onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-none items-center gap-3 border-b border-[#e5e7eb] bg-white px-6">
      {tabs.map(({ id, label, attention }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-3 text-[14px] font-medium transition-colors ${
            active === id ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA] hover:text-[#364658]'
          }`}
        >
          {label}
          {attention && <span className="size-1.5 flex-none rounded-full bg-[#D97706]" title="Action required" />}
        </button>
      ))}
    </div>
  );
}

// ── properties panel ──────────────────────────────────────────────────────

export interface Field { label: string; value: ReactNode; }

/* "<Record> Properties": search, then one collapsible card per field group,
 * label on the left and value on the right; the Ask AI box pinned under it
 * and the mini icon rail to the far right. The search filters by label. */
export function PropertiesPanel({ title, sections }: {
  title: string; sections: { title: string; fields: Field[] }[];
}) {
  const [q, setQ] = useState('');
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const query = q.trim().toLowerCase();

  return (
    <div className="flex flex-none">
      <aside className="flex w-[390px] flex-col border-l border-[#e5e7eb] bg-white">
        <div className="px-4 pt-3">
          <h2 className="text-[15px] font-semibold text-[#364658]">{title}</h2>
          <div className="relative mt-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search fields..."
              className="h-8 w-full rounded border border-[#DFE5ED] pl-8 pr-2 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none"
            />
          </div>
        </div>

        <div className="scroll-y min-h-0 flex-1 px-4 py-3">
          {sections.map((s) => {
            const fields = s.fields.filter((f) => !query || f.label.toLowerCase().includes(query));
            if (!fields.length) return null;
            const isClosed = closed[s.title] && !query;
            return (
              <section key={s.title} className="mb-3 rounded-lg border border-[#e5e7eb] bg-white">
                <button
                  onClick={() => setClosed((c) => ({ ...c, [s.title]: !c[s.title] }))}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left"
                >
                  <FileText size={15} className="text-[#364658]" />
                  <span className="text-[13px] font-semibold text-[#364658]">{s.title}</span>
                  <ChevronDown size={15} className={`ml-auto text-[#7B8FA5] transition-transform ${isClosed ? '-rotate-90' : ''}`} />
                </button>
                {!isClosed && (
                  <div className="flex flex-col gap-4 px-4 pb-4">
                    {fields.map((f) => (
                      <div key={f.label} className="grid grid-cols-[130px_minmax(0,1fr)] gap-3">
                        <div className="text-[12.5px] leading-5 text-[#364658]">{f.label}</div>
                        <div className="break-words text-[13px] leading-5 text-[#364658]">{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <div className="px-4 pb-3">
          <div
            className="flex cursor-pointer items-center gap-2 rounded-lg p-2.5 shadow-md"
            style={{
              background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, rgba(76,177,254,0.8) 0%, rgba(115,30,251,0.8) 41.49%, rgba(249,17,227,0.8) 100%) border-box',
              border: '2px solid transparent',
            }}
          >
            <Sparkles size={16} className="flex-shrink-0 text-[#7B4EFB]" />
            <span className="text-sm text-[#7B8FA5]">Ask AI for insights, summaries, and actions...</span>
          </div>
        </div>
      </aside>

      <div className="flex flex-none flex-col items-center gap-3 border-l border-[#DFE5ED] bg-[#F8F9FB] px-2 py-4">
        <button title={title} className="flex size-8 items-center justify-center rounded border border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]">
          <FileText size={16} />
        </button>
        <button title="Keyboard shortcuts" className="mt-auto flex size-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#64748B]">
          <Keyboard size={16} />
        </button>
      </div>
    </div>
  );
}

/** The full record frame: tab strip, header, tabs, body + properties panel. */
export function RecordPage({ id, title, onClose, header, tabs, panel, children }: {
  id: string; title: string; onClose?: () => void;
  header: ReactNode; tabs: ReactNode; panel: ReactNode; children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <RecordTabs id={id} title={title} onClose={onClose} />
      {header}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          {tabs}
          {children}
        </div>
        {panel}
      </div>
    </div>
  );
}
