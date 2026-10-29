import { useState } from 'react';
import { MonitorUp } from 'lucide-react';
import { DataTable, Pagination, IdPill, CountChip, ListingHeader, KpiStrip, Toolbar, FilterChip, type Column, type KpiCard } from '../ui/Table';
import { Dot, Dash } from '../ui/Detail';
import { OS_UPGRADES, countsFor, needsManualUpload, type OsUpgrade } from '../data/osUpgrade';
import { PATCHES, type Patch } from '../data/patches';

/* The Patches page, in the new UI's "List + KPI" layout: page head, a strip of
 * KPI cards that each filter the grid to exactly the rows they count, the icon
 * toolbar, then the grid.
 *
 * Software patches and OS upgrades are two entries in the Patch flyout, so each
 * is its own page carrying its own title, and each owns its grid — they share
 * almost no columns. OS Upgrades has no saved-view picker and no Create: a
 * technician does not author an operating-system image, and the published set
 * is one set with nothing to pick between. An OS upgrade carries no approval,
 * so its grid has no Approval Status column. OS Upgrades shows no KPI strip. */

export type PatchTab = 'patches' | 'os-upgrades';

/* Both date columns read the same way. End of Support is stored as '14 Oct 2027'
 * and Release Date as a full stamp, so they are normalised to one shape rather
 * than sitting side by side in two formats. */
const eosDate = (d: string) => {
  const m = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/.exec(d.trim());
  return m ? `${m[2]} ${m[1].padStart(2, '0')}, ${m[3]}` : d;
};

const shortDate = (d: string) => d.replace(/^[A-Za-z]{3}, /, '').replace(/ \d{2}:\d{2} [AP]M$/, '');

/** End of Support already behind us (the prototype's "today" is Oct 2026). */
const pastEos = (u: OsUpgrade) => new Date(u.eosDate) < new Date('2026-10-23');

/* Enterprise images the catalogue cannot fetch, still without an ISO. They look
   deployable from the list otherwise, so Upload Status names them Yet to Upload
   rather than leaving the cell blank. */
const awaiting = (u: OsUpgrade) => needsManualUpload(u) && u.downloadStatus !== 'Success';

const PATCH_VIEWS = [{ id: 'missing', label: 'Missing Patches' }, { id: 'all', label: 'All Patches' }];

const APPROVAL = (a: string) => (
  <span className={a === 'Approved' ? 'text-ok' : 'text-warn'}>{a}</span>
);

