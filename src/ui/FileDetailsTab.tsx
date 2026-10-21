import { useRef, useState, type DragEvent } from 'react';
import { Copy, Download, Upload, Trash2, UploadCloud, Info, CheckCircle2, ExternalLink } from 'lucide-react';
import { DataTable, type Column } from './Table';
import type { OsUpgrade } from '../data/osUpgrade';

/* The File Details tab — the patch page's grid, plus the manual-upload path an
 * Enterprise image needs.
 *
 * Three states, one place:
 *   catalogue image   → the grid, as on a patch.
 *   awaiting upload   → why it is needed, and a drop zone.
 *   uploading         → progress, then verification against the record.
 * Once uploaded the grid returns, with Replace and Remove on the row. */

export interface ImageFile {
  name: string; size: string; language: string;
  source: 'Vendor Catalog' | 'Manual Upload';
  uploadedBy: string; uploadedOn: string;
}

const fmtSize = (bytes: number) =>
  bytes >= 1e9 ? `${(bytes / 1e9).toFixed(2)} GB` : bytes >= 1e6 ? `${(bytes / 1e6).toFixed(2)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`;

export function FileDetailsTab({ u, file, manual, onUploaded, onRemove }: {
  u: OsUpgrade;
  file: ImageFile | null;
  /** Enterprise: the image is never downloaded by the product, only uploaded. */
  manual: boolean;
  onUploaded: (f: ImageFile) => void;
  onRemove: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<{ name: string; pct: number; size: string } | null>(null);
  const [error, setError] = useState('');
  /* The verified line is the upload's receipt, so it shows once, after an
     upload here — not on every visit to an image uploaded long ago. */
  const [justUploaded, setJustUploaded] = useState(false);

  const start = (f: File | undefined) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.iso')) { setError(`"${f.name}" is not an ISO image. Upload the .iso file for this edition.`); return; }
    setError('');
    const size = fmtSize(f.size);
    setProgress({ name: f.name, pct: 0, size });
    /* Simulated transfer; the last 10% stands for verification on the server. */
    const t = setInterval(() => setProgress((p) => {
      if (!p) { clearInterval(t); return p; }
      if (p.pct >= 100) {
        clearInterval(t);
        setJustUploaded(true);
        onUploaded({
          name: p.name, size: p.size, language: u.language, source: 'Manual Upload',
          uploadedBy: 'Rakesh Rathod', uploadedOn: 'Wed, Oct 21, 2026 11:40 AM',
        });
        return null;
      }
      return { ...p, pct: Math.min(100, p.pct + 7) };
    }), 160);
  };

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); start(e.dataTransfer.files[0]); };

  const picker = (
    <input ref={input} type="file" accept=".iso" className="hidden"
      onChange={(e) => { start(e.target.files?.[0]); e.target.value = ''; }} />
  );

  const cols: Column<ImageFile>[] = [
    { key: 'sr', header: 'Sr.No', width: 70, cell: () => 1 },
    { key: 'name', header: 'File Name', cell: (f) => f.name },
    { key: 'size', header: 'Size', cell: (f) => f.size },
    { key: 'lang', header: 'Language', cell: (f) => f.language },
    { key: 'src', header: 'Source', cell: (f) => f.source },
    { key: 'by', header: 'Uploaded By', cell: (f) => f.uploadedBy },
    { key: 'on', header: 'Uploaded On', cell: (f) => f.uploadedOn },
    { key: 'actions', header: 'Actions', width: 110, cell: (f) => (
      <span className="flex items-center gap-2.5 text-label">
        <button title="Copy file name" onClick={() => navigator.clipboard?.writeText(f.name)} className="hover:text-ink"><Copy size={15} /></button>
        <button title="Download" className="hover:text-ink"><Download size={15} /></button>
        {manual && (
          <>
            <button title="Replace ISO" onClick={() => input.current?.click()} className="hover:text-ink"><Upload size={15} /></button>
            <button title="Remove ISO" onClick={onRemove} className="hover:text-risk"><Trash2 size={15} /></button>
          </>
        )}
      </span>
    ) },
  ];

  // ── uploaded, or a catalogue image: the grid ──────────────────────────────
  if (file && !progress) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {picker}
        {justUploaded && (
          <div className="mx-5 mt-3 flex items-center gap-2 rounded-md bg-ok-soft px-3 py-2 text-[12.5px] text-ok">
            <CheckCircle2 size={15} className="flex-none" />
            Image verified — edition ({u.edition}), build ({u.build}), architecture and language match this record. It can now be deployed.
          </div>
        )}
        <DataTable columns={cols} rows={[file]} rowKey={(f) => f.name} selectable={false} empty="No files found." />
      </div>
    );
  }

  // ── awaiting upload / uploading ───────────────────────────────────────────
  return (
    <div className="scroll-y min-h-0 flex-1 px-5 py-4">
      {picker}

      {/* Why: said once, plainly, with where to get the file. */}
      <div className="flex items-start gap-2.5 rounded-lg border border-warn/30 bg-warn-soft px-4 py-3">
        <Info size={16} className="mt-0.5 flex-none text-warn" />
        <div className="min-w-0 text-[12.5px] leading-relaxed text-value">
          <div className="font-semibold text-warn">Manual upload required</div>
          {u.edition} images are volume-licensed and are not published to the vendor catalogue, so this
          ISO cannot be downloaded automatically. Download it from your organisation's licensing portal and
          upload it here. Until then this upgrade cannot be added to a deployment.
          <a href="https://admin.microsoft.com" target="_blank" rel="noreferrer"
            className="ml-1 inline-flex items-center gap-1 font-medium text-link hover:underline">
            Microsoft 365 admin center <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <div className="mt-4">
        {progress ? (
          <div className="flex flex-col justify-center rounded-lg border border-line px-6 py-8">
            <div className="flex items-center gap-2 text-[13px] text-value">
              <UploadCloud size={16} className="flex-none text-link" />
              <span className="truncate font-medium">{progress.name}</span>
              <span className="ml-auto flex-none text-[12px] text-label">{progress.size}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-strip">
              <div className="h-full rounded-full bg-link transition-all" style={{ width: `${progress.pct}%` }} />
            </div>
            <div className="mt-2 text-[12px] text-label">
              {progress.pct < 90 ? `Uploading… ${progress.pct}%` : 'Verifying edition, build, architecture and language…'}
            </div>
          </div>
        ) : (
          <button
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={`flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
              drag ? 'border-link bg-[#EFF4FF]' : 'border-line hover:border-link hover:bg-strip'
            }`}
          >
            <UploadCloud size={30} className="text-label" />
            <div className="mt-3 text-[13.5px] font-semibold text-ink">Drag and drop the ISO here</div>
            <div className="mt-1 text-[12.5px] text-label">or <span className="font-medium text-link">browse</span> to choose a file</div>
            <div className="mt-3 text-[11.5px] text-label">One .iso file · checked against this record before it is accepted</div>
            {error && <div className="mt-3 text-[12px] text-risk">{error}</div>}
          </button>
        )}

      </div>
    </div>
  );
}
