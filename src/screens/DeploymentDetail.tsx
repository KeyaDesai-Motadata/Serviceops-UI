import { useState } from 'react';
import { Link2, Monitor, Cog, Rocket, ScrollText, BarChart3, Circle, Clock, MapPin, Download } from 'lucide-react';
import { DetailHeader, KeyFields, PillTabs, InfoRail, Dot, Dash, type TabDef } from '../ui/Detail';
import { DataTable, Pagination, SearchBar, IdPill, type Column } from '../ui/Table';
import { InstallationTab } from '../ui/InstallationTab';
import { CountListCard, StatCard, StatusBreakdownCard, BREAKDOWN_STATUSES, type StatusSplit } from '../ui/Overview';
import { deploymentById, endpointsForRun, type DeployedEndpoint } from '../data/deployment';
import { byId } from '../data/osUpgrade';

/* Patch Deployment — details.
 *
 * Analytics leads, because a run is a thing you WATCH rather than read: the
 * four overall counts, then the download and OS breakdowns, with the two
 * pickers down the right for the same numbers sliced by category and office.
 */

const TABS: TabDef[] = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'endpoint', label: 'Endpoint', icon: Monitor },
  { id: 'patches', label: 'Patches', icon: Cog },
  { id: 'installation', label: 'Installation', icon: Rocket },
  { id: 'audit', label: 'Audit Trail', icon: ScrollText },
];

const STATUS_BY_REMOTE_OFFICE: Record<string, StatusSplit> = {
  'Ahmedabad HQ': { success: 12, failed: 1, inProgress: 4, other: 2 },
  'Mumbai Office': { success: 8, failed: 1, inProgress: 3, other: 1 },
  'Pune Development Center': { success: 5, failed: 1, inProgress: 2, other: 0 },
  'Bengaluru Campus': { success: 3, failed: 0, inProgress: 2, other: 0 },
};

