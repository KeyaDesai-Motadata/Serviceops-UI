import { useState } from 'react';
import { Download, RefreshCw, Columns3, FileText, ChevronDown, X } from 'lucide-react';
import { DataTable, Pagination, SearchBar, IdPill, type Column } from '../ui/Table';
import { Dot, Dash } from '../ui/Detail';
import { FLEET, osNameOf, type Endpoint } from '../data/fleet';
import { lifecycleOf } from '../data/dashboard';

/* Endpoints listing — the page the endpoint detail opens from, as in the
 * product. Columns are the product's own. */

/* The listing reads THE fleet. There is no second endpoint list. */
export type EndpointRow = Endpoint;
export const ENDPOINTS = FLEET;

const HEALTH: Record<string, string> = { Healthy: '#0D9488', Warning: '#D97706', Critical: '#E11D48' };

export function EndpointsList({ onOpen, osFilter }: { onOpen: (id: string) => void; osFilter?: string }) {
  const [q, setQ] = useState('');
  /* Arrived from a dashboard widget: the filter it named is pinned as a
   * removable chip, so the reader can see why the list is short and why the
   * count matches the number they clicked. `eol` is every end-of-support
   * version at once — the EOL KPI's own population. */
  const [os, setOs] = useState(osFilter);
  const eolOnly = os === 'eol';
  const query = q.trim().toLowerCase();
  const rows = ENDPOINTS
    .filter((e) => !os || (eolOnly
      ? lifecycleOf(e.family, e.release) === 'End of support'
      : `${e.family} ${e.release}` === os))
    .filter((e) =>
    !query || e.id.toLowerCase().includes(query) || e.hostName.toLowerCase().includes(query) ||
    e.ip.includes(query) || osNameOf(e).toLowerCase().includes(query) || e.remoteOffice.toLowerCase().includes(query));

  const cols: Column<EndpointRow>[] = [
    { key: 'id', header: 'Agent ID', cell: (e) => (
      <button onClick={() => onOpen(e.id)} className="flex items-center gap-2">
        <span className="size-2 flex-none rounded-full" style={{ background: e.online ? '#0D9488' : '#EAB308' }} />
        <IdPill>{e.id}</IdPill>
      </button>
    ) },
    { key: 'host', header: 'Host Name', cell: (e) => (
      <button onClick={() => onOpen(e.id)} className="text-left hover:text-link">{e.hostName}</button>
    ) },
    { key: 'ip', header: 'IP Address', cell: (e) => e.ip },
    { key: 'os', header: 'OS Name', cell: (e) => osNameOf(e) },
    { key: 'ver', header: 'Version', cell: (e) => `${e.release} (${e.build})` },
    { key: 'sp', header: 'Service Pack', cell: (e) => 'None' },
    { key: 'arch', header: 'Architecture', cell: (e) => e.architecture },
    { key: 'office', header: 'Remote Office', cell: (e) => e.remoteOffice },
    { key: 'health', header: 'System Health', cell: (e) => e.health
      ? <Dot color={HEALTH[e.health]}><span style={{ color: HEALTH[e.health] }}>{e.health}</span></Dot>
      : <Dash /> },
    { key: 'tags', header: 'Tags', cell: (e) => e.tags.length
      ? <span className="flex gap-1">{e.tags.map((t) => <span key={t} className="rounded bg-chip px-1.5 py-0.5 text-[11.5px]">{t}</span>)}</span>
      : <Dash /> },
    { key: 'reboot', header: 'Reboot Required', cell: (e) => e.reboot },
  ];

  const IconBtn = ({ icon: Icon, title }: { icon: typeof Download; title: string }) => (
    <button title={title} className="flex size-8 items-center justify-center rounded-md text-ink-soft hover:bg-strip">
      <Icon size={15} />
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b border-line px-5 py-3">
        <h1 className="text-[17px] font-semibold text-ink">Endpoints</h1>
        <button className="flex items-center gap-1 text-[13px] font-medium text-ink hover:text-link">
          All Endpoints <ChevronDown size={15} className="text-label" />
        </button>
        <div className="ml-auto flex items-center gap-1">
          <IconBtn icon={FileText} title="Export" />
          <IconBtn icon={Download} title="Download" />
          <IconBtn icon={RefreshCw} title="Refresh" />
          <IconBtn icon={Columns3} title="Columns" />
        </div>
      </div>

      <div className="flex items-center gap-3 px-5 py-3">
        <SearchBar value={q} onChange={setQ} />
        {os && (
          <span className="flex flex-none items-center gap-1.5 rounded-md border border-line bg-strip px-2.5 py-1.5 text-[12px] text-value">
            <span className="text-label">{eolOnly ? 'OS Lifecycle:' : 'OS Version:'}</span>
            {eolOnly ? 'End of Life / End of Extended Support' : os}
            <button onClick={() => setOs(undefined)} title="Clear this filter" className="text-label hover:text-ink"><X size={13} /></button>
          </span>
        )}
      </div>
      <DataTable columns={cols} rows={rows} rowKey={(e) => e.id} empty="No endpoints found." />
      <Pagination total={rows.length} noun="items" />
    </div>
  );
}
