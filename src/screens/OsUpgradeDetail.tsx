import { useState } from 'react';
import { Monitor, ListChecks, Files, Download, RefreshCw, UploadCloud, FileText, Rocket } from 'lucide-react';
import {
  RecordPage, DetailHeader, UnderlineTabs, PropertiesPanel,
  DescriptionCard, Tags, Dot, Dash, type TabDef,
} from '../ui/Detail';
import { DataTable, Pagination, SearchBar, BucketPills, IdPill, type Column } from '../ui/Table';
import { DonutCard, IconTile } from '../ui/Overview';
import { InstallationTab } from '../ui/InstallationTab';
import { FileDetailsTab, type ImageFile } from '../ui/FileDetailsTab';
import { installRowsFor } from '../data/install';
import { byId, eligibleFor, countsFor, needsManualUpload, type Evaluated } from '../data/osUpgrade';

/* OS Upgrade detail, on the new UI's record frame — the patch record's tabs,
 * header KPI row and Properties panel.
 *
 * Two tabs differ from a patch: Prerequisites replaces Vulnerabilities /
 * Affected Products (an image IS the product), and there is no Superseded,
 * because an ISO has no supersedence chain. File Details sits after Endpoint:
 * the image is one file, listed the same way. An Enterprise image is uploaded
 * by hand, and until it is, every place that names the file says so and points
 * at that tab.
 *
 * ⚠️ An OS upgrade has NO Approve / Decline action and NO Audit Trail tab. Its
 * approval details (Approval Status, Approved By, Approved On) are shown, read-only. */

const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'prereq', label: 'Prerequisites' },
  { id: 'endpoint', label: 'Endpoint' },
  { id: 'files', label: 'File Details' },
  { id: 'installation', label: 'Installation' },
];

const VERDICT_COLOR: Record<string, string> = { Compatible: '#22C55E', Incompatible: '#EF4444' };

