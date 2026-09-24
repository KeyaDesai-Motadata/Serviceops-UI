import { useState } from 'react';
import { MonitorUp, Download, RefreshCw, Columns3, FileText, Plus, ChevronDown, History } from 'lucide-react';
import { DataTable, Pagination, SearchBar, IdPill, type Column } from '../ui/Table';
import { Dot, Dash } from '../ui/Detail';
import { OS_UPGRADES, type OsUpgrade } from '../data/osUpgrade';
import { PATCHES, type Patch } from '../data/patches';

/* The Patches page — the same two-tab architecture the working prototype has.
 *
 * Software patches and OS upgrades are both patching work under one nav entry,
 * but share almost no columns, so each tab owns its own grid. The tabs sit on
 * the title row, and the saved-view dropdown follows them: the TAB decides
 * which views exist, so it cannot come first. OS Upgrades has no view control
 * and no create CTA — a technician does not author an operating system image,
 * and the published set is one set with nothing to pick between.
 */

export type PatchTab = 'patches' | 'os-upgrades';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* Both date columns read the same way. End of Support is stored as '14 Oct 2027'
 * and Release Date as a full stamp, so they are normalised to one shape rather
 * than sitting side by side in two formats. */
const eosDate = (d: string) => {
  const m = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/.exec(d.trim());
  return m ? `${m[2]} ${m[1].padStart(2, '0')}, ${m[3]}` : d;
};

const shortDate = (d: string) => d.replace(/^[A-Za-z]{3}, /, '').replace(/ \d{2}:\d{2} [AP]M$/, '');

