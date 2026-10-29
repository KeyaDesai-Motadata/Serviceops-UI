import type { ReactNode } from 'react';
import { Plus, Search, Calendar, Bell, Settings, Keyboard, Info, Gauge, ShieldCheck, Monitor, MonitorUp, Rocket, ClipboardCheck } from 'lucide-react';
import { MotadataLogo } from './Logo';
import {
  IconDashboard, IconRequest, IconProblem, IconChange, IconRelease, IconAssets, IconCMDB,
  IconVulnerability, IconBom, IconPatch, IconPackage, IconProject, IconKnowledge, IconReport,
  IconMyApproval, IconTask, IconMyTeam,
} from './SidebarIcons';

/* The new ServiceOps shell: a 54px grey icon rail down the full height, the
 * white top bar with the logo, the blue Create square, the global search and
 * the avatar, and the page filling the rest.
 *
 * Dashboard and Patch open hover flyouts, as the new UI's Assets / Patch items
 * do. The OS Upgrade Dashboard lives under DASHBOARD, not under Patch: it is
 * read by people who never open the Patch module, so it sits beside the other
 * dashboards rather than behind the module whose data it summarises. */

interface FlyItem { icon: ReactNode; label: string; page?: string }

const DASHBOARD_ITEMS: FlyItem[] = [
  { icon: <Gauge size={16} />, label: 'Patch Dashboard' },
  { icon: <Gauge size={16} />, label: 'OS Upgrade Dashboard', page: 'dashboard' },
  { icon: <ShieldCheck size={16} />, label: 'Vulnerability Dashboard' },
  { icon: <Monitor size={16} />, label: 'Asset Dashboard' },
];

const PATCH_ITEMS: FlyItem[] = [
  { icon: <IconPatch size={16} />, label: 'Patches', page: 'patches' },
  { icon: <MonitorUp size={16} />, label: 'OS Upgrades', page: 'os-upgrades' },
  { icon: <Rocket size={16} />, label: 'Patch Deployment', page: 'deployments' },
  { icon: <Monitor size={16} />, label: 'Endpoint', page: 'endpoints' },
  { icon: <ClipboardCheck size={16} />, label: 'Automatic Patch Test' },
  { icon: <Settings size={16} />, label: 'Automatic Patch Deployment' },
];

function NavItem({ icon, active, title }: { icon: ReactNode; active?: boolean; title: string }) {
  return (
    <button
      title={title}
      className={`relative flex h-[40px] w-full items-center justify-center transition-colors ${
        active ? 'bg-[#3D8BD0]' : 'bg-transparent hover:bg-[#e9ebef]'
      }`}
    >
      {active && <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-[#2d6ca0]" />}
      <div className={`flex size-[20px] items-center justify-center ${active ? 'text-white' : 'text-[#364658]'}`}>{icon}</div>
    </button>
  );
}

function FlyoutNavItem({ icon, title, items, page, active, onNavigate }: {
  icon: ReactNode; title: string; items: FlyItem[]; page?: string; active: boolean;
  onNavigate?: (page: string) => void;
}) {
  return (
    <div className="group relative">
      <NavItem icon={icon} active={active} title="" />
      {/* pl-2 keeps a visual gap while bridging the hover area */}
      <div className="absolute left-full top-0 z-[9999] hidden pl-2 group-hover:block">
        <div className="w-[250px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
          <div className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">{title}</div>
          {items.map((it) => {
            const isActive = !!it.page && it.page === page;
            return (
              <button
                key={it.label}
                disabled={!it.page}
                onClick={() => it.page && onNavigate?.(it.page)}
                className={`flex w-full items-center gap-2.5 whitespace-nowrap px-3 py-2 text-left text-[13px] transition-colors ${
                  isActive ? 'bg-[#3D8BD0] text-white'
                  : !it.page ? 'cursor-default text-[#9CA3AF]'
                  : 'text-[#364658] hover:bg-[#F5F7FA]'
                }`}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-[#6B7280]'}`}>{it.icon}</span>
                {it.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Shell({ children, page, onNavigate, admin = false }: {
  children: ReactNode;
  /** Which sub-page is showing, so the flyout can mark it. */
  page?: string;
  onNavigate?: (page: string) => void;
  /** The admin hub: the product icon rail gives way to the settings nav. */
  admin?: boolean;
}) {
  const inDashboard = page === 'dashboard';

  return (
    <div className="flex h-full bg-white">
      {!admin && <aside className="flex h-full w-[54px] flex-none flex-col border-r border-[#e5e7eb] bg-[#f9fafb]">
        <FlyoutNavItem icon={<IconDashboard size={20} />} title="Dashboard" items={DASHBOARD_ITEMS} page={page} active={inDashboard} onNavigate={onNavigate} />
        <NavItem icon={<IconRequest size={20} />} title="Request" />
        <NavItem icon={<IconProblem size={20} />} title="Problem" />
        <NavItem icon={<IconChange size={20} />} title="Change" />
        <NavItem icon={<IconRelease size={20} />} title="Release" />
        <NavItem icon={<IconAssets size={20} />} title="Assets" />
        <NavItem icon={<IconCMDB size={20} />} title="CMDB" />
        <NavItem icon={<IconVulnerability size={20} />} title="Vulnerability" />
        <NavItem icon={<IconBom size={20} />} title="BOM" />
        <FlyoutNavItem icon={<IconPatch size={20} />} title="Patch" items={PATCH_ITEMS} page={page} active={!inDashboard} onNavigate={onNavigate} />
        <NavItem icon={<IconPackage size={20} />} title="Package" />
        <NavItem icon={<IconProject size={20} />} title="Project" />
        <NavItem icon={<IconKnowledge size={20} />} title="Knowledge" />
        <NavItem icon={<IconReport size={20} />} title="Report" />
        <NavItem icon={<IconMyApproval size={20} />} title="My Approval" />
        <NavItem icon={<IconTask size={20} />} title="Task" />
        <NavItem icon={<IconMyTeam size={20} />} title="My Team" />
      </aside>}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[56px] flex-none items-center justify-between border-b border-[#e5e7eb] bg-white px-6">
          <MotadataLogo />
          <div className="flex items-center gap-3">
            <button title="Create" className="flex size-8 items-center justify-center rounded bg-[#3D8BD0] text-white hover:bg-[#2d6ca0]">
              <Plus size={18} />
            </button>
            <button className="flex h-8 w-[260px] items-center gap-2 rounded border border-[#DFE5ED] bg-white px-2.5 text-[13px] text-[#7B8FA5] hover:border-[#3D8BD0]">
              <Search size={14} />
              <span className="flex-1 text-left">Search ServiceOps</span>
              <span className="rounded border border-[#DFE5ED] px-1 text-[10px] text-[#7B8FA5]">Ctrl K</span>
            </button>
            {[Calendar, Bell, Settings, Keyboard, Info].map((Icon, i) => (
              <button
                key={i}
                /* The gear opens the Admin hub, as in the new UI. */
                onClick={Icon === Settings ? () => onNavigate?.('admin') : undefined}
                title={Icon === Settings ? 'Admin' : undefined}
                className={`flex size-8 items-center justify-center rounded hover:bg-[#F5F7FA] ${
                  Icon === Settings && admin ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'text-[#364658]'
                }`}
              >
                <Icon size={18} strokeWidth={1.8} />
              </button>
            ))}
            <span className="flex size-8 items-center justify-center rounded bg-[#3D8BD0] text-[12px] font-semibold text-white">KE</span>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden bg-white">{children}</main>
      </div>
    </div>
  );
}
