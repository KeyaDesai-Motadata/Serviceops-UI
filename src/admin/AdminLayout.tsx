import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ChevronLeft, ChevronDown, Search, House, Workflow, Sparkles, Users, Building2, Radio, ClipboardList,
  Ticket, BookOpen, CircleAlert, RefreshCcw, Rocket, Lightbulb, ListChecks, Network, Radar, ShieldCheck,
  Box, ShieldAlert, Layers, HardDrive, Truck, FileText, ShoppingCart, FolderKanban, ScrollText,
  MonitorDown, Settings2, Package, MonitorUp, LayoutTemplate, type LucideIcon,
} from 'lucide-react';

/* The new UI's admin hub frame: the product's icon rail gives way to a grouped
 * settings nav with "Back to app" as the way out. Only Patch Management is a
 * branch here (its modules as level-2 rows), and only OS Upgrade opens a
 * screen — the other rows are the nav's real names, shown so OS Upgrade sits
 * where an admin would look for it. */

interface NavRow { title: string; icon: LucideIcon; count?: number }

const NAV: { group: string; items: NavRow[] }[] = [
  { group: 'Intelligent Automation', items: [{ title: 'Automation', icon: Workflow, count: 10 }, { title: 'AI', icon: Sparkles, count: 5 }] },
  { group: 'Platform Configuration', items: [
    { title: 'Users', icon: Users, count: 11 }, { title: 'Organization', icon: Building2, count: 9 },
    { title: 'Support Channels', icon: Radio, count: 6 }, { title: 'User Survey', icon: ClipboardList, count: 2 },
  ] },
  { group: 'Service Desk', items: [
    { title: 'Request Management', icon: Ticket, count: 12 }, { title: 'Service Catalog', icon: BookOpen, count: 1 },
    { title: 'Problem Management', icon: CircleAlert, count: 7 }, { title: 'Change Management', icon: RefreshCcw, count: 12 },
    { title: 'Release Management', icon: Rocket, count: 9 }, { title: 'Knowledge Management', icon: Lightbulb, count: 1 },
    { title: 'Task Management', icon: ListChecks, count: 4 },
  ] },
  { group: 'IT Operations', items: [
    { title: 'CMDB', icon: Network, count: 4 }, { title: 'Discovery And Agents', icon: Radar, count: 8 },
    { title: 'Patch Management', icon: ShieldCheck }, { title: 'Asset Management', icon: Box, count: 11 },
    { title: 'Vulnerability Management', icon: ShieldAlert, count: 3 }, { title: 'BOM Management', icon: Layers, count: 3 },
    { title: 'OS Deployment', icon: HardDrive, count: 4 },
  ] },
  { group: 'Vendor & Procurement', items: [
    { title: 'Supplier Management', icon: Truck, count: 3 }, { title: 'Contract Management', icon: FileText, count: 4 },
    { title: 'Purchase Management', icon: ShoppingCart, count: 5 },
  ] },
  { group: 'Project Delivery', items: [{ title: 'Project Management', icon: FolderKanban, count: 3 }] },
  { group: 'Compliance', items: [{ title: 'Compliance Settings', icon: ScrollText, count: 3 }] },
];

/** Patch Management's modules — the new UI's own six cards, in its order. */
const PATCH_CARDS: { title: string; icon: LucideIcon; screen?: string }[] = [
  { title: 'Patch Administration', icon: ShieldCheck },
  { title: 'Deployment Management', icon: MonitorDown },
  { title: 'System Health Settings', icon: Settings2 },
  { title: 'Packages', icon: Package },
  { title: 'OS Upgrade', icon: MonitorUp, screen: 'os-upgrade' },
  { title: 'Registry Templates', icon: LayoutTemplate },
];

export function AdminLayout({ active, onBack, children }: {
  /** The admin screen showing, e.g. 'os-upgrade'. */
  active: string;
  onBack: () => void;
  children: ReactNode;
}) {
  const [q, setQ] = useState('');
  const [patchOpen, setPatchOpen] = useState(true);
  const activeRef = useRef<HTMLDivElement>(null);
  /* Land with the open screen's row in view — Patch Management sits low in the nav. */
  useEffect(() => { activeRef.current?.scrollIntoView({ block: 'center' }); }, [active]);
  const query = q.trim().toLowerCase();
  const hit = (s: string) => !query || s.toLowerCase().includes(query);

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex h-full w-[268px] flex-shrink-0 flex-col border-r border-[#e5e7eb] bg-white">
        <button onClick={onBack} className="flex items-center gap-1.5 px-5 pt-4 text-left text-[13px] font-medium text-[#364658] hover:text-[#3D8BD0]">
          <ChevronLeft size={16} className="text-[#7B8FA5]" /> Back to app
        </button>
        <div className="px-4 pb-3 pt-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search settings..."
              className="h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
          </div>
        </div>

        <nav className="scroll-y min-h-0 flex-1 px-3 pb-4">
          {!query && (
            <div className="mb-1 flex w-full items-center gap-2.5 rounded px-3 py-2 text-[13px] text-[#364658]">
              <House size={16} className="text-[#7B8FA5]" /> Overview
            </div>
          )}
          {NAV.map((g) => {
            const items = g.items.filter((it) => hit(it.title) || (it.title === 'Patch Management' && PATCH_CARDS.some((c) => hit(c.title))));
            if (!items.length) return null;
            return (
              <div key={g.group} className="mt-4 first:mt-2">
                <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">{g.group}</div>
                {items.map(({ title, icon: Icon, count }) => {
                  const tree = title === 'Patch Management';
                  const open = tree && (patchOpen || !!query);
                  return (
                    <div key={title}>
                      <button
                        onClick={() => tree && setPatchOpen((v) => !v)}
                        className={`flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-[13px] text-[#364658] ${tree ? 'hover:bg-[#F5F7FA]' : 'cursor-default'}`}
                      >
                        <Icon size={16} className="flex-shrink-0 text-[#7B8FA5]" />
                        <span className="truncate">{title}</span>
                        {tree
                          ? <ChevronDown size={15} className={`ml-auto flex-shrink-0 text-[#9CA3AF] transition-transform ${open ? '' : '-rotate-90'}`} />
                          : <span className="ml-auto flex-shrink-0 text-[11px] text-[#9CA3AF]">{count}</span>}
                      </button>
                      {open && (
                        <div className="mt-0.5 space-y-0.5">
                          {PATCH_CARDS.filter((c) => !query || hit(c.title) || hit(title)).map((c) => {
                            const on = c.screen === active;
                            return (
                              <div
                                key={c.title}
                                ref={on ? activeRef : undefined}
                                className={`flex w-full items-center gap-2.5 rounded py-2 pl-9 pr-3 text-[13px] ${
                                  on ? 'bg-[#EBF5FF] font-medium text-[#3D8BD0]' : c.screen ? 'text-[#364658] hover:bg-[#F5F7FA]' : 'text-[#364658]'
                                }`}
                              >
                                <c.icon size={15} className={`flex-shrink-0 ${on ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`} />
                                <span className="truncate">{c.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
