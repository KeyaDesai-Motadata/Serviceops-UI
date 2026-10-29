import { useState } from 'react';
import { Monitor, MapPin, Download } from 'lucide-react';
import { RecordPage, DetailHeader, UnderlineTabs, PropertiesPanel, Dot, Dash, type TabDef } from '../ui/Detail';
import { DataTable, Pagination, SearchBar, IdPill, type Column } from '../ui/Table';
import { InstallationTab } from '../ui/InstallationTab';
import { AuditTrail } from '../ui/AuditTrail';
import { CountListCard, StatCard, StatusBreakdownCard, IconTile, BREAKDOWN_STATUSES, type StatusSplit } from '../ui/Overview';
import { deploymentById, endpointsForRun, type DeployedEndpoint } from '../data/deployment';
import { byId } from '../data/osUpgrade';
import { statusColor } from './DeploymentsList';

/* Patch Deployment — details, on the new UI's record frame.
 *
 * The Overview leads, because a run is a thing you WATCH rather than read: the
 * targeted endpoints, then the four overall counts beside the Remote Office
 * drill-down. A run has no Approve / Decline — it is watched, not approved. */

const TABS: TabDef[] = [
  { id: 'analytics', label: 'Overview' },
  { id: 'endpoint', label: 'Endpoint' },
  { id: 'patches', label: 'Patches' },
  { id: 'installation', label: 'Installation' },
  { id: 'audit', label: 'Audit Trail' },
];

const STATUS_BY_REMOTE_OFFICE: Record<string, StatusSplit> = {
  'Ahmedabad HQ': { success: 12, failed: 1, inProgress: 4, other: 2 },
  'Mumbai Office': { success: 8, failed: 1, inProgress: 3, other: 1 },
  'Pune Development Center': { success: 5, failed: 1, inProgress: 2, other: 0 },
  'Bengaluru Campus': { success: 3, failed: 0, inProgress: 2, other: 0 },
};

const STATUS_COLOR: Record<DeployedEndpoint['status'], string> = {
  Success: '#22C55E', Failed: '#EF4444', 'In Progress': '#F59E0B', 'Yet to Receive': '#94A3B8',
};

