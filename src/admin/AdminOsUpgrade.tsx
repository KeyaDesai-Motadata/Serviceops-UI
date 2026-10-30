import { useEffect, useState, type ReactNode } from 'react';
import {
  Plus, Search, X, ExternalLink, CheckCircle2, Trash2, MonitorUp, Pause, Play, Square, RotateCcw, AlertCircle, Loader2,
} from 'lucide-react';
import { Pagination, IdPill } from '../ui/Table';
import { IsoPicker, ProgressBar, formatBytes, formatEta } from './IsoUploader';
import {
  OS_FAMILIES, ARCHITECTURES, LANGUAGES, editionsFor, languageLabel,
  detectFromFileName, compare, type Declared, type Detected,
} from './isoVerify';

/* Admin › Patch Management › OS Upgrade.
 *
 * ⚠️ There is NO pre-built catalogue. A list of Windows versions would have to be
 * synced every time Microsoft ships one, so the page holds only the OS upgrades
 * an admin has created.
 *
 * The ISO uploads and is validated INSIDE the form (30 Oct 2026). Choosing a file
 * starts the upload there; once it arrives the ISO is read and checked against
 * the details entered. A mismatch is a validation error on the form — the
 * fields that disagree are marked — and Create / Update stays disabled until
 * the details or the ISO are fixed. So every listed record has a valid ISO, and
 * the list carries no Upload Status. */

interface AdminImage {
  id: string; name: string; declared: Declared;
  file: File;
  /** Size to show when the File is only a stand-in (the example records). */
  bytes?: number;
  uploadedOn: string;
}

