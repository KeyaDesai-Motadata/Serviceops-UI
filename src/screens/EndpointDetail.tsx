import { useState } from 'react';
import { ScanLine, Rocket } from 'lucide-react';
import { RecordPage, DetailHeader, UnderlineTabs, PropertiesPanel, PrimaryAction, Tags, Dot, Dash, type TabDef } from '../ui/Detail';
import { DataTable, Pagination, SearchBar, BucketPills, IdPill, BulkActionBar, type Column } from '../ui/Table';

/* Endpoint detail — the second reference screen, with OS Upgrade added as its
 * own tab beside Patches (not a bucket inside the Patches tab).
 *
 * The tab lists through the SAME grid as the patch buckets: an OS upgrade
 * offered to this machine is a row, not a card. The columns an image has no
 * answer for read '---', exactly as they already do for the many catalog
 * patches that carry no KB Number. */

const TABS: TabDef[] = [
  { id: 'patches', label: 'Patches' },
  { id: 'os-upgrade', label: 'OS Upgrade' },
  { id: 'installation', label: 'Installation' },
  { id: 'notes', label: 'Notes' },
  { id: 'audit', label: 'Audit Trail' },
];

interface Row {
  id: string; name: string; category: string; severity: string; severityColor: string;
  approval: string; releaseDate: string; kb: string | null; size: string; uuid: string;
  bucket: 'Missing' | 'Installed' | 'Ignored' | 'OS Upgrade';
}

const ROWS: Row[] = [
  { id: 'PCH-2301', name: 'dnsmasq-base', category: 'Updates', severity: 'Low', severityColor: '#111827', approval: 'Approved', releaseDate: 'Sat, Aug 15, 2026 05:30 PM', kb: null, size: '380.71 KB', uuid: '424acabe2ae096...', bucket: 'Missing' },
  { id: 'PCH-2284', name: 'linux-firmware', category: 'Security Updates', severity: 'Important', severityColor: '#F59E0B', approval: 'Approved', releaseDate: 'Tue, Aug 11, 2026 05:30 PM', kb: null, size: '412.08 MB', uuid: '9c4b2f701d8a4e...', bucket: 'Missing' },
  { id: 'PCH-2190', name: 'openssl', category: 'Security Updates', severity: 'Critical', severityColor: '#EF4444', approval: 'Approved', releaseDate: 'Mon, Jul 20, 2026 05:30 PM', kb: null, size: '1.82 MB', uuid: 'a2d64c198e0f42...', bucket: 'Installed' },
  { id: 'PCH-2155', name: 'thunderbird', category: 'Third Party Updates', severity: 'Moderate', severityColor: '#EAB308', approval: 'Not Approved', releaseDate: 'Fri, Jun 26, 2026 11:00 AM', kb: null, size: '68.42 MB', uuid: '3f9a7d216b4e4f...', bucket: 'Ignored' },
  /* The OS upgrade this machine is offered, shaped as a patch row so it renders
     through the same grid — the parity is structural, not a second table. */
  { id: 'OSU-2', name: 'Ubuntu Server 22.04.4 LTS (x64)', category: 'OS Upgrade', severity: 'Unspecified', severityColor: '#6B7280', approval: 'Not Approved', releaseDate: 'Thu, Feb 22, 2024 11:00 AM', kb: null, size: '1.8 GB', uuid: 'ubuntu-server-22-04-4-lts-x64', bucket: 'OS Upgrade' },
];

const count = (b: Row['bucket']) => ROWS.filter((r) => r.bucket === b).length;