export function OsUpgradeDetail({ id, onBack, onOpenRun, onDeploy, initialTab, initialBucket, initialQuery }: {
  id: string; onBack: () => void; onOpenRun: (runId: string) => void;
  /** ⋮ › Deploy OS Upgrade — a new OS Upgrade run carrying this image. */
  onDeploy: (imageId: string) => void;
  /* Set when a dashboard widget drilled in: the page opens on the tab, bucket
   * and search term the widget was pointing at. */
  initialTab?: string; initialBucket?: string; initialQuery?: string;
}) {
  const u = byId(id);
  const [tab, setTab] = useState(initialTab && TABS.some((t) => t.id === initialTab) ? initialTab : 'overview');
  const [bucket, setBucket] = useState<string>(initialBucket === 'Incompatible' ? 'Incompatible' : 'Compatible');
  const [q, setQ] = useState(initialQuery ?? '');
  const manual = needsManualUpload(u);
  const [file, setFile] = useState<ImageFile | null>(u.downloadStatus === 'Success' ? {
    name: `${u.uuid}.iso`, size: u.size, language: u.language,
    source: manual ? 'Manual Upload' : 'Vendor Catalog',
    uploadedBy: manual ? 'Rakesh Rathod' : 'System', uploadedOn: u.downloadOn,
  } : null);
  const awaiting = manual && !file;
  const tabs = TABS.map((t) => t.id === 'files' ? { ...t, attention: awaiting } : t);

  const fleet = eligibleFor(u);
  const c = countsFor(u);
  const query = q.trim().toLowerCase();
  const rows = fleet.filter((r) => r.verdict === bucket).filter((r) =>
    !query || r.endpoint.id.toLowerCase().includes(query) || r.endpoint.hostName.toLowerCase().includes(query) ||
    r.endpoint.ip.includes(query) || r.reasons.join(' ').toLowerCase().includes(query));

  const uploadState = awaiting
    ? <button onClick={() => setTab('files')} className="text-warn hover:underline">Yet to Upload</button>
    : 'Success';

  const cols: Column<Evaluated>[] = [
    { key: 'id', header: 'ID', cell: (r) => <IdPill>{r.endpoint.id}</IdPill> },
    { key: 'host', header: 'Host Name', cell: (r) => r.endpoint.hostName },
    { key: 'ip', header: 'IP Address', cell: (r) => r.endpoint.ip },
    { key: 'os', header: 'Current OS', cell: (r) => `${r.endpoint.family} ${r.endpoint.release}` },
    { key: 'agent', header: 'Agent Version', cell: (r) => r.endpoint.agentVersion },
    { key: 'arch', header: 'Architecture', cell: (r) => r.endpoint.architecture },
    { key: 'status', header: 'Compatibility Status', cell: (r) => (
      <Dot color={VERDICT_COLOR[r.verdict] ?? '#94A3B8'}>
        <span style={{ color: VERDICT_COLOR[r.verdict] ?? '#94A3B8' }}>{r.verdict}</span>
      </Dot>
    ) },
    { key: 'reason', header: 'Reason', cell: (r) => r.reasons.length ? <span className="text-risk">{r.reasons.join(' · ')}</span> : <Dash /> },
  ];

  return (
    <RecordPage
      id={u.id}
      title={u.name}
      onClose={onBack}
      header={
        <DetailHeader
          id={u.id}
          title={u.name}
          badge={awaiting && (
            <button onClick={() => setTab('files')} title="Open File Details to upload the ISO"
              className="inline-flex flex-none items-center gap-1.5 rounded-full border border-warn/40 bg-warn-soft px-2.5 py-0.5 text-[12px] font-medium text-warn hover:brightness-[0.97]">
              <UploadCloud size={13} /> Upload required
            </button>
          )}
          kpis={[
            { label: 'Category', value: 'OS Upgrade' },
            { label: 'Platform', value: u.family },
            { label: 'Edition', value: u.edition },
            /* Uploaded once the ISO is on the file server; until then nothing can deploy it. */
            { label: 'Upload Status', value: awaiting
              ? <button onClick={() => setTab('files')} className="text-warn hover:underline">Yet to Upload</button>
              : <span className="text-ok">Uploaded</span> },
            { label: 'Approval Status', value: <Dot color={u.approval === 'Approved' ? '#22C55E' : '#F59E0B'}><span className={u.approval === 'Approved' ? 'text-ok' : 'text-warn'}>{u.approval}</span></Dot> },
            { label: 'Release Date', value: u.releaseDate.replace(/^[A-Za-z]{3}, /, '').replace(/ \d{2}:\d{2} [AP]M$/, '') },
            { label: 'End of Support', value: u.eosDate },
          ]}
          menu={[{
            label: 'Deploy OS Upgrade',
            icon: Rocket,
            onClick: () => onDeploy(u.id),
            disabledReason: awaiting ? 'Upload the ISO in File Details first.' : undefined,
          }]}
        />
      }
      tabs={<UnderlineTabs tabs={tabs} active={tab} onChange={setTab} />}
      panel={
        <PropertiesPanel
          title="OS Upgrade Properties"
          sections={[
            {
              title: 'OS Upgrade Fields',
              fields: [
                { label: 'Patch Category', value: 'OS Upgrade' },
                { label: 'Platform', value: u.family },
                { label: 'Approval Status', value: <Dot color={u.approval === 'Approved' ? '#22C55E' : '#F59E0B'}><span className={u.approval === 'Approved' ? 'text-ok' : 'text-warn'}>{u.approval}</span></Dot> },
                { label: 'KB Number', value: u.kb },
                { label: 'Release Date', value: u.releaseDate.replace(/^[A-Za-z]{3}, /, '') },
                { label: 'End of Support', value: u.eosDate },
                { label: 'Edition', value: u.edition },
                { label: 'OS Language', value: u.language },
                /* ⚠️ No compatibility count here. It belongs to the Endpoint tab and
                   the Prerequisites footer, where it can be acted on. */
                { label: 'Refrence Url', value: (
                  <a href={u.referenceUrl} target="_blank" rel="noreferrer" className="break-all text-link hover:underline">{u.referenceUrl}</a>
                ) },
                { label: 'Tags', value: <Tags /> },
              ],
            },
            {
              title: 'Other Info',
              fields: [
                { label: 'UUID', value: <span className="break-all">{u.uuid}</span> },
                { label: 'Architecture', value: u.architecture },
                { label: 'Source', value: manual ? 'Manual Upload' : u.source },
                { label: 'Status', value: u.status },
                { label: manual ? 'Upload Status' : 'Download Status', value: awaiting
                  ? <Dot color="#F59E0B">{uploadState}</Dot> : uploadState },
                { label: manual ? 'Uploaded On' : 'Download On', value: file ? file.uploadedOn : <Dash /> },
                { label: 'Download Size', value: file ? file.size : <Dash /> },
                { label: 'Reboot Required', value: u.rebootRequired },
                { label: 'Support Uninstallation', value: 'No' },
                { label: 'Approved By', value: u.approval === 'Approved' ? 'Rakesh Rathod' : <Dash /> },
                { label: 'Approved On', value: u.approval === 'Approved' ? 'Mon, Sep 21, 2026 05:31 PM' : <Dash /> },
                { label: 'Patch Type', value: 'OS Upgrade' },
                { label: 'Created Date', value: 'Mon, Sep 21, 2026 05:24 PM' },
                { label: 'Last Updated Date', value: 'Thu, Sep 24, 2026 09:12 AM' },
                { label: 'Created By', value: 'System' },
                { label: 'Last Updated By', value: 'Rakesh Rathod' },
              ],
            },
          ]}
        />
      }
    >
      {tab === 'overview' && (
        <div className="scroll-y min-h-0 flex-1 px-6 py-6">
          <DescriptionCard title="Upgrade Details">{u.description}</DescriptionCard>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {/* Endpoints counts the two COMPATIBILITY states, not patch buckets —
                a machine is eligible for an operating system or ruled out of it. */}
            <DonutCard
              icon={Monitor} label="Endpoints" onOpen={() => setTab('endpoint')}
              slices={[
                { label: 'Compatible', value: c.compatible, color: '#22C55E' },
                { label: 'Incompatible', value: c.incompatible, color: '#EF4444' },
              ]}
            />
            {/* The one run carrying this image — PDR-2041, the Finance rollout. */}
            <DonutCard
              icon={Download} tone="violet" label="Deployments" onOpen={() => onOpenRun('PDR-2041')}
              slices={[
                { label: 'In Progress', value: 1, color: '#F59E0B' },
                { label: 'Success', value: 0, color: '#22C55E' },
                { label: 'Failed', value: 0, color: '#EF4444' },
              ]}
            />
            {/* No Affected Products card: the image IS the product, so the card
                could only ever restate the record's own title. */}
            <div className="rounded-lg border border-[#e5e7eb] bg-white p-4">
              <div className="mb-3 flex items-center gap-2.5">
                <IconTile icon={Files} />
                <h3 className="text-[13px] text-ink">Files</h3>
                <button onClick={() => setTab('files')} className="ml-auto text-[13px] font-medium text-link hover:underline">View more ›</button>
              </div>
              {file ? (
                <div className="flex items-center gap-2.5 rounded-md bg-[#F9FAFB] px-3 py-2.5">
                  <span className="flex size-7 flex-none items-center justify-center rounded bg-[#EBF5FF] text-link"><FileText size={14} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] text-value">{file.name}</span>
                    <span className="block text-[11.5px] text-label">{file.size} · Language: {file.language}</span>
                  </span>
                </div>
              ) : (
                <button onClick={() => setTab('files')}
                  className="flex w-full items-center gap-2 rounded-md border border-dashed border-warn/50 bg-warn-soft px-3 py-2.5 text-left hover:brightness-[0.98]">
                  <UploadCloud size={15} className="flex-none text-warn" />
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-medium text-warn">ISO upload required</span>
                    <span className="block text-[11.5px] text-label">{u.edition} images are not downloaded automatically</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'endpoint' && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-3 px-6 pb-3 pt-4">
            <BucketPills
              items={[
                { id: 'Compatible', label: 'Compatible', count: c.compatible },
                { id: 'Incompatible', label: 'Incompatible', count: c.incompatible },
              ]}
              active={bucket}
              onChange={setBucket}
            />
            <span className="h-5 w-px bg-[#E3E8EF]" />
            <SearchBar value={q} onChange={setQ} placeholder="Search endpoint, IP, reason..." />
            {/* Machines already on the target build are in neither bucket —
                counting them would overstate the outstanding work. */}
            {c.onBuild > 0 && (
              <span className="whitespace-nowrap text-[12px] text-label">{c.onBuild} already on this build</span>
            )}
            <button className="ml-auto flex h-8 flex-none items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-ink hover:bg-[#F5F7FA]">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
          <DataTable columns={cols} rows={rows} rowKey={(r) => r.endpoint.id} empty={`No ${bucket.toLowerCase()} endpoints found.`} />
          <Pagination total={rows.length} />
        </div>
      )}

      {tab === 'prereq' && (
        <div className="scroll-y min-h-0 flex-1 px-6 py-6">
          {/* One card: head with the rule count, a grey panel of the rules, and a
              footer tying them to the fleet they judge. */}
          <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <IconTile icon={ListChecks} />
              <h3 className="text-[15px] font-semibold text-ink">Prerequisites</h3>
              <span className="ml-auto text-[12px] text-label">
                {u.prereqs.filter((p) => p.value !== 'Not restricted').length} rules · all must pass
              </span>
            </div>
            <div className="rounded-lg bg-[#F9FAFB] p-5">
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
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-[12px] text-label">
                An endpoint must meet or exceed every value above before this upgrade is offered to it.
              </p>
              <span className="ml-auto text-[12px] text-label">
                Evaluated against <b className="font-semibold text-value">{c.compatible + c.incompatible}</b> endpoints ·{' '}
                <b className="font-semibold text-ok">{c.compatible} compatible</b>
              </span>
              <button onClick={() => setTab('endpoint')} className="text-[12px] font-medium text-link hover:underline">
                View endpoints ›
              </button>
            </div>
          </section>
        </div>
      )}

      {tab === 'files' && (
        <FileDetailsTab u={u} file={file} manual={manual} onUploaded={setFile} onRemove={() => setFile(null)} />
      )}

      {tab === 'installation' && <InstallationTab rows={installRowsFor(u)} />}

    </RecordPage>
  );
}