const nowStamp = () => {
  const d = new Date();
  const mon = d.toLocaleString('en-US', { month: 'short' });
  const t = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${String(d.getDate()).padStart(2, '0')} ${mon} ${d.getFullYear()}, ${t}`;
};

const GB = 1024 ** 3;
/* Two example records, both valid — an invalid ISO can no longer be saved. */
const EXAMPLES: AdminImage[] = [
  { id: 'OSU-2', name: 'Windows 10 22H2 Education', declared: { os: 'Windows 10', version: '22H2', edition: 'Education', arch: 'x64', language: 'en-GB' },
    file: new File([], 'Win10_22H2_EnglishInternational_x64.iso'), bytes: 5.8 * GB, uploadedOn: '27 Oct 2026, 04:15 PM' },
  { id: 'OSU-1', name: 'Windows 11 24H2 Pro', declared: { os: 'Windows 11', version: '24H2', edition: 'Pro', arch: 'x64', language: 'en-US' },
    file: new File([], 'Win11_24H2_English_x64.iso'), bytes: 5.4 * GB, uploadedOn: '28 Oct 2026, 11:42 AM' },
];

export function AdminOsUpgrade() {
  const [rows, setRows] = useState<AdminImage[]>(EXAMPLES);
  const [q, setQ] = useState('');
  /* 'new' = Create; an id = that record reopened in the same form. */
  const [form, setForm] = useState<'new' | string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

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
                  {['ID', 'Name', 'Language', 'Size', 'Upload Time', 'Action'].map((h) => (
                    <th key={h} className={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb] bg-white">
                {visible.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-14 text-center text-[13px] text-[#7B8FA5]">No OS upgrades match that search.</td></tr>
                ) : visible.map((r) => (
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
                    <td className={td}>{r.uploadedOn}</td>
                    <td className={td} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => remove(r.id)} title="Delete OS upgrade and its ISO"
                        className="flex size-8 items-center justify-center rounded text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#DC2626]">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
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
          onSave={(rec) => {
            setRows((rs) => (editing ? rs.map((r) => (r.id === rec.id ? rec : r)) : [rec, ...rs]));
            setToast(editing ? `${rec.id} updated` : `${rec.id} created`);
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

const fieldCls = 'h-9 w-full rounded border bg-white px-2.5 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1';
const okField = `${fieldCls} border-[#DFE5ED] focus:border-[#3D8BD0] focus:ring-[#3D8BD0]`;
const badField = `${fieldCls} border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]`;

const Label = ({ children, required, hint }: { children: ReactNode; required?: boolean; hint?: string }) => (
  <label className="mb-1.5 flex items-baseline gap-1 text-[13px] text-[#364658]">
    {children}{required && <span className="text-[#DC2626]">*</span>}
    {hint && <span className="ml-auto text-[11.5px] text-[#9CA3AF]">{hint}</span>}
  </label>
);

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="mt-1 text-[12px] text-[#DC2626]">{msg}</p> : null;

const Section = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section className="border-b border-[#F0F2F5] px-6 py-5 last:border-0">
    <h3 className="text-[14px] font-semibold text-[#364658]">{title}</h3>
    {hint && <p className="mt-0.5 text-[12.5px] text-[#7B8FA5]">{hint}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

const btnSecondary = 'inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] hover:bg-[#F5F7FA]';

/** The upload of the chosen ISO, run in the form. `ready` = arrived and read. */
type Upload =
  | { phase: 'uploading' | 'paused'; loaded: number; rate: number }
  | { phase: 'reading'; readyAt: number }
  | { phase: 'ready'; found: Detected }
  | { phase: 'failed'; reason: string };

/* The demo files are tiny, so a transfer is scaled to take ~6 seconds whatever
   its size. A file named *fail* / *corrupt* drops at 62%. */
const beginUpload = (f: File): Upload => ({ phase: 'uploading', loaded: 0, rate: Math.max(f.size / 6, 1) });

/** Field key → the label the ISO check reports it under. */
const CHECK_LABEL: Record<keyof Declared, string> = {
  os: 'Operating System', version: 'Version', edition: 'Edition', arch: 'Architecture', language: 'Language',
};

function OsUpgradeForm({ id, record, onClose, onSave }: {
  id: string;
  /** Set when a listed record is reopened; null for Create. */
  record: AdminImage | null;
  onClose: () => void;
  onSave: (rec: AdminImage) => void;
}) {
  const [name, setName] = useState(record?.name ?? '');
  const [d, setD] = useState<Declared>(record?.declared ?? { os: 'Windows 11', version: '', edition: 'Pro', arch: 'x64', language: 'en-US' });
  const [file, setFile] = useState<File | null>(record?.file ?? null);
  /* A reopened record's ISO is already on the server and already read. */
  const [up, setUp] = useState<Upload | null>(record ? { phase: 'ready', found: detectFromFileName(record.file.name) } : null);

  const set = <K extends keyof Declared>(k: K, v: Declared[K]) => setD((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    if (!editionsFor(d.os).includes(d.edition)) set('edition', editionsFor(d.os)[0]);
  }, [d.os]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* Drives the upload, then the read of the ISO (the server mounts the WIM). */
  const moving = up?.phase === 'uploading' || up?.phase === 'reading';
  useEffect(() => {
    if (!moving || !file) return;
    const t = window.setInterval(() => {
      setUp((u) => {
        if (!u) return u;
        if (u.phase === 'uploading') {
          const loaded = Math.min(file.size, u.loaded + u.rate * 0.2);
          if (/fail|corrupt/i.test(file.name) && loaded / Math.max(file.size, 1) >= 0.62) {
            return { phase: 'failed', reason: 'The upload to the Windows File Server was interrupted. Check the server is reachable, then retry.' };
          }
          return loaded >= file.size ? { phase: 'reading', readyAt: Date.now() + 1500 } : { ...u, loaded };
        }
        if (u.phase === 'reading' && Date.now() >= u.readyAt) return { phase: 'ready', found: detectFromFileName(file.name) };
        return u;
      });
    }, 200);
    return () => window.clearInterval(t);
  }, [moving, file]);

  const pick = (f: File | null) => { setFile(f); setUp(f ? beginUpload(f) : null); };

  /* The ISO's details are read once; the comparison follows every edit, so
     fixing a field clears its error straight away. */
  const checks = up?.phase === 'ready' ? compare({ ...d, version: d.version.trim().toUpperCase() }, up.found) : [];
  const mismatches = checks.filter((c) => !c.ok && !(c.label === 'Version' && !d.version.trim()));
  const errorFor = (k: keyof Declared) => {
    const c = mismatches.find((m) => m.label === CHECK_LABEL[k]);
    return c ? `The ISO has ${c.found}` : undefined;
  };

  const missing = [!name.trim() && 'Name', !d.version.trim() && 'Version', !file && 'ISO file'].filter(Boolean) as string[];
  const blocker =
    missing.length ? `Required: ${missing.join(' · ')}`
    : up?.phase === 'uploading' || up?.phase === 'paused' ? 'Wait for the ISO to finish uploading.'
    : up?.phase === 'reading' ? 'Validating the ISO…'
    : up?.phase === 'failed' ? 'The ISO upload failed.'
    : mismatches.length ? 'Fix the validation errors to continue.'
    : '';

  const save = () => {
    if (blocker || !file) return;
    onSave({
      id, name: name.trim(), declared: { ...d, version: d.version.trim().toUpperCase() }, file,
      bytes: record && file === record.file ? record.bytes : undefined,
      uploadedOn: record && file === record.file ? record.uploadedOn : nowStamp(),
    });
  };

  const pct = up?.phase === 'uploading' || up?.phase === 'paused' ? Math.min(100, (up.loaded / Math.max(file?.size ?? 1, 1)) * 100) : 0;

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
              {record ? 'Edit the details or replace the ISO.' : 'Enter the Windows image details and upload its ISO.'}
            </p>
          </div>
          <button onClick={onClose} title="Close" className="ml-auto flex size-8 flex-none items-center justify-center rounded text-[#64748B] hover:bg-[#F5F7FA]"><X size={18} /></button>
        </header>

        <div className="scroll-y min-h-0 flex-1">
          <Section title="Windows Image" hint="The ISO you upload is validated against these details.">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <div className="col-span-2">
                <Label required>Name</Label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Windows 11 24H2 Pro — Finance" className={okField} />
              </div>
              <div>
                <Label required>Operating System</Label>
                <select value={d.os} onChange={(e) => set('os', e.target.value)} className={errorFor('os') ? badField : okField}>
                  {OS_FAMILIES.map((f) => <option key={f}>{f}</option>)}
                </select>
                <FieldError msg={errorFor('os')} />
              </div>
              <div>
                <Label required hint="e.g. 24H2, 22H2">Version</Label>
                <input value={d.version} onChange={(e) => set('version', e.target.value)} placeholder="24H2" className={errorFor('version') ? badField : okField} />
                <FieldError msg={errorFor('version')} />
              </div>
              <div>
                <Label required>Edition</Label>
                <select value={d.edition} onChange={(e) => set('edition', e.target.value)} className={errorFor('edition') ? badField : okField}>
                  {editionsFor(d.os).map((f) => <option key={f}>{f}</option>)}
                </select>
                <FieldError msg={errorFor('edition')} />
              </div>
              <div>
                <Label required>Architecture</Label>
                <select value={d.arch} onChange={(e) => set('arch', e.target.value)} className={errorFor('arch') ? badField : okField}>
                  {ARCHITECTURES.map((f) => <option key={f}>{f}</option>)}
                </select>
                <FieldError msg={errorFor('arch')} />
              </div>
              <div>
                <Label required>Language</Label>
                <select value={d.language} onChange={(e) => set('language', e.target.value)} className={errorFor('language') ? badField : okField}>
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label} · {l.code}</option>)}
                </select>
                <FieldError msg={errorFor('language')} />
              </div>
            </div>
          </Section>

          <Section title="ISO File">
            <IsoPicker
              value={file}
              onChange={pick}
              size={record && file === record.file && record.bytes ? formatBytes(record.bytes) : undefined}
              note={null}
            />

            {/* The upload runs here, in the form. */}
            {file && up && (up.phase === 'uploading' || up.phase === 'paused') && (
              <div className="mt-3 rounded border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#7B8FA5]">
                    {formatBytes(up.loaded)} of {formatBytes(file.size)} · {up.phase === 'paused' ? 'Paused' : formatEta((file.size - up.loaded) / up.rate)}
                  </span>
                  <span className="font-semibold tabular-nums text-[#364658]">{Math.round(pct)}%</span>
                </div>
                <div className="mt-1.5"><ProgressBar pct={pct} tone={up.phase === 'paused' ? '#F59E0B' : '#3D8BD0'} /></div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => setUp({ ...up, phase: up.phase === 'paused' ? 'uploading' : 'paused' })} className={btnSecondary}>
                    {up.phase === 'paused' ? <><Play size={14} /> Resume</> : <><Pause size={14} /> Pause</>}
                  </button>
                  <button onClick={() => pick(null)} className="inline-flex h-8 items-center gap-1.5 rounded border border-[#FEE4E2] bg-white px-3 text-[13px] font-medium text-[#DC2626] hover:bg-[#FEF3F2]">
                    <Square size={13} /> Stop
                  </button>
                </div>
              </div>
            )}

            {up?.phase === 'reading' && (
              <div className="mt-3 flex items-center gap-2 rounded border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-3 text-[12.5px] text-[#364658]">
                <Loader2 size={15} className="animate-spin text-[#3D8BD0]" /> Validating the ISO against the details entered…
              </div>
            )}

            {up?.phase === 'failed' && file && (
              <div className="mt-3 flex items-start gap-2 rounded border border-[#FEE4E2] bg-[#FFFBFA] px-3.5 py-3 text-[12.5px] text-[#DC2626]">
                <AlertCircle size={15} className="mt-px flex-none" />
                <div className="flex-1">{up.reason}</div>
                <button onClick={() => setUp(beginUpload(file))} className={btnSecondary}><RotateCcw size={14} /> Retry</button>
              </div>
            )}

            {/* Validation error: what disagrees, and how to fix it. */}
            {up?.phase === 'ready' && mismatches.length > 0 && (
              <div className="mt-3 rounded border border-[#FEE4E2] bg-[#FFFBFA] px-3.5 py-3">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-[#DC2626]">
                  <AlertCircle size={15} /> Validation failed — the ISO doesn't match the details entered
                </div>
                <ul className="mt-2 space-y-1 text-[12.5px] text-[#364658]">
                  {mismatches.map((m) => (
                    <li key={m.label}><span className="font-medium">{m.label}:</span> entered {m.declared}, the ISO has <span className="font-medium text-[#DC2626]">{m.found}</span></li>
                  ))}
                </ul>
                <p className="mt-2 text-[12px] text-[#7B8FA5]">Correct the details above, or remove this file and upload the right ISO.</p>
              </div>
            )}

            {up?.phase === 'ready' && mismatches.length === 0 && d.version.trim() && (
              <div className="mt-3 flex items-center gap-2 rounded border border-[#D1FADF] bg-[#F6FEF9] px-3.5 py-3 text-[12.5px] text-[#22A06B]">
                <CheckCircle2 size={15} /> ISO validated — it matches the details entered{up.found.build ? ` (build ${up.found.build})` : ''}.
              </div>
            )}
          </Section>
        </div>

        <footer className="flex flex-none items-center gap-2 border-t border-[#e5e7eb] px-6 py-3">
          {blocker && <span className={`text-[12px] ${mismatches.length || up?.phase === 'failed' ? 'text-[#DC2626]' : 'text-[#7B8FA5]'}`}>{blocker}</span>}
          <button onClick={onClose} className="ml-auto h-9 rounded border border-[#DFE5ED] px-4 text-[13px] font-medium text-[#364658] hover:bg-[#F5F7FA]">Cancel</button>
          <button
            disabled={!!blocker}
            onClick={save}
            className="h-9 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white enabled:hover:bg-[#2d6ca0] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {record ? 'Update' : 'Create'}
          </button>
        </footer>
      </aside>
    </>
  );
}
