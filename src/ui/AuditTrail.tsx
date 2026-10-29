import { Pagination } from './Table';

/* The Audit Trail tab, as the new UI lists it: an avatar for who did it, the
 * sentence, and the time — one row per event, newest last. */

export interface AuditEntry { actor: string; text: string; when: string }

const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export function AuditTrail({ entries }: { entries: AuditEntry[] }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scroll-y min-h-0 flex-1 px-6 py-4">
        <div className="rounded-lg border border-[#e5e7eb] bg-white">
          {entries.map((e, i) => (
            <div key={i} className="flex items-start gap-3 border-b border-[#F0F2F5] px-4 py-3 last:border-0">
              <span className="flex size-7 flex-none items-center justify-center rounded-full bg-[#EBF5FF] text-[11px] font-semibold text-[#3D8BD0]">
                {initials(e.actor)}
              </span>
              <div className="min-w-0 pt-0.5">
                <div className="text-[13px] text-[#364658]">{e.text}</div>
                <div className="mt-0.5 text-[12px] text-[#7B8FA5]">{e.when}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Pagination total={entries.length} noun="Audit Trail" />
    </div>
  );
}
