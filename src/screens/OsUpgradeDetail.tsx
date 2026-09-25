import { useState } from 'react';
import { Cog, Monitor, ListChecks, Rocket, ScrollText, Check, X, Circle, LayoutGrid, Files, Download, RefreshCw } from 'lucide-react';
import {
  DetailHeader, PrimaryAction, DangerAction, KeyFields, TagRow, DescriptionCard,
  PillTabs, InfoRail, Dot, Dash, type TabDef,
} from '../ui/Detail';
import { DataTable, Pagination, SearchBar, SideNav, IdPill, type Column } from '../ui/Table';
import { InstallationTab } from '../ui/InstallationTab';
import { installRowsFor } from '../data/install';
import { byId, endpointsFor, type ScopedEndpoint } from '../data/osUpgrade';

/* OS Upgrade detail.
 *
 * The patch detail page's frame exactly — header, key-field grid, tags,
 * description card, pill tabs, Other Info rail. Two tabs differ from a patch:
 * Prerequisites replaces Affected Products (an image IS the product, so a list
 * of what it affects would only restate the title), and there is no Superseded,
 * because an ISO has no supersedence chain. */

const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'prereq', label: 'Prerequisites', icon: ListChecks },
  { id: 'endpoint', label: 'Endpoint', icon: Monitor },
  { id: 'installation', label: 'Installation', icon: Rocket },
  { id: 'audit', label: 'Audit Trail', icon: ScrollText },
];