const STATUS_COLOR: Record<DeployedEndpoint['status'], string> = {
  Success: '#16A34A', Failed: '#DC2626', 'In Progress': '#D97706', 'Yet to Receive': '#94A3B8',
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

  const query = q.trim().toLowerCase();
  const rows = all.filter((e) =>
    !query || e.id.toLowerCase().includes(query) || e.hostName.toLowerCase().includes(query) ||
    e.ip.includes(query) || e.remoteOffice.toLowerCase().includes(query));

  const cols: Column<DeployedEndpoint>[] = [
    { key: 'id', header: 'Endpoint ID', cell: (e) => <IdPill>{e.id}</IdPill> },
    { key: 'host', header: 'Host Name', cell: (e) => e.hostName },
    { key: 'ip', header: 'IP Address', cell: (e) => e.ip },
    { key: 'office', header: 'Remote Office', cell: (e) => e.remoteOffice },
    { key: 'status', header: 'Installation Status', cell: (e) => (
      <Dot color={STATUS_COLOR[e.status]}><span style={{ color: STATUS_COLOR[e.status] }}>{e.status}</span></Dot>
    ) },
    { key: 'on', header: 'Deployed On', cell: (e) => e.deployedOn },
    { key: 'retry', header: 'Retry Status', cell: (e) => e.retryCount || 0 },
    { key: 'reason', header: 'Reason', cell: (e) => e.reason ? <span className="text-risk">{e.reason}</span> : <Dash /> },
  ];

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* A run has no record paging and no primary action — it is watched,
            not stepped through or approved. */}
        <DetailHeader
          icon={Link2}
          id={d.id}
          title={d.name}
          onBack={onBack}
          paging={false}
          subtitle={
            <span className="flex flex-wrap items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded bg-link text-[10px] font-semibold text-white">
                {d.createdBy.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </span>
              <span className="font-medium text-link">{d.createdBy}</span>
              <span className="text-label">•</span>
              <Clock size={13} className="text-label" />
              {d.createdOn}
              <span className="rounded bg-warn-soft px-2 py-0.5 text-[11.5px] font-medium text-warn">
                Configuration Type: Install
              </span>
            </span>
          }
        />

        <KeyFields
          fields={[
            { label: 'Status', value: <Dot color={d.statusColor}><span style={{ color: d.statusColor }}>{d.status}</span></Dot> },
            { label: 'Task Type', value: 'Auto Patch Deploy Task' },
            { label: 'Deployment Policy', value: d.policy },
            { label: 'Install After', value: d.installAfter },
            { label: 'Expiry Date', value: d.expiryDate === '---' ? <Dash /> : d.expiryDate },
          ]}
        />

        <PillTabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === 'analytics' && (
          <div className="scroll-y min-h-0 flex-1 px-5 py-4">
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

            <div className="mt-4 rounded-lg border border-line bg-white p-4">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex size-7 flex-none items-center justify-center rounded bg-chip text-ink-soft"><Download size={15} /></span>
                <h3 className="text-[14px] font-semibold text-ink">Deployment</h3>
                <button onClick={() => setTab('installation')} className="ml-auto text-[12.5px] font-medium text-link hover:underline">
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
            <div className="px-5 py-3"><SearchBar value={q} onChange={setQ} /></div>
            <DataTable columns={cols} rows={rows} rowKey={(e) => e.id} empty="No endpoints targeted." />
            <Pagination total={rows.length} noun="items" />
          </div>
        )}

        {/* An OS Upgrade run carries one image. It is still a patch record here,
            so it lists in the Patches tab like any other payload. */}
        {tab === 'patches' && (
          <div className="scroll-y min-h-0 flex-1 px-5 py-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line">
                  {['Patch ID', 'Name', 'Patch Category', 'Release Date', 'Download Size', 'Approval Status'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[12.5px] font-semibold text-value">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-line-soft hover:bg-strip">
                  <td className="px-4 py-2.5"><button onClick={() => onOpenUpgrade(d.payloadId)}><IdPill>{d.payloadId}</IdPill></button></td>
                  <td className="px-4 py-2.5 text-[12.5px] text-value">{d.payloadName}</td>
                  <td className="px-4 py-2.5 text-[12.5px] text-value">{d.category}</td>
                  <td className="px-4 py-2.5 text-[12.5px] text-value">{img.releaseDate.replace(/^[A-Za-z]{3}, /, '')}</td>
                  <td className="px-4 py-2.5 text-[12.5px] text-value">{img.size}</td>
                  <td className="px-4 py-2.5 text-[12.5px]">
                    <Dot color={img.approval === 'Approved' ? '#16A34A' : '#D97706'}>
                      <span className={img.approval === 'Approved' ? 'text-ok' : 'text-warn'}>{img.approval}</span>
                    </Dot>
                  </td>
                </tr>
              </tbody>
            </table>
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
              severityColor: d.category === 'OS Upgrade' ? '#6B7280' : '#DC2626',
              deploymentDate: e.deployedOn === '---' ? null : e.deployedOn,
              installStatus: e.status === 'Yet to Receive' ? 'Not Ready' : e.status,
              retry: e.retryCount,
              downloadStatus: e.status === 'Yet to Receive' ? 'Pending' : 'Success',
              result: e.status === 'Failed' ? e.reason
                : e.status === 'Success' ? 'Installed successfully'
                : e.status === 'In Progress' ? 'Applying image' : '',
              taskType: 'Auto Patch Deploy Task',
              online: e.status !== 'Yet to Receive',
            }))}
          />
        )}

        {tab === 'audit' && (
          <div className="scroll-y min-h-0 flex-1 px-5 py-4">
            {[
              [`${d.createdBy} has created Patch Deployment ${d.id}.`, d.createdOn],
              [`Deployment Category set to ${d.category}.`, d.createdOn],
              [`Status changed to ${d.status}.`, d.lastUpdated],
            ].map(([text, when], i) => (
              <div key={i} className="flex items-start gap-3 border-b border-line-soft py-3 last:border-0">
                <Circle size={10} className="mt-1 flex-none text-label" />
                <div className="min-w-0">
                  <span className="text-[12.5px] text-value">{text}</span>
                  <span className="ml-2 text-[12px] text-label">• {when}</span>
                </div>
              </div>
            ))}
            <Pagination total={3} noun="Audit Trail" />
          </div>
        )}
      </div>

      <InfoRail sections={[{
        title: 'Other Info',
        fields: [
          { label: 'Notify to', value: (
            <select className="h-8 w-full rounded-md border border-line bg-white px-2 text-[12.5px] text-value focus:border-link focus:outline-none">
              <option>Select</option>
              <option>{d.notifyTo}</option>
            </select>
          ) },
          { label: 'Retry Failed Configuration', value: d.retry },
          { label: 'Retry Count', value: all.reduce((s, e) => s + e.retryCount, 0) },
          { label: 'Last Updated Date', value: d.lastUpdated },
          { label: 'Created By', value: <span className="text-link">{d.createdBy}</span> },
          { label: 'Last Updated By', value: <span className="text-link">{d.createdBy}</span> },
        ],
      }]} />
    </div>
  );
}
