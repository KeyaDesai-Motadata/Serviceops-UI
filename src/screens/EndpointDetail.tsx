import { useState } from 'react';
import { Monitor, Cog, Rocket, StickyNote, ScrollText, ScanLine, Clock } from 'lucide-react';
import { DetailHeader, PrimaryAction, KeyFields, TagRow, PillTabs, InfoRail, Dot, Dash, type TabDef } from '../ui/Detail';
import { DataTable, Pagination, SearchBar, SideNav, IdPill, type Column } from '../ui/Table';

/* Endpoint detail — the second reference screen, with OS Upgrade added as a
 * fourth bucket in the left sub-nav after Ignored.
 *
 * The bucket lists through the SAME grid as the other three: an OS upgrade
 * offered to this machine is a row, not a card. The columns an image has no
 * answer for read '---', exactly as they already do for the many catalog
 * patches that carry no KB Number. */

const TABS: TabDef[] = [
  { id: 'patches', label: 'Patches', icon: Cog },
  { id: 'installation', label: 'Installation', icon: Rocket },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'audit', label: 'Audit Trail', icon: ScrollText },
];

interface Row {
  id: string; name: string; category: string; severity: string; severityColor: string;
  approval: string; releaseDate: string; kb: string | null; size: string; uuid: string;
  bucket: 'Missing' | 'Installed' | 'Ignored' | 'OS Upgrade';
}

const ROWS: Row[] = [
  { id: 'PCH-2301', name: 'dnsmasq-base', category: 'Updates', severity: 'Low', severityColor: '#111827', approval: 'Approved', releaseDate: 'Sat, Aug 15, 2026 05:30 PM', kb: null, size: '380.71 KB', uuid: '424acabe2ae096...', bucket: 'Missing' },
  { id: 'PCH-2284', name: 'linux-firmware', category: 'Security Updates', severity: 'Important', severityColor: '#D97706', approval: 'Approved', releaseDate: 'Tue, Aug 11, 2026 05:30 PM', kb: null, size: '412.08 MB', uuid: '9c4b2f701d8a4e...', bucket: 'Missing' },
  { id: 'PCH-2190', name: 'openssl', category: 'Security Updates', severity: 'Critical', severityColor: '#DC2626', approval: 'Approved', releaseDate: 'Mon, Jul 20, 2026 05:30 PM', kb: null, size: '1.82 MB', uuid: 'a2d64c198e0f42...', bucket: 'Installed' },
  { id: 'PCH-2155', name: 'thunderbird', category: 'Third Party Updates', severity: 'Moderate', severityColor: '#EAB308', approval: 'Not Approved', releaseDate: 'Fri, Jun 26, 2026 11:00 AM', kb: null, size: '68.42 MB', uuid: '3f9a7d216b4e4f...', bucket: 'Ignored' },
  /* The OS upgrade this machine is offered, shaped as a patch row so it renders
     through the same grid — the parity is structural, not a second table. */
  { id: 'OSU-2', name: 'Ubuntu Server 22.04.4 LTS (x64)', category: 'OS Upgrade', severity: 'Unspecified', severityColor: '#6B7280', approval: 'Not Approved', releaseDate: 'Thu, Feb 22, 2024 11:00 AM', kb: null, size: '1.8 GB', uuid: 'ubuntu-server-22-04-4-lts-x64', bucket: 'OS Upgrade' },
];

export function EndpointDetail({ onBack, onOpenUpgrade }: { onBack: () => void; onOpenUpgrade: (id: string) => void }) {
  const [tab, setTab] = useState('patches');
  const [bucket, setBucket] = useState<Row['bucket']>('Missing');
  const [q, setQ] = useState('');

  const query = q.trim().toLowerCase();
  const rows = ROWS.filter((r) => r.bucket === bucket).filter((r) =>
    !query || r.id.toLowerCase().includes(query) || r.name.toLowerCase().includes(query) ||
    r.category.toLowerCase().includes(query) || r.uuid.toLowerCase().includes(query));

  const cols: Column<Row>[] = [
    { key: 'id', header: 'ID', cell: (r) => (
      r.bucket === 'OS Upgrade'
        ? <button onClick={() => onOpenUpgrade(r.id)}><IdPill>{r.id}</IdPill></button>
        : <IdPill>{r.id}</IdPill>
    ) },
    { key: 'name', header: 'Name', cell: (r) => r.name },
    { key: 'cat', header: 'Patch Category', cell: (r) => r.category },
    { key: 'sev', header: 'Severity', cell: (r) => <Dot color={r.severityColor}>{r.severity}</Dot> },
    { key: 'appr', header: 'Approval Status', cell: (r) => (
      <Dot color={r.approval === 'Approved' ? '#16A34A' : '#D97706'}>
        <span className={r.approval === 'Approved' ? 'text-ok' : 'text-warn'}>{r.approval}</span>
      </Dot>
    ) },
    { key: 'rel', header: 'Release Date', cell: (r) => r.releaseDate },
    { key: 'kb', header: 'KB Number', cell: (r) => r.kb ?? <Dash /> },
    { key: 'size', header: 'Download Size', cell: (r) => r.size },
    { key: 'uuid', header: 'UUID', cell: (r) => <span className="block max-w-[220px] truncate">{r.uuid}</span> },
  ];

  const counts = (b: Row['bucket']) => ROWS.filter((r) => r.bucket === b).length;

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <DetailHeader
          icon={Monitor}
          id="EP-16"
          title="harsh-patil-Precision-5560"
          dot="#16A34A"
          onBack={onBack}
          subtitle={<span className="flex items-center gap-1.5"><Clock size={13} /> Thu, Sep 24, 2026 02:46 PM</span>}
          action={<PrimaryAction><ScanLine size={14} /> Scan Now</PrimaryAction>}
        />

        <KeyFields
          cols={6}
          fields={[
            { label: 'System Health', value: <Dot color="#16A34A">Healthy</Dot> },
            { label: 'Used By', value: <Dash /> },
            { label: 'Service Pack', value: '7.0.0-31-generic' },
            { label: 'IP Address', value: '10.20.40.51' },
            { label: 'Host Name', value: 'harsh-patil-Precision-5560' },
            { label: 'Architecture', value: '64 BIT' },
            { label: 'OS Name', value: 'Ubuntu 24.04' },
            { label: 'OS Version', value: '24.04.5 LTS (Noble Numbat)' },
          ]}
        />

        <TagRow />
        <PillTabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === 'patches' ? (
          <div className="flex min-h-0 flex-1">
            <SideNav
              items={(['Missing', 'Installed', 'Ignored', 'OS Upgrade'] as const)
                .map((b) => ({ id: b, label: `${b}${counts(b) ? ` (${counts(b)})` : ''}` }))}
              active={bucket}
              onChange={(b) => setBucket(b as Row['bucket'])}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="px-4 py-3"><SearchBar value={q} onChange={setQ} /></div>
              <DataTable
                columns={cols}
                rows={rows}
                rowKey={(r) => r.id}
                empty={bucket === 'OS Upgrade'
                  ? 'No OS upgrade is published for this platform.'
                  : `No ${bucket.toLowerCase()} patches found.`}
              />
              <Pagination total={rows.length} noun="items" />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center text-[13px] text-label">
            {TABS.find((t) => t.id === tab)?.label} — not part of this design.
          </div>
        )}
      </div>

      <InfoRail sections={[
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
      ]} />
    </div>
  );
}