export function PatchesPage({ tab, onOpen }: {
  tab: PatchTab; onOpen: (id: string, tab?: string) => void;
}) {
  const [q, setQ] = useState('');
  const [kpi, setKpi] = useState<string | null>(null);
  const [view, setView] = useState('missing');
  const isUpgrades = tab === 'os-upgrades';
  const query = q.trim().toLowerCase();

  // ── OS Upgrades ─────────────────────────────────────────────────────────
  /* Enterprise images are kept off the list; their records stay reachable. */
  const listed = OS_UPGRADES.filter((u) => u.edition !== 'Enterprise');
  const upgrades = listed
    .filter((u) =>
      !query || u.id.toLowerCase().includes(query) || u.name.toLowerCase().includes(query) ||
      u.edition.toLowerCase().includes(query) || u.osVersion.toLowerCase().includes(query));

  const upgradeCols: Column<OsUpgrade>[] = [
    { key: 'id', header: 'Patch ID', cell: (u) => <IdPill>{u.id}</IdPill> },
    { key: 'name', header: 'Name', cell: (u) => (
      <span className="flex items-center gap-2"><MonitorUp size={14} className="flex-none text-label" />{u.name}</span>
    ) },
    { key: 'release', header: 'Release Date', cell: (u) => shortDate(u.releaseDate) },
    { key: 'eos', header: 'End of Support', cell: (u) => (
      <span className={pastEos(u) ? 'text-risk' : ''}>{eosDate(u.eosDate)}</span>
    ) },
    /* Compatibility takes the slot Severity has on the patch grid — an image
       carries no CVSS rating, and this is the number a technician ranks by. */
    { key: 'compat', header: 'Compatibility', cell: (u) => {
      const c = countsFor(u);
      return (
        <span className="flex items-center gap-2.5 whitespace-nowrap">
          <Dot color="#22C55E"><span className="font-semibold text-ok">{c.compatible}</span></Dot>
          <Dot color={c.incompatible ? '#EF4444' : '#CBD5E1'}>
            <span className={c.incompatible ? 'font-semibold text-risk' : 'text-label'}>{c.incompatible}</span>
          </Dot>
        </span>
      );
    } },
    { key: 'installed', header: 'Installed System', cell: (u) => countsFor(u).onBuild ? <CountChip>{countsFor(u).onBuild}</CountChip> : <Dash /> },
    { key: 'upload', header: 'Upload Status', cell: (u) => awaiting(u) ? (
      <button
        onClick={(e) => { e.stopPropagation(); onOpen(u.id, 'files'); }}
        title="Open File Details to upload the ISO"
        className="text-warn hover:underline"
      >
        Yet to Upload
      </button>
    ) : <span className="text-ok">Success</span> },
  ];

  // ── Patches ─────────────────────────────────────────────────────────────
  const PATCH_KPIS: Record<string, (p: Patch) => boolean> = {
    'Critical & Important': (p) => (p.severity === 'Critical' || p.severity === 'Important') && (p.missing ?? 0) > 0,
    'Pending Approval': (p) => p.approval === 'Not Approved' && (p.missing ?? 0) > 0,
    'Approved Patches': (p) => p.approval === 'Approved',
    'Reboot Required': (p) => p.reboot === 'Yes',
  };
  const patches = PATCHES
    .filter((p) => view === 'all' || p.missing !== 0)
    .filter((p) => !kpi || !PATCH_KPIS[kpi] || PATCH_KPIS[kpi](p))
    .filter((p) =>
      !query || p.id.toLowerCase().includes(query) || p.name.toLowerCase().includes(query) ||
      p.severity.toLowerCase().includes(query));

  const patchCards: KpiCard[] = Object.entries(PATCH_KPIS).map(([label, test]) => {
    const n = PATCHES.filter(test).length;
    return {
      label, value: n, active: kpi === label,
      color: label === 'Approved Patches' ? '#22A06B' : n && label !== 'Reboot Required' ? (label === 'Critical & Important' ? '#DC2626' : '#B45309') : undefined,
      sub: label === 'Critical & Important' ? 'missing on at least one endpoint'
        : label === 'Pending Approval' ? 'missing, not yet approved'
        : label === 'Approved Patches' ? 'ready to deploy' : 'restart after install',
      onClick: () => setKpi(kpi === label ? null : label),
    };
  });

  const patchCols: Column<Patch>[] = [
    { key: 'id', header: 'Patch ID', cell: (p) => <IdPill>{p.id}</IdPill> },
    { key: 'name', header: 'Name', cell: (p) => <span className="block max-w-[420px] truncate">{p.name}</span> },
    { key: 'sev', header: 'Severity', cell: (p) => <Dot color={p.severityColor}>{p.severity}</Dot> },
    { key: 'release', header: 'Release Date', cell: (p) => shortDate(p.releaseDate) },
    { key: 'missing', header: 'Missing System', cell: (p) => p.missing ? <CountChip>{p.missing}</CountChip> : <Dash /> },
    { key: 'installed', header: 'Installed System', cell: (p) => p.installed ? <CountChip>{p.installed}</CountChip> : <Dash /> },
    { key: 'reboot', header: 'Reboot Required', cell: (p) => (
      <span className={p.reboot === 'Yes' ? 'font-medium text-risk' : p.reboot === 'May be' ? 'text-warn' : 'text-ink-soft'}>{p.reboot}</span>
    ) },
    { key: 'approval', header: 'Approval Status', cell: (p) => APPROVAL(p.approval) },
  ];

  return (
    <div className="flex h-full flex-col">
      {isUpgrades ? (
        <ListingHeader title="OS Upgrades" />
      ) : (
        <ListingHeader title="Patches" views={PATCH_VIEWS} view={view} onView={setView} cta={{ label: 'Create' }} />
      )}

      {/* No KPI strip on OS Upgrades (removed 29 Oct 2026). */}
      {!isUpgrades && <KpiStrip cards={patchCards} />}

      <Toolbar
        /* No ⋮ on OS Upgrades — nothing sits behind it. */
        more={!isUpgrades}
        search={q}
        onSearch={setQ}
        placeholder={isUpgrades ? 'Search image, edition, version...' : 'Search patch, name, severity...'}
      >
        {kpi && !isUpgrades && <FilterChip label="Showing" value={kpi} onClear={() => setKpi(null)} />}
      </Toolbar>

      {isUpgrades
        ? <DataTable columns={upgradeCols} rows={upgrades} rowKey={(u) => u.id} onRowClick={(u) => onOpen(u.id)} empty="No OS upgrades found." />
        : <DataTable columns={patchCols} rows={patches} rowKey={(p) => p.id} empty="No patches found." />}
      <Pagination total={isUpgrades ? upgrades.length : patches.length} />
    </div>
  );
}
