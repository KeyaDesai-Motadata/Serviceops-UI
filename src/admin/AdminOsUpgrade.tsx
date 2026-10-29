import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Plus, Search, X, ExternalLink, CheckCircle2, Trash2, MonitorUp, Pause, Play, Square, RotateCcw, Upload,
} from 'lucide-react';
import { Pagination, IdPill } from '../ui/Table';
import { IsoPicker, ProgressBar, formatBytes, formatEta, validateIso } from './IsoUploader';
import {
  OS_FAMILIES, ARCHITECTURES, LANGUAGES, editionsFor, languageLabel,
  detectFromFileName, compare, type Declared,
} from './isoVerify';

/* Admin › Patch Management › OS Upgrade.
 *
 * ⚠️ There is NO pre-built catalogue. A list of Windows versions would have to be
 * synced every time Microsoft ships one, so the page starts EMPTY and holds only
 * the OS upgrades an admin has created.
 *
 * Create OS Upgrade collects the details and the chosen ISO, and closes. The
 * record is added AT ONCE and its ROW carries the upload, as the module's own
 * ISO upload does. Clicking a row opens the same form again, filled in, with
 * that row's live upload status.
 *
 * Upload Status uses the module's words — In Progress · Paused · Uploaded ·
 * Failed — plus ONE status for an ISO that arrived but does not match the
 * details entered: **Validation Failed**. The product has no mismatch status;
 * the nearest is DownloadStatus.CHECKSUM_FAILD ("Checksum Failed"), a separate
 * "<check> Failed" value beside plain FAILED, and this follows that pattern.
 * Checking the ISO after the transfer is still In Progress ("Validating the
 * ISO…"), not a status of its own, and Stop ends as Failed ("Upload stopped").
 */

/** `validating` is shown as In Progress — it is a phase, not a status. */
type Phase = 'uploading' | 'validating' | 'paused' | 'uploaded' | 'failed' | 'validation-failed';

interface AdminImage {
  id: string; name: string; declared: Declared;
  file: File; loaded: number; rate: number; phase: Phase;
  /** Why a row stopped short of Uploaded. */
  reason?: string;
  /** When a validating row gets its answer (the server mounts the WIM first). */
  verifyAt?: number;
  uploadedOn: string | null;
  /** Size to show when the File is only a stand-in (the two example records). */
  bytes?: number;
}

type UploadStatus = 'In Progress' | 'Paused' | 'Uploaded' | 'Failed' | 'Validation Failed';

const statusOf = (p: Phase): UploadStatus =>
  p === 'uploading' || p === 'validating' ? 'In Progress'
  : p === 'paused' ? 'Paused'
  : p === 'uploaded' ? 'Uploaded'
  : p === 'failed' ? 'Failed'
  : 'Validation Failed';

/* The module's own tones (UPLOAD_TONE in the new UI's OsUpgradeUpload.tsx). */
const TONE: Record<UploadStatus, { fg: string; bg: string }> = {
  'In Progress': { fg: '#3D8BD0', bg: '#EBF5FF' },
  'Paused': { fg: '#B45309', bg: '#FFFAEB' },
  'Uploaded': { fg: '#22A06B', bg: '#ECFDF3' },
  'Failed': { fg: '#DC2626', bg: '#FEF3F2' },
  'Validation Failed': { fg: '#DC2626', bg: '#FEF3F2' },
};

const nowStamp = () => {
  const d = new Date();
  const mon = d.toLocaleString('en-US', { month: 'short' });
  const t = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${String(d.getDate()).padStart(2, '0')} ${mon} ${d.getFullYear()}, ${t}`;
};

/* The demo files are tiny, so a transfer is scaled to take ~6 seconds whatever
   its size. A file named *fail* / *corrupt* drops at 62% — the only way to
   reach Failed from the UI. */
const startTransfer = (file: File) => ({
  file, loaded: 0, rate: Math.max(file.size / 6, 1), phase: 'uploading' as Phase,
  reason: undefined, uploadedOn: null, bytes: undefined,
});

/** Check the file again without re-sending it — when only the details changed. */
const revalidate = () => ({ phase: 'validating' as Phase, verifyAt: Date.now() + 1500, reason: undefined, uploadedOn: null });

/* Two example records so the list shows both outcomes: one ISO that matched,
   and one that arrived but failed validation. The failed one's reason is
   computed by the same check a real upload runs, so the two cannot disagree. */
const GB = 1024 ** 3;
const example = (id: string, name: string, declared: Declared, fileName: string, bytes: number, uploadedOn: string): AdminImage => {
  const file = new File([], fileName);
  const off = compare(declared, detectFromFileName(fileName)).filter((c) => !c.ok);
  return {
    id, name, declared, file, bytes, loaded: 0, rate: 1,
    phase: off.length ? 'validation-failed' : 'uploaded',
    reason: off.length ? `The ISO doesn't match — ${off.map((c) => `${c.label}: ISO has ${c.found}, entered ${c.declared}`).join(' · ')}` : undefined,
    uploadedOn: off.length ? null : uploadedOn,
  };
};
const EXAMPLES: AdminImage[] = [
  example('OSU-2', 'Windows 10 22H2 Education', { os: 'Windows 10', version: '22H2', edition: 'Education', arch: 'x64', language: 'en-US' },
    'Win10_22H2_EnglishInternational_x64.iso', 5.8 * GB, ''),
  example('OSU-1', 'Windows 11 24H2 Pro', { os: 'Windows 11', version: '24H2', edition: 'Pro', arch: 'x64', language: 'en-US' },
    'Win11_24H2_English_x64.iso', 5.4 * GB, '28 Oct 2026, 11:42 AM'),
];

