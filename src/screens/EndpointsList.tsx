import { useState } from 'react';
import { DataTable, Pagination, IdPill, ListingHeader, KpiStrip, Toolbar, FilterChip, type Column, type KpiCard } from '../ui/Table';
import { Dot, Dash } from '../ui/Detail';
import { FLEET, osNameOf, type Endpoint } from '../data/fleet';
import { lifecycleOf } from '../data/dashboard';

/* Endpoints listing — the page the endpoint detail opens from, in the new UI's
 * List + KPI layout. Columns are the product's own. */

/* The listing reads THE fleet. There is no second endpoint list. */
export type EndpointRow = Endpoint;
export const ENDPOINTS = FLEET;

const HEALTH: Record<string, string> = { Healthy: '#22C55E', Warning: '#F59E0B', Critical: '#EF4444' };

const VIEWS = [{ id: 'all', label: 'All Endpoints' }];

export function EndpointsList({ onOpen, osFilter }: { onOpen: (id: string) => void; osFilter?: string }) {
  const [q, setQ] = useState('');
  /* Arrived from a dashboard widget: the filter it named is pinned as a
   * removable chip, so the reader can see why the list is short and why the
   * count matches the number they clicked. `eol` is every end-of-support
   * version at once — the EOL KPI's own population. */
  const [os, setOs] = useState(osFilter);
  const [kpi, setKpi] = useState<string | null>(null);
  const eolOnly = os === 'eol';
  const query = q.trim().toLowerCase();

  const KPIS: Record<string, (e: Endpoint) => boolean> = {
    'Online': (e) => e.online,
    'Offline': (e) => !e.online,
    'Reboot Required': (e) => e.reboot === 'Yes',
    'End of Support OS': (e) => lifecycleOf(e.family, e.release) === 'End of support',
  };

  const rows = ENDPOINTS
    .filter((e) => !os || (eolOnly
      ? lifecycleOf(e.family, e.release) === 'End of support'
      : `${e.family} ${e.release}` === os))
    .filter((e) => !kpi || KPIS[kpi](e))
    .filter((e) =>
      !query || e.id.toLowerCase().includes(query) || e.hostName.toLowerCase().includes(query) ||
      e.ip.includes(query) || osNameOf(e).toLowerCase().includes(query) || e.remoteOffice.toLowerCase().includes(query));

  const cards: KpiCard[] = Object.entries(KPIS).map(([label, test]) => {
    const n = ENDPOINTS.filter(test).length;
    return {
      label, value: n, active: kpi === label,
      color: label === 'Online' ? '#22A06B' : n && label !== 'Offline' ? (label === 'End of Support OS' ? '#DC2626' : '#B45309') : undefined,
      sub: label === 'Online' ? `of ${ENDPOINTS.length} managed endpoints`
        : label === 'Offline' ? 'agent not reporting'
        : label === 'Reboot Required' ? 'pending a restart' : 'no longer receives updates',
      onClick: () => setKpi(kpi === label ? null : label),
    };
  });

  const cols: Column<EndpointRow>[] = [
    { key: 'id', header: 'Agent ID', cell: (e) => (
      <span className="flex items-center gap-2">
        <span className="size-2 flex-none rounded-full" style={{ background: e.online ? '#22C55E' : '#EAB308' }} />
        <IdPill>{e.id}</IdPill>
      </span>
    ) },
    { key: 'host', header: 'Host Name', cell: (e) => e.hostName },
    { key: 'ip', header: 'IP Address', cell: (e) => e.ip },
    { key: 'os', header: 'OS Name', cell: (e) => osNameOf(e) },
    { key: 'ver', header: 'Version', cell: (e) => `${e.release} (${e.build})` },
    { key: 'sp', header: 'Service Pack', cell: () => 'None' },
    { key: 'arch', header: 'Architecture', cell: (e) => e.architecture },
    { key: 'office', header: 'Remote Office', cell: (e) => e.remoteOffice },
    { key: 'health', header: 'System Health', cell: (e) => e.health
      ? <Dot color={HEALTH[e.health]}>{e.health}</Dot>
      : <Dash /> },
    { key: 'tags', header: 'Tags', cell: (e) => e.tags.length
      ? <span className="flex gap-1">{e.tags.map((t) => <span key={t} className="rounded bg-[#EEF2F6] px-2 py-0.5 text-[11px]">{t}</span>)}</span>
      : <Dash /> },
    { key: 'reboot', header: 'Reboot Required', cell: (e) => (
      <span className={e.reboot === 'Yes' ? 'font-medium text-risk' : 'text-ink-soft'}>{e.reboot}</span>
    ) },
  ];

  return (
    <div className="flex h-full flex-col">
      <ListingHeader title="Endpoints" views={VIEWS} view="all" />
      <KpiStrip cards={cards} />
      <Toolbar search={q} onSearch={setQ} placeholder="Search endpoint, host, IP, OS, office...">
        {os && (
          <FilterChip
            label={eolOnly ? 'OS Lifecycle' : 'OS Version'}
            value={eolOnly ? 'End of Life / End of Extended Support' : os}
            onClear={() => setOs(undefined)}
          />
        )}
        {kpi && <FilterChip label="Showing" value={kpi} onClear={() => setKpi(null)} />}
      </Toolbar>
      <DataTable columns={cols} rows={rows} rowKey={(e) => e.id} onRowClick={(e) => onOpen(e.id)} empty="No endpoints found." />
      <Pagination total={rows.length} />
    </div>
  );
}