export function EndpointDetail({ onBack, onOpenUpgrade, onDeploy }: {
  onBack: () => void; onOpenUpgrade: (id: string) => void;
  /** Deploy OS Upgrade — a new OS Upgrade run targeting this endpoint; from the
   *  OS Upgrade tab's Take Action it also carries the chosen OS upgrade. */
  onDeploy: (endpointId: string, imageId?: string) => void;
}) {
  const [tab, setTab] = useState('patches');
  /* Ticked OS upgrades on the OS Upgrade tab — what Take Action acts on. */
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [bucket, setBucket] = useState<Row['bucket']>('Missing');
  /* The OS Upgrade tab reuses the grid with the 'OS Upgrade' rows. */
  const activeBucket: Row['bucket'] = tab === 'os-upgrade' ? 'OS Upgrade' : bucket;
  const [q, setQ] = useState('');

  const query = q.trim().toLowerCase();
  const rows = ROWS.filter((r) => r.bucket === activeBucket).filter((r) =>
    !query || r.id.toLowerCase().includes(query) || r.name.toLowerCase().includes(query) ||
    r.category.toLowerCase().includes(query) || r.uuid.toLowerCase().includes(query));

  const allCols: Column<Row>[] = [
    { key: 'id', header: 'ID', cell: (r) => <IdPill>{r.id}</IdPill> },
    { key: 'name', header: 'Name', cell: (r) => r.name },
    { key: 'cat', header: 'Patch Category', cell: (r) => r.category },
    { key: 'sev', header: 'Severity', cell: (r) => <Dot color={r.severityColor}>{r.severity}</Dot> },
    { key: 'appr', header: 'Approval Status', cell: (r) => (
      <span className={r.approval === 'Approved' ? 'text-ok' : 'text-warn'}>{r.approval}</span>
    ) },
    { key: 'rel', header: 'Release Date', cell: (r) => r.releaseDate },
    { key: 'kb', header: 'KB Number', cell: (r) => r.kb ?? <Dash /> },
    { key: 'size', header: 'Download Size', cell: (r) => r.size },
    { key: 'uuid', header: 'UUID', cell: (r) => <span className="block max-w-[220px] truncate">{r.uuid}</span> },
  ];
  /* An OS upgrade carries no severity, so the OS Upgrade tab drops that column. */
  const cols = tab === 'os-upgrade' ? allCols.filter((c) => c.key !== 'sev') : allCols;

  return (
    <RecordPage
      id="EP-16"
      title="harsh-patil-Precision-5560"
      onClose={onBack}
      header={
        <DetailHeader
          id="EP-16"
          title="harsh-patil-Precision-5560"
          dot="#22C55E"
          kpis={[
            { label: 'System Health', value: <Dot color="#22C55E">Healthy</Dot> },
            { label: 'Missing Patches', value: <span className="text-risk">{count('Missing')}</span> },
            { label: 'Reboot Required', value: 'No' },
            { label: 'Last Scan', value: 'Thu, Sep 24, 2026 02:46 PM' },
          ]}
          action={<PrimaryAction><ScanLine size={14} /> Scan Now</PrimaryAction>}
          menu={[{ label: 'Deploy OS Upgrade', icon: Rocket, onClick: () => onDeploy('EP-16') }]}
        />
      }
      tabs={<UnderlineTabs tabs={TABS} active={tab} onChange={setTab} />}
      panel={
        <PropertiesPanel
          title="Endpoint Properties"
          sections={[
            {
              title: 'Endpoint Fields',
              fields: [
                { label: 'System Health', value: <Dot color="#22C55E">Healthy</Dot> },
                { label: 'Used By', value: <Dash /> },
                { label: 'Service Pack', value: '7.0.0-31-generic' },
                { label: 'IP Address', value: '10.20.40.51' },
                { label: 'Host Name', value: 'harsh-patil-Precision-5560' },
                { label: 'Architecture', value: '64 BIT' },
                { label: 'OS Name', value: 'Ubuntu 24.04' },
                { label: 'OS Version', value: '24.04.5 LTS (Noble Numbat)' },
                { label: 'Tags', value: <Tags /> },
              ],
            },
            {
              title: 'Other Info',
              fields: [
                { label: 'Asset ID', value: <Dash /> },
                { label: 'CI ID', value: <span className="text-link">CI-176</span> },
                { label: 'Agent ID', value: 'AGENT-24' },
                { label: 'Reboot Required', value: 'No' },
                { label: 'Agent Version', value: '8.7.503' },
                { label: 'Poller', value: <Dash /> },
                { label: 'MAC Address', value: <Dash /> },
                { label: 'Domain Name', value: <Dash /> },
                { label: 'Remote Office', value: '12th floor left' },
                { label: 'Last Logged In User', value: 'harsh-patil' },
                { label: 'Language', value: <Dash /> },
              ],
            },
            {
              title: 'Scan Info',
              fields: [
                { label: 'Patch Scan Date', value: (
                  <span className="flex flex-wrap items-center gap-2">
                    Wed, Sep 23, 2026 03:27 PM
                    <span className="rounded bg-ok-soft px-1.5 py-0.5 text-[11px] font-medium text-ok">Completed</span>
                  </span>
                ) },
                { label: 'Last Reboot Time', value: 'Tue, Sep 22, 2026 03:41 PM' },
              ],
            },
          ]}
        />
      }
    >
      {tab === 'patches' || tab === 'os-upgrade' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-3 px-6 pb-3 pt-4">
            {tab === 'patches' && (
              <>
                <BucketPills
                  items={(['Missing', 'Installed', 'Ignored'] as const).map((b) => ({ id: b, label: b, count: count(b) }))}
                  active={bucket}
                  onChange={(b) => setBucket(b as Row['bucket'])}
                />
                <span className="h-5 w-px bg-[#E3E8EF]" />
              </>
            )}
            <SearchBar value={q} onChange={setQ} />
          </div>
          {tab === 'os-upgrade' && (
            <div className="px-6">
              <BulkActionBar
                count={picked.size}
                onClear={() => setPicked(new Set())}
                actions={[{
                  label: 'Deploy OS Upgrade',
                  icon: Rocket,
                  onClick: () => onDeploy('EP-16', [...picked][0]),
                  /* A run delivers ONE operating system image (DeploymentCreate). */
                  disabledReason: picked.size > 1 ? 'A deployment carries one OS upgrade — select only one.' : undefined,
                }]}
              />
            </div>
          )}
          <DataTable
            columns={cols}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={tab === 'os-upgrade' ? (r) => onOpenUpgrade(r.id) : undefined}
            {...(tab === 'os-upgrade' ? { selected: picked, onSelectedChange: setPicked } : {})}
            empty={activeBucket === 'OS Upgrade'
              ? 'No OS upgrade is published for this platform.'
              : `No ${activeBucket.toLowerCase()} patches found.`}
          />
          <Pagination total={rows.length} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center text-[13px] text-label">
          {TABS.find((t) => t.id === tab)?.label} — not part of this design.
        </div>
      )}
    </RecordPage>
  );
}