/** The status cell — the same block in the row and in the reopened form. */
function StatusBlock({ r }: { r: AdminImage }) {
  const status = statusOf(r.phase);
  const pct = Math.min(100, (r.loaded / Math.max(r.file.size, 1)) * 100);
  const inTransfer = r.phase === 'uploading' || r.phase === 'paused';
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="inline-block whitespace-nowrap rounded-sm px-2 py-0.5 text-[12px] font-medium" style={{ color: TONE[status].fg, background: TONE[status].bg }} title={r.reason}>
          {status}
        </span>
        {inTransfer && <span className="text-[12px] font-semibold tabular-nums text-[#364658]">{Math.round(pct)}%</span>}
      </div>
      {inTransfer && (
        <div className="mt-1.5 w-[220px]">
          <ProgressBar pct={pct} tone={r.phase === 'paused' ? '#F59E0B' : '#3D8BD0'} />
          <div className="mt-1 text-[11.5px] text-[#7B8FA5]">
            {formatBytes(r.loaded)} of {formatBytes(r.file.size)} · {r.phase === 'paused' ? 'Paused' : formatEta((r.file.size - r.loaded) / r.rate)}
          </div>
        </div>
      )}
      {r.phase === 'validating' && (
        <div className="mt-1 text-[11.5px] text-[#7B8FA5]">Validating the ISO against the details entered…</div>
      )}
      {(r.phase === 'failed' || r.phase === 'validation-failed') && r.reason && (
        <div className="mt-1 max-w-[280px] whitespace-normal text-[11.5px] leading-[1.45] text-[#DC2626]">{r.reason}</div>
      )}
    </div>
  );
}

