import { useEffect, useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { IdPill } from './Table';

/* The "Add …" picker: a right side drawer over a scrim, as the product uses.
 *
 * ⚠️ `single` is radio behaviour with a LOCK, not a silent swap. Once one row is
 * chosen the rest grey out and refuse clicks; the chosen row stays live, so
 * unselecting it re-opens the whole list. The limit is enforced by the control
 * — no state ever holds two — rather than by an error after the fact.
 */

export interface PickerRow { id: string; name: string; meta: string; }

export function PickerDrawer({ open, title, subtitle, rows, selected, single = false, onClose, onApply }: {
  open: boolean;
  title: string;
  subtitle: string;
  rows: PickerRow[];
  selected: string[];
  single?: boolean;
  onClose: () => void;
  onApply: (ids: string[]) => void;
}) {
  const [picked, setPicked] = useState<string[]>(selected);
  const [q, setQ] = useState('');

  // Reopening starts from what is on the form, not the last session's picks.
  useEffect(() => { if (open) { setPicked(selected); setQ(''); } }, [open, selected]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const query = q.trim().toLowerCase();
  const visible = query
    ? rows.filter((r) => `${r.id} ${r.name} ${r.meta}`.toLowerCase().includes(query))
    : rows;
  const lockedOut = (id: string) => single && picked.length > 0 && !picked.includes(id);
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : single ? [id] : [...p, id]));

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="flex h-full w-[760px] max-w-[95vw] flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3">
          <div>
            <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
            <p className="mt-0.5 text-[12px] text-label">{subtitle}</p>
          </div>
          <button onClick={onClose} className="flex size-8 flex-none items-center justify-center rounded text-label hover:bg-strip">
            <X size={17} />
          </button>
        </div>

        <div className="px-5 py-3">
          <div className="relative">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="h-9 w-full rounded-md border border-line bg-white pl-3 pr-9 text-[12.5px] text-value placeholder:text-label focus:border-link focus:outline-none"
            />
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-label" />
          </div>
        </div>

        <div className="scroll-y min-h-0 flex-1">
          {visible.length === 0 ? (
            <p className="px-5 py-12 text-center text-[13px] text-label">Nothing matches that search.</p>
          ) : visible.map((r) => {
            const on = picked.includes(r.id);
            const locked = lockedOut(r.id);
            return (
              <button
                key={r.id}
                disabled={locked}
                onClick={() => toggle(r.id)}
                className={`flex w-full items-center gap-3 border-b border-line-soft px-5 py-3 text-left last:border-0 ${
                  locked ? 'cursor-not-allowed opacity-45' : 'hover:bg-strip'
                }`}
              >
                <span className={`flex size-4 flex-none items-center justify-center rounded border ${
                  on ? 'border-ink bg-ink text-white' : 'border-line'}`}>
                  {on && <Check size={11} />}
                </span>
                <IdPill>{r.id}</IdPill>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-value">{r.name}</span>
                <span className="flex-none text-[12px] text-label">{r.meta}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 border-t border-line px-5 py-3">
          <span className="text-[12px] text-label">
            {single
              ? picked.length
                ? 'One OS upgrade patch selected · unselect it to choose a different one'
                : 'Select one OS upgrade patch'
              : `${picked.length} selected`}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={onClose} className="h-8 rounded-md border border-line px-3 text-[12.5px] font-medium text-ink-soft hover:bg-strip">
              Cancel
            </button>
            <button
              onClick={() => { onApply(picked); onClose(); }}
              className="h-8 rounded-md bg-ink px-3 text-[12.5px] font-medium text-white hover:bg-ink-soft"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