export function PatchesPage({ tab, onTab, onOpen }: {
  tab: PatchTab; onTab: (t: PatchTab) => void; onOpen: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const isUpgrades = tab === 'os-upgrades';
  const query = q.trim().toLowerCase();

  const upgrades = OS_UPGRADES.filter((u) =>
    !query || u.id.toLowerCase().includes(query) || u.name.toLowerCase().includes(query) ||
    u.edition.toLowerCase().includes(query) || u.osVersion.toLowerCase().includes(query));

  const patches = PATCHES.filter((p) =>
    !query || p.id.toLowerCase().includes(query) || p.name.toLowerCase().includes(query) ||
    p.severity.toLowerCase().includes(query));

  const upgradeCols: Column<OsUpgrade>[] = [
    { key: 'id', header: 'Patch ID', cell: (u) => <button onClick={() => onOpen(u.id)}><IdPill>{u.id}</IdPill></button> },
    { key: 'name', header: 'Name', cell: (u) => (
      <button onClick={() => onOpen(u.id)} className="flex items-center gap-2 text-left hover:text-link">
        <MonitorUp size={14} className="flex-none text-label" />{u.name}
      </button>
    ) },
    { key: 'release', header: 'Release Date', cell: (u) => shortDate(u.releaseDate) },
    { key: 'eos', header: 'End of Support', cell: (u) => eosDate(u.eosDate) },
    /* Compatibility takes the slot Severity has on the patch grid — an image
       carries no CVSS rating, and this is the number a technician ranks by. */
    { key: 'compat', header: 'Compatibility', cell: (u) => (
      <span className="flex items-center gap-2.5 whitespace-nowrap">
        <Dot color="#16A34A"><span className="font-semibold text-ok">{u.compatible}</span></Dot>
        <Dot color={u.incompatible ? '#DC2626' : '#CBD5E1'}>
          <span className={u.incompatible ? 'font-semibold text-risk' : 'text-label'}>{u.incompatible}</span>
        </Dot>
      </span>
    ) },
    { key: 'installed', header: 'Installed System', cell: (u) => u.onBuild || <Dash /> },
    { key: 'approval', header: 'Approval Status', cell: (u) => (
      <Dot color={u.approval === 'Approved' ? '#16A34A' : '#D97706'}>
        <span className={u.approval === 'Approved' ? 'text-ok' : 'text-warn'}>{u.approval}</span>
      </Dot>
    ) },
  ];

  const patchCols: Column<Patch>[] = [
    { key: 'id', header: 'Patch ID', cell: (p) => <IdPill>{p.id}</IdPill> },
    { key: 'name', header: 'Name', cell: (p) => <span className="block max-w-[420px] truncate">{p.name}</span> },
    { key: 'sev', header: 'Severity', cell: (p) => <Dot color={p.severityColor}>{p.severity}</Dot> },
    { key: 'release', header: 'Release Date', cell: (p) => shortDate(p.releaseDate) },
    { key: 'missing', header: 'Missing System', cell: (p) => p.missing ?? <Dash /> },
    { key: 'installed', header: 'Installed System', cell: (p) => p.installed ?? <Dash /> },
    { key: 'reboot', header: 'Reboot Required', cell: (p) => p.reboot },
    { key: 'approval', header: 'Approval Status', cell: (p) => (
      <Dot color={p.approval === 'Approved' ? '#16A34A' : '#D97706'}>
        <span className={p.approval === 'Approved' ? 'text-ok' : 'text-warn'}>{p.approval}</span>
      </Dot>
    ) },
  ];

  const IconBtn = ({ icon: Icon, title }: { icon: typeof Download; title: string }) => (
    <button title={title} className="flex size-8 items-center justify-center rounded-md text-ink-soft hover:bg-strip">
      <Icon size={15} />
    </button>
  );

  const TABS: { key: PatchTab; label: string; count: number }[] = [
    { key: 'patches', label: 'Software Patches', count: PATCHES.length },
    { key: 'os-upgrades', label: 'OS Upgrades', count: OS_UPGRADES.length },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* One row: title, tabs, then the view. The tabs carry their counts so the
          split reads before anything is clicked. */}
      <div className="flex items-stretch gap-6 border-b border-line px-5">
        <h1 className="flex items-center text-[17px] font-semibold text-ink">Patches</h1>

        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => onTab(t.key)}
            className={`-mb-px flex items-center gap-2 border-b-2 py-3 text-[13px] font-medium transition-colors ${
              tab === t.key ? 'border-ink text-ink' : 'border-transparent text-label hover:text-ink'
            }`}
          >
            {t.label}
            <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
              tab === t.key ? 'bg-ink text-white' : 'bg-chip text-label'
            }`}>{t.count}</span>
          </button>
        ))}

        {/* No view control on OS Upgrades — one set, nothing to pick between. */}
        {!isUpgrades && (
          <div className="flex items-center gap-4">
            <span className="h-4 w-px bg-line" />
            <button className="flex items-center gap-1 whitespace-nowrap text-[13px] font-medium text-ink hover:text-link">
              Missing Patches <ChevronDown size={15} className="text-label" />
            </button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1 py-2.5">
          <IconBtn icon={FileText} title="Export" />
          <IconBtn icon={Download} title="Download" />
          <IconBtn icon={RefreshCw} title="Refresh" />
          <IconBtn icon={History} title="History" />
          <IconBtn icon={Columns3} title="Columns" />
          {!isUpgrades && (
            <button className="ml-1.5 flex h-8 items-center gap-1.5 rounded-md bg-ink px-3 text-[12.5px] font-medium text-white hover:bg-ink-soft">
              <Plus size={14} /> Create Patch
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-3">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder={isUpgrades ? 'Search image, edition, version...' : 'Select field to search...'}
        />
      </div>

      {isUpgrades
        ? <DataTable columns={upgradeCols} rows={upgrades} rowKey={(u) => u.id} empty="No OS upgrades found." />
        : <DataTable columns={patchCols} rows={patches} rowKey={(p) => p.id} empty="No patches found." />}
      <Pagination total={isUpgrades ? upgrades.length : patches.length} noun="items" />
    </div>
  );
}
