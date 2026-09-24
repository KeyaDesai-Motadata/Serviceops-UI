import { useState } from 'react';
import { Download, RefreshCw, Columns3, FileText, ChevronDown } from 'lucide-react';
import { DataTable, Pagination, SearchBar, IdPill, type Column } from '../ui/Table';
import { Dot, Dash } from '../ui/Detail';

/* Endpoints listing — the page the endpoint detail opens from, as in the
 * product. Columns are the product's own. */

export interface EndpointRow {
  id: string; hostName: string; ip: string; osName: string; version: string | null;
  servicePack: string; architecture: string; remoteOffice: string;
  health: 'Healthy' | 'Warning' | 'Critical' | null; tags: string[]; reboot: 'Yes' | 'No';
  online: boolean;
}

export const ENDPOINTS: EndpointRow[] = [
  { id: 'EP-16', hostName: 'harsh-patil-Precision-5560', ip: '10.20.40.51', osName: 'Ubuntu 24.04', version: '24.04.5 LTS', servicePack: '7.0.0-31-generic', architecture: '64 BIT', remoteOffice: '12th floor left', health: 'Healthy', tags: [], reboot: 'No', online: true },
  { id: 'EP-408', hostName: 'FIN-LT-0188', ip: '10.20.22.188', osName: 'Microsoft Windows 11 Pro', version: '10.0.26200.8328', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Mumbai Office', health: 'Healthy', tags: ['finance'], reboot: 'No', online: true },
  { id: 'EP-406', hostName: 'SAL-LT-0204', ip: '10.20.23.204', osName: 'Microsoft Windows 10 Enterprise', version: '10.0.19045.6466', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Bengaluru Campus', health: 'Healthy', tags: [], reboot: 'No', online: true },
  { id: 'EP-400', hostName: 'ENG-LT-0312', ip: '10.20.19.112', osName: 'Microsoft Windows 11 Pro', version: '10.0.26200.8655', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Hyderabad Office', health: 'Healthy', tags: [], reboot: 'Yes', online: true },
  { id: 'EP-396', hostName: 'DESKTOP-A19KJ', ip: '10.20.41.40', osName: 'Microsoft Windows 10 Pro', version: null, servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Mumbai Office', health: null, tags: [], reboot: 'No', online: false },
  { id: 'EP-352', hostName: 'DC1-APP-01', ip: '10.20.40.21', osName: 'Microsoft Windows Server 2019 Datacenter', version: '10.0.17763.6893', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Ahmedabad HQ', health: 'Healthy', tags: ['server'], reboot: 'No', online: true },
  { id: 'EP-357', hostName: 'REC-DT-0023', ip: '10.20.21.23', osName: 'Microsoft Windows 10 Pro', version: '10.0.19045.5011', servicePack: 'None', architecture: '64 BIT', remoteOffice: 'Muscat Office', health: 'Critical', tags: ['kiosk'], reboot: 'Yes', online: false },
];

const HEALTH: Record<string, string> = { Healthy: '#16A34A', Warning: '#D97706', Critical: '#DC2626' };

export function EndpointsList({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const rows = ENDPOINTS.filter((e) =>
    !query || e.id.toLowerCase().includes(query) || e.hostName.toLowerCase().includes(query) ||
    e.ip.includes(query) || e.osName.toLowerCase().includes(query) || e.remoteOffice.toLowerCase().includes(query));

  const cols: Column<EndpointRow>[] = [
    { key: 'id', header: 'Agent ID', cell: (e) => (
      <button onClick={() => onOpen(e.id)} className="flex items-center gap-2">
        <span className="size-2 flex-none rounded-full" style={{ background: e.online ? '#16A34A' : '#EAB308' }} />
        <IdPill>{e.id}</IdPill>
      </button>
    ) },
    { key: 'host', header: 'Host Name', cell: (e) => (
      <button onClick={() => onOpen(e.id)} className="text-left hover:text-link">{e.hostName}</button>
    ) },
    { key: 'ip', header: 'IP Address', cell: (e) => e.ip },
    { key: 'os', header: 'OS Name', cell: (e) => e.osName },
    { key: 'ver', header: 'Version', cell: (e) => e.version ?? <Dash /> },
    { key: 'sp', header: 'Service Pack', cell: (e) => e.servicePack },
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

      <div className="px-5 py-3"><SearchBar value={q} onChange={setQ} /></div>
      <DataTable columns={cols} rows={rows} rowKey={(e) => e.id} empty="No endpoints found." />
      <Pagination total={rows.length} noun="items" />
    </div>
  );
}