export function DeploymentDetail({ id, onBack, onOpenUpgrade }: {
  id: string; onBack: () => void; onOpenUpgrade: (id: string) => void;
}) {
  const d = deploymentById(id);
  const img = byId(d.payloadId);
  const [tab, setTab] = useState('analytics');
  const [q, setQ] = useState('');

  const all = endpointsForRun(d);
  const pending = d.targeted - d.success - d.failed - d.inProgress;
  const pct = d.targeted ? Math.round((d.success / d.targeted) * 100) : 0;

  const query = q.trim().toLowerCase();
  const rows = all.filter((e) =>
    !query || e.id.toLowerCase().includes(query) || e.hostName.toLowerCase().includes(query) ||
    e.ip.includes(query) || e.remoteOffice.toLowerCase().includes(query));

  const cols: Column<DeployedEndpoint>[] = [
    { key: 'id', header: 'Endpoint ID', cell: (e) => <IdPill>{e.id}</IdPill> },
    { key: 'host', header: 'Host Name', cell: (e) => e.hostName },
    { key: 'ip', header: 'IP Address', cell: (e) => e.ip },
    { key: 'office', header: 'Remote Office', cell: (e) => e.remoteOffice },
    { key: 'status', header: 'Installation Status', cell: (e) => <Dot color={STATUS_COLOR[e.status]}>{e.status}</Dot> },
    { key: 'on', header: 'Deployed On', cell: (e) => e.deployedOn },
    { key: 'retry', header: 'Retry Status', cell: (e) => e.retryCount || 0 },
    { key: 'reason', header: 'Reason', cell: (e) => e.reason ? <span className="text-risk">{e.reason}</span> : <Dash /> },
  ];

  const status = <Dot color={statusColor(d)}>{d.status}</Dot>;

  return (
    <RecordPage
      id={d.id}
      title={d.name}
      onClose={onBack}
      header={
        <DetailHeader
          id={d.id}
          title={d.name}
          kpis={[
            { label: 'Status', value: status },
            { label: 'Install Progress', value: <>{d.success}/{d.targeted} <span className="text-risk">{pct}%</span></> },
            { label: 'Patches', value: 1 },
            { label: 'Install After', value: d.installAfter },
            { label: 'Expiry', value: d.expiryDate === '---' ? <Dash /> : <span className="text-risk">{d.expiryDate}</span> },
          ]}
        />
      }
      tabs={<UnderlineTabs tabs={TABS} active={tab} onChange={setTab} />}
      panel={
        <PropertiesPanel
          title="Patch Deployment Properties"
          sections={[{
            title: 'Patch Deployment Fields',
            fields: [
              /* Leads the panel: the category decides what the run delivers, and
                 so what every field under it means. */
              { label: 'Deployment Category', value: d.category },
              { label: 'Status', value: status },
              { label: 'Task Type', value: 'Manual Remote Deploy' },
              { label: 'Deployment Policy', value: d.policy },
              { label: 'Install After', value: d.installAfter },
              { label: 'Expiry Date', value: d.expiryDate === '---' ? <Dash /> : d.expiryDate },
              { label: 'Notify to', value: (
                <select className="h-8 w-full rounded border border-[#DFE5ED] bg-white px-2 text-[13px] text-value focus:border-link focus:outline-none">
                  <option>Select</option>
                  <option>{d.notifyTo}</option>
                </select>
              ) },
              { label: 'Retry Failed Configuration', value: d.retry },
              { label: 'Retry Count', value: all.reduce((s, e) => s + e.retryCount, 0) },
              { label: 'Configuration Type', value: 'Install' },
              { label: 'Created On', value: d.createdOn },
              { label: 'Last Updated Date', value: d.lastUpdated },
              { label: 'Created By', value: <span className="text-link">{d.createdBy}</span> },
              { label: 'Last Updated By', value: <span className="text-link">{d.createdBy}</span> },
            ],
          }]}
        />
      }
    >
      {tab === 'analytics' && (
        <div className="scroll-y min-h-0 flex-1 px-6 py-6">
          {/* Endpoints takes the full width: with no Patches card beside it,
              half a two-up row would leave the other half empty. */}
          <CountListCard
            label="Endpoints"
            icon={Monitor}
            total={d.targeted}
            caption={`endpoint${d.targeted === 1 ? '' : 's'} targeted`}
            items={all.map((e) => ({ key: e.id, primary: e.hostName, secondary: e.ip, dot: STATUS_COLOR[e.status] }))}
            onClick={() => setTab('endpoint')}
          />

          <div className="mt-4 rounded-lg border border-[#e5e7eb] bg-white p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <IconTile icon={Download} tone="violet" />
              <h3 className="text-[15px] font-semibold text-ink">Deployment</h3>
              <button onClick={() => setTab('installation')} className="ml-auto text-[13px] font-medium text-link hover:underline">
                View more ›
              </button>
            </div>

            {/* The 2×2 block grows to the drill-down's height rather than
                floating short at the top of its cell. */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-2 grid-rows-2 gap-3">
                {BREAKDOWN_STATUSES.map((st) => (
                  <StatCard
                    key={st.key}
                    label={st.label}
                    value={{ success: d.success, failed: d.failed, inProgress: d.inProgress, other: pending }[st.key]}
                    color={st.color}
                  />
                ))}
              </div>
              <StatusBreakdownCard
                title="Status by Remote Office"
                icon={MapPin}
                data={STATUS_BY_REMOTE_OFFICE}
                totalLabel="Total Installations"
                allLabel="All Remote Offices"
              />
            </div>
          </div>
        </div>
      )}

      {tab === 'endpoint' && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-6 pb-3 pt-4"><SearchBar value={q} onChange={setQ} /></div>
          <DataTable columns={cols} rows={rows} rowKey={(e) => e.id} empty="No endpoints targeted." />
          <Pagination total={rows.length} />
        </div>
      )}

      {/* An OS Upgrade run carries one image. It is still a patch record here,
          so it lists in the Patches tab like any other payload. */}
      {tab === 'patches' && (
        <div className="flex min-h-0 flex-1 flex-col pt-2">
          <DataTable
            selectable={false}
            columns={[
              { key: 'id', header: 'Patch ID', cell: () => <IdPill>{d.payloadId}</IdPill> },
              { key: 'name', header: 'Name', cell: () => d.payloadName },
              { key: 'cat', header: 'Patch Category', cell: () => d.category },
              { key: 'rel', header: 'Release Date', cell: () => img.releaseDate.replace(/^[A-Za-z]{3}, /, '') },
              { key: 'size', header: 'Download Size', cell: () => img.size },
              /* An OS image carries no approval; only a Patch run lists one. */
              ...(d.category === 'OS Upgrade' ? [] : [{ key: 'appr', header: 'Approval Status', cell: () => (
                <span className={img.approval === 'Approved' ? 'text-ok' : 'text-warn'}>{img.approval}</span>
              ) }]),
            ]}
            rows={[d]}
            rowKey={(r) => r.payloadId}
            onRowClick={() => onOpenUpgrade(d.payloadId)}
            empty="No patches in this deployment."
          />
        </div>
      )}

      {tab === 'installation' && (
        <InstallationTab
          matrix
          rows={all.map((e) => ({
            id: e.id, hostName: e.hostName, ip: e.ip, configType: 'Install',
            patchId: d.payloadId,
            patchName: d.payloadName,
            /* An OS image carries no CVSS rating — the column exists because a
               patch run fills it, and an upgrade run says so rather than inventing one. */
            severity: d.category === 'OS Upgrade' ? 'Unspecified' : 'Critical',
            severityColor: d.category === 'OS Upgrade' ? '#6B7280' : '#EF4444',
            deploymentDate: e.deployedOn === '---' ? null : e.deployedOn,
            installStatus: e.status === 'Yet to Receive' ? 'Not Ready' : e.status,
            retry: e.retryCount,
            downloadStatus: e.status === 'Yet to Receive' ? 'Pending' : 'Success',
            result: e.status === 'Failed' ? e.reason
              : e.status === 'Success' ? 'Installed successfully'
              : e.status === 'In Progress' ? 'Applying image' : '',
            taskType: 'Manual Remote Deploy',
            online: e.status !== 'Yet to Receive',
          }))}
        />
      )}

      {tab === 'audit' && (
        <AuditTrail
          entries={[
            { actor: d.createdBy, text: `${d.createdBy} has created Patch Deployment ${d.id}.`, when: d.createdOn },
            { actor: d.createdBy, text: `Deployment Category set to ${d.category}.`, when: d.createdOn },
            { actor: d.createdBy, text: `Status changed to ${d.status}.`, when: d.lastUpdated },
          ]}
        />
      )}
    </RecordPage>
  );
}
