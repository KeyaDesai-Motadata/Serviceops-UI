import { useState, type ReactNode } from 'react';
import {
  PanelLeft, Sparkles, Plus, Type, Calendar, MessagesSquare, Bell, History,
  Settings, Keyboard, Info, Gauge, Ticket, Users, GitCompareArrows, Share2,
  Monitor, Database, ShieldCheck, Layers, Cog, Box, Network, Lightbulb,
  FileBarChart, UserCheck, ListChecks, UsersRound, Rocket, ClipboardCheck,
} from 'lucide-react';

/* The product shell: a narrow icon rail on the left, a white top bar, and the
 * page filling the rest. Both reference screenshots share it exactly, so every
 * screen in here is built inside it rather than inventing its own frame. */

const RAIL = [
  { icon: Gauge, title: 'Dashboard' },
  { icon: Ticket, title: 'Request' },
  { icon: Users, title: 'Users' },
  { icon: GitCompareArrows, title: 'Change' },
  { icon: Share2, title: 'Release' },
  { icon: Monitor, title: 'Assets' },
  { icon: Database, title: 'CMDB' },
  { icon: ShieldCheck, title: 'Vulnerability' },
  { icon: Layers, title: 'BOM' },
  { icon: Cog, title: 'Patch', active: true },
  { icon: Box, title: 'Packages' },
  { icon: Network, title: 'Topology' },
  { icon: Lightbulb, title: 'Knowledge' },
  { icon: FileBarChart, title: 'Reports' },
  { icon: UserCheck, title: 'Approvals' },
  { icon: ListChecks, title: 'Tasks' },
  { icon: UsersRound, title: 'Groups' },
];

const TOP_ICONS = [Type, Calendar, MessagesSquare, Bell, History, Settings, Keyboard, Info];

/* The Patch module's sub-pages, as the product's sidebar lists them. Hovering
 * the rail icon opens the flyout; this is the only way into the three pages,
 * because that is how the product works. */
const PATCH_ITEMS: { icon: typeof Cog; label: string; page?: string }[] = [
  { icon: Cog, label: 'Patches', page: 'patches' },
  { icon: Rocket, label: 'Patch Deployment', page: 'deployments' },
  { icon: Monitor, label: 'Endpoint', page: 'endpoints' },
  { icon: ClipboardCheck, label: 'Automatic Patch Test' },
  { icon: Settings, label: 'Automatic Patch Deployment' },
];

export function Shell({ children, page, onNavigate }: {
  children: ReactNode;
  /** Which patch sub-page is showing, so the flyout can mark it. */
  page?: string;
  onNavigate?: (page: string) => void;
}) {
  const [flyout, setFlyout] = useState(false);

  return (
    <div className="flex h-full bg-white">
      {/* Icon rail. The active module carries the same near-black fill the
          active tab pill does — one "selected" language across the product. */}
      <nav className="relative flex w-[52px] flex-none flex-col items-center gap-1 border-r border-line bg-white py-3">
        {RAIL.map(({ icon: Icon, title, active }, i) => (
          active ? (
            <div
              key={i}
              className="relative"
              onMouseEnter={() => setFlyout(true)}
              onMouseLeave={() => setFlyout(false)}
            >
              <button className="flex size-9 items-center justify-center rounded-lg bg-ink text-white">
                <Icon size={18} strokeWidth={1.7} />
              </button>

              {flyout && (
                <div className="absolute left-full top-0 z-50 ml-1 w-[248px] rounded-lg border border-line bg-white py-1.5 shadow-lg">
                  <div className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-label">Patch</div>
                  {PATCH_ITEMS.map((it) => (
                    <button
                      key={it.label}
                      disabled={!it.page}
                      onClick={() => { if (it.page) { onNavigate?.(it.page); setFlyout(false); } }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12.5px] transition-colors ${
                        !it.page ? 'cursor-default text-label/60'
                        : page === it.page ? 'bg-chip font-medium text-ink'
                        : 'text-value hover:bg-strip'
                      }`}
                    >
                      <it.icon size={15} className={page === it.page ? 'text-ink' : 'text-label'} />
                      {it.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              key={i}
              title={title}
              className="flex size-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-strip"
            >
              <Icon size={18} strokeWidth={1.7} />
            </button>
          )
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] flex-none items-center gap-3 border-b border-line bg-white px-4">
          <button className="flex size-8 items-center justify-center rounded text-ink-soft hover:bg-strip" title="Collapse">
            <PanelLeft size={18} />
          </button>
          <span className="select-none text-[19px] font-semibold tracking-tight text-ink">motadata</span>

          <div className="ml-auto flex items-center gap-1.5">
            <button className="flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-[12.5px] font-medium text-ink hover:bg-strip">
              <Sparkles size={14} className="text-[#7C3AED]" />
              Ask AI
            </button>
            <button className="flex size-8 items-center justify-center rounded-md bg-link text-white hover:brightness-95" title="Create">
              <Plus size={17} />
            </button>
            {TOP_ICONS.map((Icon, i) => (
              <button key={i} className="flex size-8 items-center justify-center rounded text-ink-soft hover:bg-strip">
                <Icon size={16} strokeWidth={1.8} />
              </button>
            ))}
            <span className="ml-1 flex size-8 items-center justify-center rounded-md bg-link text-[12px] font-semibold text-white">KE</span>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden bg-white">{children}</main>
      </div>
    </div>
  );
}