export function OsUpgradeDetail({ id, onBack, onOpenRun }: {
  id: string; onBack: () => void; onOpenRun: (runId: string) => void;
}) {
  const u = byId(id);
  const [tab, setTab] = useState('overview');
  const [bucket, setBucket] = useState<'Compatible' | 'Incompatible'>('Compatible');
  const [q, setQ] = useState('');
  const [approval, setApproval] = useState(u.approval);

  const fleet = endpointsFor(u);
  const query = q.trim().toLowerCase();
  const rows = fleet.filter((e) => e.status === bucket).filter((e) =>
    !query || e.id.toLowerCase().includes(query) || e.hostName.toLowerCase().includes(query) ||
    e.ip.includes(query) || e.currentOs.toLowerCase().includes(query) || e.reason.toLowerCase().includes(query));

  const cols: Column<ScopedEndpoint>[] = [
    { key: 'id', header: 'ID', cell: (e) => <IdPill>{e.id}</IdPill> },
    { key: 'host', header: 'Host Name', cell: (e) => e.hostName },
    { key: 'ip', header: 'IP Address', cell: (e) => e.ip },
    { key: 'os', header: 'Current OS', cell: (e) => e.currentOs },
    { key: 'agent', header: 'Agent Version', cell: (e) => e.agentVersion },
    { key: 'arch', header: 'Architecture', cell: (e) => e.architecture },
    { key: 'status', header: 'Compatibility Status', cell: (e) => (
      <Dot color={e.status === 'Compatible' ? '#16A34A' : '#DC2626'}>
        <span className={e.status === 'Compatible' ? 'text-ok' : 'text-risk'}>{e.status}</span>
      </Dot>
    ) },
    { key: 'reason', header: 'Reason', cell: (e) => e.reason ? <span className="text-risk">{e.reason}</span> : <Dash /> },
  ];

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <DetailHeader
          icon={Cog}
          id={u.id}
          title={u.name}
          onBack={onBack}
          action={approval === 'Approved'
            ? <DangerAction onClick={() => setApproval('Not Approved')}><X size={14} /> Decline</DangerAction>
            : <PrimaryAction onClick={() => setApproval('Approved')}><Check size={14} /> Approve</PrimaryAction>}
        />

        <KeyFields
          fields={[
            { label: 'Patch Category', value: 'OS Upgrade' },
            { label: 'Platform', value: u.platform },
            { label: 'Approval Status', value: (
              <Dot color={approval === 'Approved' ? '#16A34A' : '#D97706'}>
                <span className={approval === 'Approved' ? 'text-ok' : 'text-warn'}>{approval}</span>
              </Dot>
            ) },
            { label: 'Test Status', value: u.testStatus },
            { label: 'Release Date', value: u.releaseDate.replace(/^[A-Za-z]{3}, /, '') },
            { label: 'End of Support', value: u.eosDate },
            { label: 'Edition', value: u.edition },
            { label: 'OS Language', value: u.language },
            /* ⚠️ No compatibility count here. It belongs to the Endpoint tab and the
               Prerequisites footer, which is where it can be acted on; in the key
               fields it was a number with nothing to click and a third place for
               the same figure to drift. */
            { label: 'Refrence Url', value: (
              <a href={u.referenceUrl} target="_blank" rel="noreferrer" className="break-all text-link hover:underline">{u.referenceUrl}</a>
            ) },
          ]}
        />

        <TagRow />
        <DescriptionCard title="Upgrade Details">{u.description}</DescriptionCard>

        <PillTabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === 'overview' && (
          <div className="scroll-y min-h-0 flex-1 px-5 py-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Endpoints counts the two COMPATIBILITY states, not patch buckets —
                  a machine is eligible for an operating system or ruled out of it. */}
              <OverviewCard
                icon={Monitor} label="Endpoints" total={u.compatible + u.incompatible}
                onOpen={() => setTab('endpoint')}
                legend={[
                  { label: 'Compatible', value: u.compatible, color: '#16A34A' },
                  { label: 'Incompatible', value: u.incompatible, color: '#DC2626' },
                ]}
              />
              <OverviewCard
                icon={Download} label="Deployments" total={1}
                onOpen={() => setTab('deployment')}
                legend={[
                  { label: 'In Progress', value: 1, color: '#D97706' },
                  { label: 'Success', value: 0, color: '#16A34A' },
                  { label: 'Failed', value: 0, color: '#DC2626' },
                ]}
              />
              {/* No Affected Products card: the image IS the product, so the card
                  could only ever restate the record's own title. */}
              <div className="rounded-lg border border-line p-4">
                <div className="flex items-center gap-2">
                  <Files size={15} className="text-label" />
                  <h3 className="text-[13px] font-semibold text-ink">Files</h3>
                  <span className="ml-auto text-[12px] text-label">1</span>
                </div>
                <div className="mt-3 rounded-md bg-strip px-3 py-2">
                  <div className="truncate text-[12.5px] text-value">{u.uuid}.iso</div>
                  <div className="mt-0.5 text-[11.5px] text-label">{u.size} · Language: {u.language}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'endpoint' && (
          <div className="flex min-h-0 flex-1">
            {/* Buckets stack down the left, as the product's Patches tab does. */}
            <SideNav
              items={[
                { id: 'Compatible', label: 'Compatible' },
                { id: 'Incompatible', label: 'Incompatible' },
              ]}
              active={bucket}
              onChange={(b) => setBucket(b as typeof bucket)}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-3 px-4 py-3">
                <SearchBar value={q} onChange={setQ} />
                {/* Machines already on the target build are in neither bucket —
                    counting them would overstate the outstanding work. */}
                {u.onBuild > 0 && (
                  <span className="whitespace-nowrap text-[12px] text-label">{u.onBuild} already on this build</span>
                )}
                <button className="flex h-9 flex-none items-center gap-1.5 rounded-md border border-line px-3 text-[12.5px] font-medium text-ink-soft hover:bg-strip">
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
              <DataTable columns={cols} rows={rows} rowKey={(e) => e.id} empty={`No ${bucket.toLowerCase()} endpoints found.`} />
              <Pagination total={rows.length} noun="items" />
            </div>
          </div>
        )}

        {tab === 'prereq' && (
          <div className="scroll-y min-h-0 flex-1 px-5 py-4">
            {/* One card: head with the rule count, a grey panel of the rules read
                as sentences, and a footer tying them to the fleet they judge. */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <ListChecks size={16} className="flex-none text-ink" />
                <h3 className="text-[13.5px] font-semibold text-ink">Prerequisites</h3>
                <span className="ml-auto text-[12px] text-label">
                  {u.prereqs.filter((p) => p.value !== 'Not restricted').length} rules · all must pass
                </span>
              </div>
              <div className="rounded-lg bg-strip p-5">
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-3 xl:grid-cols-4">
                  {u.prereqs.map((p) => (
                    <div key={p.attribute} className="min-w-0">
                      <div className="mb-1 text-[12px] text-label">{p.attribute}</div>
                      <div className={`break-words text-[13px] ${p.value === 'Not restricted' ? 'text-label' : 'font-medium text-value'}`}>
                        {p.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-[12px] text-label">
                  An endpoint must meet or exceed every value above before this upgrade is offered to it.
                </p>
                <span className="ml-auto text-[12px] text-label">
                  Evaluated against <b className="font-semibold text-value">{u.compatible + u.incompatible}</b> endpoints ·{' '}
                  <b className="font-semibold text-ok">{u.compatible} compatible</b>
                </span>
                <button onClick={() => setTab('endpoint')} className="text-[12px] font-medium text-link hover:underline">
                  View endpoints ›
                </button>
              </div>
            </section>
          </div>
        )}

        {tab === 'installation' && (
          <InstallationTab rows={installRowsFor(u)} />
        )}

        {tab === 'deployment-unused' && (
          <div className="scroll-y min-h-0 flex-1 px-5 py-4">
            <table className="w-full max-w-[980px]">
              <thead>
                <tr className="border-b border-line">
                  {['ID', 'Deployment Name', 'Status', 'Targeted', 'Install After'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[12.5px] font-semibold text-value">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-line-soft hover:bg-strip">
                  <td className="px-4 py-2.5"><button onClick={() => onOpenRun('PDR-2041')}><IdPill>PDR-2041</IdPill></button></td>
                  <td className="px-4 py-2.5 text-[12.5px] text-value">Windows 11 25H2 — Finance rollout</td>
                  <td className="px-4 py-2.5 text-[12.5px]"><Dot color="#D97706"><span className="text-warn">In Progress</span></Dot></td>
                  <td className="px-4 py-2.5 text-[12.5px] text-value">42</td>
                  <td className="px-4 py-2.5 text-[12.5px] text-value">Sun, Sep 27, 2026 03:30 PM</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {tab === 'audit' && (
          <div className="scroll-y min-h-0 flex-1 px-5 py-4">
            {[
              [`System has created OS Upgrade ${u.id}.`, 'Mon, Sep 21, 2026 05:24 PM (3 days ago)'],
              [`Image downloaded from source — ${u.size}.`, u.downloadOn],
              [`Approval Status changed to ${approval}.`, 'Mon, Sep 21, 2026 05:31 PM'],
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
          { label: 'UUID', value: <span className="break-all">{u.uuid}</span> },
          { label: 'Architecture', value: u.architecture },
          { label: 'Source', value: u.source },
          { label: 'Status', value: u.status },
          { label: 'Download Status', value: u.downloadStatus },
          { label: 'Download On', value: u.downloadOn },
          { label: 'Download Size', value: u.size },
          { label: 'Reboot Required', value: u.rebootRequired },
          { label: 'Support Uninstallation', value: 'No' },
          { label: 'Approved By', value: approval === 'Approved' ? 'Rakesh Rathod' : <Dash /> },
          { label: 'Approved On', value: approval === 'Approved' ? 'Mon, Sep 21, 2026 05:31 PM' : <Dash /> },
          { label: 'Patch Type', value: 'OS Upgrade' },
          { label: 'Created Date', value: 'Mon, Sep 21, 2026 05:24 PM' },
          { label: 'Last Updated Date', value: 'Thu, Sep 24, 2026 09:12 AM' },
          { label: 'Created By', value: 'System' },
          { label: 'Last Updated By', value: 'Rakesh Rathod' },
        ],
      }]} />
    </div>
  );
}

/* An Overview card: a count, a colour legend, and a link into the tab that
 * holds the rows behind it. Plain counts rather than a gauge — this product
 * states numbers, it does not draw them. */
function OverviewCard({ icon: Icon, label, total, legend, onOpen }: {
  icon: typeof Monitor;
  label: string;
  total: number;
  legend: { label: string; value: number; color: string }[];
  onOpen: () => void;
}) {
  return (
    <div className="rounded-lg border border-line p-4">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-label" />
        <h3 className="text-[13px] font-semibold text-ink">{label}</h3>
        <button onClick={onOpen} className="ml-auto text-[12px] font-medium text-link hover:underline">View more ›</button>
      </div>
      <div className="mt-3 text-[26px] font-semibold leading-none text-ink">{total}</div>
      <div className="mt-3 flex flex-col gap-1.5">
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-2 text-[12.5px]">
            <span className="size-2 flex-none rounded-full" style={{ background: l.color }} />
            <span className="text-label">{l.label}</span>
            <span className="ml-auto font-semibold" style={{ color: l.value ? l.color : '#9CA3AF' }}>{l.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
