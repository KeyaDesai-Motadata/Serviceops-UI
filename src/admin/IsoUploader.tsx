import { useRef, useState, type DragEvent } from 'react';
import { UploadCloud, Server, Paperclip, Trash2, AlertCircle, ExternalLink } from 'lucide-react';

/* The "Upload File" field of Create OS Upgrade, built the way the product's
 * modules take a file (the new UI's Upload ISO popup, `OsUpgradeUpload.tsx`):
 * a grey dashed box — "Choose files (or) Drop here" + Browse — and, once a file
 * is chosen, the file as a chip with a remove button.
 *
 * Choosing a file does NOT send it. The transfer starts on Create and runs in
 * the new row of the listing (progress, pause/stop, then the ISO check), so a
 * 5 GB upload never holds the panel open.
 *
 * ⚠️ The Windows File Server notice sits directly ABOVE the box, at the upload
 * itself: the file is stored on and distributed from that server. */

export const UPLOAD_GUIDELINES = [
  'Supported format: .iso only',
  'Maximum file size: 10 GB',
  'Verify the ISO is not corrupted',
  'Time varies with size and network',
  'Keep the browser open while uploading',
];

const MAX = 10 * 1024 ** 3;

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(bytes / 1024 ** 3 >= 10 ? 1 : 2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'less than a minute left';
  if (seconds < 60) return `${Math.ceil(seconds)} sec left`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s ? `${m} min ${s} sec left` : `${m} min left`;
}

/** Rejects a file before any transfer starts; null means it's good to go. */
export const validateIso = (f: File) =>
  !f.name.toLowerCase().endsWith('.iso') ? `"${f.name}" is not an ISO image. Choose a .iso file.`
  : f.size > MAX ? `"${f.name}" is ${formatBytes(f.size)} — the limit is 10 GB.`
  : null;

export const btnSecondary = 'inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]';

export function ProgressBar({ pct, tone }: { pct: number; tone: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EEF2F6]">
      <div className="h-full rounded-full transition-[width] duration-300 ease-linear" style={{ width: `${pct}%`, backgroundColor: tone }} />
    </div>
  );
}

function FileChip({ name, size, onRemove }: { name: string; size: string; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded border border-[#E5E7EB] bg-white px-3 py-2.5">
      <span className="flex size-8 flex-shrink-0 items-center justify-center rounded bg-[#EBF5FF] text-[#3D8BD0]"><Paperclip size={15} /></span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-[#364658]" title={name}>{name}</div>
        <div className="text-[12px] text-[#7B8FA5]">{size}</div>
      </div>
      {onRemove && (
        <button onClick={onRemove} title="Remove file" className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#EF4444] transition-colors hover:bg-[#FEF3F2]">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

/** The requirement, at the upload. */
export function FileServerNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded border border-[#F5D9A8] bg-[#FFFAEB] px-3 py-2.5">
      <Server size={15} className="mt-0.5 flex-none text-[#B45309]" />
      <div className="min-w-0 text-[12.5px] leading-[1.55] text-[#364658]">
        <span className="font-semibold text-[#B45309]">Windows File Server required to upload. </span>
        The ISO is uploaded to your Windows File Server and distributed to endpoints from there —
        make sure one is configured and reachable before you upload.
        <button className="ml-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-[#3D8BD0] hover:underline">
          Configure File Server <ExternalLink size={11} />
        </button>
      </div>
    </div>
  );
}

export function IsoPicker({ value, onChange, note, size }: {
  value: File | null;
  onChange: (f: File | null) => void;
  /** Shown instead of the File's own size (a record whose File is a stand-in). */
  size?: string;
  /** The line under a chosen file; null hides it. */
  note?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const take = (picked: File | undefined) => {
    if (!picked) return;
    const problem = validateIso(picked);
    setError(problem);
    onChange(problem ? null : picked);
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(false); take(e.dataTransfer.files?.[0]); };

  return (
    <div>
      <div className="mb-1.5 text-[13px] text-[#364658]">Upload File <span className="text-[#DC2626]">*</span></div>

      <div className="mb-2"><FileServerNotice /></div>

      {value ? (
        <FileChip name={value.name} size={size ?? formatBytes(value.size)} onRemove={() => { onChange(null); setError(null); }} />
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-2 rounded border border-dashed px-4 py-7 transition-colors ${
            dragging ? 'border-[#3D8BD0] bg-[#F5FAFF]' : 'border-[#CBD5E1] bg-[#F9FAFB]'
          }`}
        >
          <UploadCloud size={22} className="text-[#9CA3AF]" />
          <div className="text-[13px] text-[#64748B]">Choose files (or) Drop here</div>
          <button type="button" onClick={() => inputRef.current?.click()} className={btnSecondary}>Browse</button>
          <input ref={inputRef} type="file" accept=".iso" className="hidden" onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-start gap-2 rounded border border-[#FEE4E2] bg-[#FFFBFA] px-3 py-2 text-[12px] text-[#DC2626]">
          <AlertCircle size={14} className="mt-px flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {value && note !== null && (
        <p className="mt-2 text-[12px] text-[#7B8FA5]">
          {note ?? 'The upload starts when you click Create and continues in the list — you can keep working while it runs.'}
        </p>
      )}

      <div className="mt-3">
        <div className="text-[13px] font-semibold text-[#364658]">Upload Guidelines</div>
        <ul className="mt-1.5 space-y-1">
          {UPLOAD_GUIDELINES.map((g) => (
            <li key={g} className="flex gap-2 text-[13px] leading-[1.5] text-[#64748B]">
              <span className="mt-[7px] size-1 flex-shrink-0 rounded-full bg-[#CBD5E1]" />
              {g}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