export function AdminOsUpgrade() {
  const [rows, setRows] = useState<AdminImage[]>(EXAMPLES);
  const [q, setQ] = useState('');
  /* 'new' = Create; an id = that record reopened in the same form. */
  const [form, setForm] = useState<'new' | string | null>(null);
  const [toast, setToast] = useState('');
  const replaceFor = useRef<string | null>(null);
  const replaceInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  /* ONE ticker drives every row that is moving. */
  const moving = rows.some((r) => r.phase === 'uploading' || r.phase === 'validating');
  useEffect(() => {
    if (!moving) return;
    const t = window.setInterval(() => {
      const done: string[] = [];
      setRows((rs) => rs.map((r) => {
        if (r.phase === 'uploading') {
          const loaded = Math.min(r.file.size, r.loaded + r.rate * 0.2);
          if (/fail|corrupt/i.test(r.file.name) && loaded / r.file.size >= 0.62) {
            return { ...r, loaded, phase: 'failed', reason: 'The transfer to the Windows File Server was interrupted. Check the server is reachable, then retry.' };
          }
          return loaded >= r.file.size ? { ...r, loaded, ...revalidate() } : { ...r, loaded };
        }
        if (r.phase === 'validating' && Date.now() >= (r.verifyAt ?? 0)) {
          const found = detectFromFileName(r.file.name);
          const off = compare(r.declared, found).filter((c) => !c.ok);
          if (off.length) {
            return { ...r, phase: 'validation-failed', reason: `The ISO doesn't match — ${off.map((c) => `${c.label}: ISO has ${c.found}, entered ${c.declared}`).join(' · ')}` };
          }
          done.push(r.id);
          return { ...r, phase: 'uploaded', uploadedOn: nowStamp() };
        }
        return r;
      }));
      if (done.length) setToast(`${done.join(', ')} uploaded — ready to deploy`);
    }, 200);
    return () => window.clearInterval(t);
  }, [moving]);

  const patch = (id: string, p: Partial<AdminImage>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const stop = (id: string) => patch(id, { phase: 'failed', reason: 'Upload stopped.' });
  const remove = (id: string) => { setRows((rs) => rs.filter((x) => x.id !== id)); setToast(`${id} deleted`); };

  const query = q.trim().toLowerCase();
  const visible = rows.filter((r) =>
    !query || r.id.toLowerCase().includes(query) || r.name.toLowerCase().includes(query) || r.file.name.toLowerCase().includes(query));
  const nextId = `OSU-${rows.length ? Math.max(...rows.map((r) => Number(r.id.split('-')[1]) || 0)) + 1 : 1}`;
  const editing = form && form !== 'new' ? rows.find((r) => r.id === form) ?? null : null;

  const cta = (
    <button onClick={() => setForm('new')} className="flex h-9 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0]">
      <Plus size={15} /> Create OS Upgrade
    </button>
  );

  const th = 'whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]';
  const td = 'whitespace-nowrap px-4 py-3 align-top text-[13px] text-[#364658]';
  const iconBtn = 'flex size-8 items-center justify-center rounded text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#3D8BD0]';

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex-none px-4 pt-5">
        <h1 className="text-[16px] font-semibold text-[#364658]">OS Upgrade</h1>
        <p className="mt-1 text-[13px] text-[#64748B]">
          Upload the ISO file for upgrading the OS of the computers.{' '}
          <button className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline">
            View Docs <ExternalLink size={12} />
          </button>
        </p>
      </div>

      {/* Re-upload for a row that failed its transfer or its validation. */}
      <input
        ref={replaceInput} type="file" accept=".iso" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]; e.target.value = '';
          const id = replaceFor.current; if (!f || !id) return;
          const problem = validateIso(f);
          if (problem) { setToast(problem); return; }
          patch(id, startTransfer(f));
        }}
      />

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-[#EBF5FF] text-[#3D8BD0]"><MonitorUp size={26} /></span>
          <h2 className="mt-4 text-[15px] font-semibold text-[#364658]">No OS upgrades yet</h2>
          <p className="mt-1 max-w-[440px] text-[13px] leading-[1.55] text-[#64748B]">
            Create an OS upgrade by uploading its Windows ISO. The ISO is validated against the
            version, edition, architecture and language you enter.
          </p>
          <div className="mt-5">{cta}</div>
        </div>
      ) : (
        <>
          <div className="flex flex-none items-center gap-3 px-4 py-4">
            <div className="relative w-[280px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search"
                className="h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
            </div>
            <div className="ml-auto">{cta}</div>
          </div>

          <div className="scroll-y min-h-0 flex-1 px-4">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-[#e5e7eb]">
                  {['ID', 'Name', 'Language', 'Size', 'Upload Status', 'Upload Time', 'Action'].map((h) => (
                    <th key={h} className={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb] bg-white">
                {visible.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-14 text-center text-[13px] text-[#7B8FA5]">No OS upgrades match that search.</td></tr>
                ) : visible.map((r) => {
                  const inTransfer = r.phase === 'uploading' || r.phase === 'paused';
                  const broken = r.phase === 'failed' || r.phase === 'validation-failed';
                  return (
                    /* The whole row reopens the record's form. */
                    <tr key={r.id} onClick={() => setForm(r.id)} className="cursor-pointer hover:bg-[#f9fafb]">
                      <td className={td}><IdPill>{r.id}</IdPill></td>
                      <td className={td}>
                        <div className="font-medium">{r.name}</div>
                        <div className="mt-0.5 text-[12px] text-[#7B8FA5]">
                          {r.declared.os} · {r.declared.version} · {r.declared.edition} · {r.declared.arch}
                        </div>
                        <div className="mt-0.5 max-w-[320px] truncate text-[12px] text-[#9CA3AF]" title={r.file.name}>{r.file.name}</div>
                      </td>
                      <td className={td}>{languageLabel(r.declared.language)}</td>
                      <td className={td}>{formatBytes(r.bytes ?? r.file.size)}</td>
                      <td className={`${td} w-[280px]`}><StatusBlock r={r} /></td>
                      <td className={td}>{r.uploadedOn ?? <span className="text-[#9ca3af]">---</span>}</td>
                      <td className={td} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center">
                          {r.phase === 'uploading' && <button onClick={() => patch(r.id, { phase: 'paused' })} title="Pause upload" className={iconBtn}><Pause size={15} /></button>}
                          {r.phase === 'paused' && <button onClick={() => patch(r.id, { phase: 'uploading' })} title="Resume upload" className={iconBtn}><Play size={15} /></button>}
                          {inTransfer && <button onClick={() => stop(r.id)} title="Stop upload" className={`${iconBtn} hover:!text-[#DC2626]`}><Square size={14} /></button>}
                          {r.phase === 'failed' && <button onClick={() => patch(r.id, startTransfer(r.file))} title="Retry upload" className={iconBtn}><RotateCcw size={15} /></button>}
                          {broken && (
                            <button onClick={() => { replaceFor.current = r.id; replaceInput.current?.click(); }} title="Upload another ISO" className={iconBtn}><Upload size={15} /></button>
                          )}
                          {!inTransfer && r.phase !== 'validating' && (
                            <button onClick={() => remove(r.id)} title="Delete OS upgrade and its ISO"
                              className="flex size-8 items-center justify-center rounded text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#DC2626]">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination total={visible.length} />
        </>
      )}

      {form && (form === 'new' || editing) && (
        <OsUpgradeForm
          key={form}
          id={editing ? editing.id : nextId}
          record={editing}
          onClose={() => setForm(null)}
          onPause={(id) => patch(id, { phase: 'paused' })}
          onResume={(id) => patch(id, { phase: 'uploading' })}
          onStop={stop}
          onSave={(id, name, declared, file) => {
            if (!editing) {
              setRows((rs) => [{ id, name, declared, ...startTransfer(file) }, ...rs]);
              setToast(`${id} created — uploading the ISO to the Windows File Server`);
            } else {
              const fileChanged = file !== editing.file;
              const detailsChanged = JSON.stringify(declared) !== JSON.stringify(editing.declared);
              /* A new file goes up again; new details on the same file are checked again —
                 unless that file has not finished arriving, when the check simply follows. */
              const busy = editing.phase === 'uploading' || editing.phase === 'paused';
              patch(id, {
                name, declared,
                ...(fileChanged ? startTransfer(file) : detailsChanged && !busy ? revalidate() : {}),
              });
              setToast(fileChanged ? `${id} updated — uploading the new ISO` : detailsChanged && !busy ? `${id} updated — validating the ISO again` : `${id} updated`);
            }
            setForm(null);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[10001] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-[#364658] px-4 py-2.5 text-[13px] text-white shadow-lg">
          <CheckCircle2 size={15} className="text-[#4ADE80]" /> {toast}
        </div>
      )}
    </div>
  );
}

// ── Create / Edit OS Upgrade ──────────────────────────────────────────────

const fieldCls = 'h-9 w-full rounded border border-[#DFE5ED] bg-white px-2.5 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';

const Label = ({ children, required, hint }: { children: ReactNode; required?: boolean; hint?: string }) => (
  <label className="mb-1.5 flex items-baseline gap-1 text-[13px] text-[#364658]">
    {children}{required && <span className="text-[#DC2626]">*</span>}
    {hint && <span className="ml-auto text-[11.5px] text-[#9CA3AF]">{hint}</span>}
  </label>
);

const Section = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section className="border-b border-[#F0F2F5] px-6 py-5 last:border-0">
    <h3 className="text-[14px] font-semibold text-[#364658]">{title}</h3>
    {hint && <p className="mt-0.5 text-[12.5px] text-[#7B8FA5]">{hint}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

const btnSecondary = 'inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] hover:bg-[#F5F7FA]';

function OsUpgradeForm({ id, record, onClose, onSave, onPause, onResume, onStop }: {
  id: string;
  /** Set when a listed record is reopened; null for Create. Live — it updates as the row does. */
  record: AdminImage | null;
  onClose: () => void;
  onSave: (id: string, name: string, declared: Declared, file: File) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onStop: (id: string) => void;
}) {
  const [name, setName] = useState(record?.name ?? '');
  const [d, setD] = useState<Declared>(record?.declared ?? { os: 'Windows 11', version: '', edition: 'Pro', arch: 'x64', language: 'en-US' });
  const [file, setFile] = useState<File | null>(record?.file ?? null);

  const set = <K extends keyof Declared>(k: K, v: Declared[K]) => setD((x) => ({ ...x, [k]: v }));

  /* Changing OS between client and server swaps the edition list. */
  useEffect(() => {
    if (!editionsFor(d.os).includes(d.edition)) set('edition', editionsFor(d.os)[0]);
  }, [d.os]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const missing = [!name.trim() && 'Name', !d.version.trim() && 'Version', !file && 'ISO file'].filter(Boolean) as string[];
  /* While the record's own file is still travelling, it can't be swapped. */
  const transferring = !!record && (record.phase === 'uploading' || record.phase === 'paused');
  const keepsFile = !!record && file === record.file;

  return (
    <>
      <div className="fixed inset-0 z-[9998] bg-[#0F172A]/30" onClick={onClose} />
      <aside className="fixed bottom-0 right-0 top-0 z-[9999] flex w-[720px] max-w-full flex-col bg-white shadow-2xl">
        <header className="flex flex-none items-center gap-3 border-b border-[#e5e7eb] px-6 py-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold text-[#364658]">
              {record ? <><IdPill>{record.id}</IdPill><span className="truncate">{record.name}</span></> : 'Create OS Upgrade'}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[#7B8FA5]">
              {record ? 'Edit the details or replace the ISO.' : 'Enter the Windows image details and choose its ISO.'}
            </p>
          </div>
          <button onClick={onClose} title="Close" className="ml-auto flex size-8 flex-none items-center justify-center rounded text-[#64748B] hover:bg-[#F5F7FA]"><X size={18} /></button>
        </header>

        <div className="scroll-y min-h-0 flex-1">
          <Section title="Windows Image" hint="The ISO you upload is validated against these details.">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <div className="col-span-2">
                <Label required>Name</Label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Windows 11 24H2 Pro — Finance" className={fieldCls} />
              </div>
              <div>
                <Label required>Operating System</Label>
                <select value={d.os} onChange={(e) => set('os', e.target.value)} className={fieldCls}>
                  {OS_FAMILIES.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <Label required hint="e.g. 24H2, 22H2">Version</Label>
                <input value={d.version} onChange={(e) => set('version', e.target.value)} placeholder="24H2" className={fieldCls} />
              </div>
              <div>
                <Label required>Edition</Label>
                <select value={d.edition} onChange={(e) => set('edition', e.target.value)} className={fieldCls}>
                  {editionsFor(d.os).map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <Label required>Architecture</Label>
                <select value={d.arch} onChange={(e) => set('arch', e.target.value)} className={fieldCls}>
                  {ARCHITECTURES.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <Label required>Language</Label>
                <select value={d.language} onChange={(e) => set('language', e.target.value)} className={fieldCls}>
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label} · {l.code}</option>)}
                </select>
              </div>
            </div>
          </Section>

          <Section title="ISO File">
            {/* A reopened record shows its upload live, with the row's controls. */}
            {record && keepsFile && (
              <div className="mb-4 rounded border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-3">
                <div className="mb-2 text-[12px] text-[#7B8FA5]">Upload Status</div>
                <StatusBlock r={record} />
                {transferring && (
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => (record.phase === 'paused' ? onResume(record.id) : onPause(record.id))} className={btnSecondary}>
                      {record.phase === 'paused' ? <><Play size={14} /> Resume</> : <><Pause size={14} /> Pause</>}
                    </button>
                    <button onClick={() => onStop(record.id)} className="inline-flex h-8 items-center gap-1.5 rounded border border-[#FEE4E2] bg-white px-3 text-[13px] font-medium text-[#DC2626] hover:bg-[#FEF3F2]">
                      <Square size={13} /> Stop
                    </button>
                  </div>
                )}
              </div>
            )}
            {transferring && keepsFile ? (
              <p className="text-[12.5px] text-[#7B8FA5]">The ISO can be replaced once this upload stops or finishes.</p>
            ) : (
              <IsoPicker
                value={file}
                onChange={setFile}
                size={record && keepsFile && record.bytes ? formatBytes(record.bytes) : undefined}
                note={!record ? undefined : keepsFile ? null : 'The new ISO uploads when you click Update, and the record is validated again.'}
              />
            )}
          </Section>
        </div>

        <footer className="flex flex-none items-center gap-2 border-t border-[#e5e7eb] px-6 py-3">
          {missing.length > 0 && <span className="text-[12px] text-[#7B8FA5]">Required: {missing.join(' · ')}</span>}
          <button onClick={onClose} className="ml-auto h-9 rounded border border-[#DFE5ED] px-4 text-[13px] font-medium text-[#364658] hover:bg-[#F5F7FA]">Cancel</button>
          <button
            disabled={missing.length > 0}
            onClick={() => file && onSave(id, name.trim(), { ...d, version: d.version.trim().toUpperCase() }, file)}
            className="h-9 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white enabled:hover:bg-[#2d6ca0] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {record ? 'Update' : 'Create'}
          </button>
        </footer>
      </aside>
    </>
  );
}
