import { useState } from 'react';
import { Download } from 'lucide-react';
import { DataTable, Pagination, SearchBar, IdPill, type Column } from './Table';
import { Dot, Dash } from './Detail';

/* The Installation grid, shared by the patch/OS-upgrade detail page and the
 * deployment detail page — the product shows the same rows in both places, so
 * they are the same component rather than two tables that could drift. */

export interface InstallRow {
  id: string; hostName: string; ip: string; configType: string;
  deploymentDate: string | null; installStatus: string; retry: number;
  downloadStatus: string; taskType: string; online: boolean;
  /* Set on a DEPLOYMENT run, where each row is one (patch × endpoint) pair —
     the same endpoint appears once per payload it was sent. */
  patchId?: string; patchName?: string; severity?: string; severityColor?: string; result?: string;
}

const STATUS: Record<string, string> = {
  Success: '#16A34A', Installed: '#16A34A', Failed: '#DC2626',
  'In Progress': '#D97706', Pending: '#D97706', 'Not Ready': '#64748B', 'Yet to Receive': '#94A3B8',
};

export function InstallationTab({ rows, matrix = false, onViewConfig, onDownload }: {
  rows: InstallRow[];
  /** Deployment-run columns: the payload named per row, and a Result. */
  matrix?: boolean;
  onViewConfig?: (id: string) => void;
  onDownload?: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const visible = rows.filter((r) =>
    !query || r.id.toLowerCase().includes(query) || r.hostName.toLowerCase().includes(query) ||
    r.ip.includes(query) || r.installStatus.toLowerCase().includes(query) ||
    r.downloadStatus.toLowerCase().includes(query) ||
    (r.patchId ?? '').toLowerCase().includes(query) || (r.patchName ?? '').toLowerCase().includes(query));

  /* Two shapes, one component. The patch record names the machine and how it
     was configured; a deployment run also names WHICH payload each row carried,
     because one run can send several and a row means nothing without it. */
  const patchCols: Column<InstallRow>[] = [
    { key: 'id', header: 'Endpoint ID', cell: (r) => (
      <span className="flex items-center gap-2">
        <span className="size-2 flex-none rounded-full" style={{ background: r.online ? '#16A34A' : '#EAB308' }} />
        <IdPill>{r.id}</IdPill>
      </span>
    ) },
    { key: 'host', header: 'Host Name', cell: (r) => <span className="block max-w-[200px] truncate">{r.hostName}</span> },
    { key: 'pid', header: 'Patch ID', cell: (r) => r.patchId ? <IdPill>{r.patchId}</IdPill> : <Dash /> },
    { key: 'pname', header: 'Name', cell: (r) => <span className="block max-w-[240px] truncate">{r.patchName ?? '---'}</span> },
    { key: 'sev', header: 'Severity', cell: (r) => r.severity
      ? <Dot color={r.severityColor ?? '#6B7280'}>{r.severity}</Dot>
      : <Dash /> },
    { key: 'date', header: 'Deployment Date', cell: (r) => r.deploymentDate ?? <Dash /> },
    { key: 'inst', header: 'Installation Status', cell: (r) => (
      <Dot color={STATUS[r.installStatus] ?? '#64748B'}>
        <span style={{ color: STATUS[r.installStatus] ?? '#64748B' }}>{r.installStatus}</span>
      </Dot>
    ) },
    { key: 'retry', header: 'Retry Status', cell: (r) => r.retry },
    { key: 'dl', header: 'Download Status', cell: (r) => r.downloadStatus },
    { key: 'result', header: 'Result', cell: (r) => r.result
      ? <span className={r.installStatus === 'Failed' ? 'text-risk' : 'text-value'}>{r.result}</span>
      : <Dash /> },
    { key: 'actions', header: 'Actions', cell: (r) => (
      <button
        onClick={() => onDownload?.(r.id)}
        title="Download installation log"
        className="flex size-7 items-center justify-center rounded-md text-ink-soft hover:bg-chip"
      >
        <Download size={15} />
      </button>
    ) },
  ];

  const recordCols: Column<InstallRow>[] = [
    { key: 'id', header: 'Endpoint ID', cell: (r) => (
      <span className="flex items-center gap-2">
        <span className="size-2 flex-none rounded-full" style={{ background: r.online ? '#16A34A' : '#EAB308' }} />
        <IdPill>{r.id}</IdPill>
      </span>
    ) },
    { key: 'host', header: 'Host Name', cell: (r) => <span className="block max-w-[200px] truncate">{r.hostName}</span> },
    { key: 'ip', header: 'IP Address', cell: (r) => r.ip },
    { key: 'cfg', header: 'Configuration Type', cell: (r) => r.configType },
    { key: 'date', header: 'Deployment Date', cell: (r) => r.deploymentDate ?? <Dash /> },
    { key: 'inst', header: 'Installation Status', cell: (r) => (
      <Dot color={STATUS[r.installStatus] ?? '#64748B'}>
        <span style={{ color: STATUS[r.installStatus] ?? '#64748B' }}>{r.installStatus}</span>
      </Dot>
    ) },
    { key: 'retry', header: 'Retry Status', cell: (r) => r.retry },
    { key: 'dl', header: 'Download Status', cell: (r) => r.downloadStatus },
    { key: 'task', header: 'Task Type', cell: (r) => <span className="block max-w-[180px] truncate">{r.taskType}</span> },
    { key: 'actions', header: 'Actions', cell: (r) => (
      <button
        onClick={() => onViewConfig?.(r.id)}
        className="rounded-md bg-chip px-2.5 py-1 text-[12px] font-medium text-ink hover:bg-line"
      >
        View Configuration
      </button>
    ) },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 py-3"><SearchBar value={q} onChange={setQ} /></div>
      <DataTable columns={matrix ? patchCols : recordCols} rows={visible} rowKey={(r) => r.id} empty="No installations found." selectable={false} />
      <Pagination total={visible.length} noun="items" />
    </div>
  );
}
