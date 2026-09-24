import { ListChecks } from 'lucide-react';
import { prerequisitesFor, prereqPhrase } from './osUpgradeData';
import type { OsImage } from './osUpgradeData';
import { readinessFor } from './osUpgradeTechnician';

/* Prerequisites tab — OS Upgrade Patch Details.
 *
 * The card is the one the admin OS Upgrade detail page used before that module was removed:
 * blue ListChecks head with the rule count, a grey #F9FAFB p-5 panel, and the asset Hardware
 * tab's metadata grid inside it. The rules did not change when their home did, so neither did
 * the way they are read.
 *
 * Every rule is read as a SENTENCE through the shared `prereqPhrase` — emphasis on the number,
 * the comparison muted around it — so the row says what it means without operator syntax. The
 * rows come from the same `prerequisitesFor(img)` the compatibility evaluator reads, so this tab
 * and the Endpoint tab's verdicts can never disagree.
 */

/* Attributes the spec lists that the catalogue carries no rule for. Shown as unrestricted rather
 * than dropped — a requirement missing from a requirements list reads as a rendering fault. */
const UNRESTRICTED_EXTRAS = ['Device Model'];

export function OsUpgradePrereqTab({ img, onViewEndpoints }: {
  img: OsImage;
  /** Jumps to the Endpoint tab — the card's own footer answers "eligible against what?". */
  onViewEndpoints: () => void;
}) {
  const prereqs = prerequisitesFor(img);
  const readiness = readinessFor(img);
  const inScope = readiness.ready + readiness.blocked;

  return (
    <div className="px-6 py-4">
      <section>
        <div className="mb-3 flex items-center gap-2">
          <ListChecks className="size-4 flex-shrink-0 text-[#3D8BD0]" />
          <h3 className="text-[14px] font-semibold text-[#364658]">Prerequisites</h3>
          <span className="ml-auto text-[12px] text-[#7B8FA5]">{prereqs.length} rules · all must pass</span>
        </div>

        {/* Spacing is the asset Hardware tab's verbatim: p-5 panel, gap-x-6 gap-y-5 grid. */}
        <div className="rounded-lg bg-[#F9FAFB] p-5">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {prereqs.map((p) => {
              const ph = prereqPhrase(p);
              return (
                <div key={p.key} className="min-w-0">
                  <div className="mb-1 text-[12px] text-[#64748B]">{p.attribute}</div>
                  <div className="break-words text-[13px] text-[#64748B]">
                    {ph.lead && <>{ph.lead} </>}
                    <span className="font-semibold text-[#364658]">{ph.value}</span>
                    {ph.qualifier && <> {ph.qualifier}</>}
                  </div>
                </div>
              );
            })}

            {UNRESTRICTED_EXTRAS.map((attribute) => (
              <div key={attribute} className="min-w-0">
                <div className="mb-1 text-[12px] text-[#64748B]">{attribute}</div>
                <div className="break-words text-[13px] text-[#9CA3AF]">Not restricted</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-[12px] text-[#7B8FA5]">
            An endpoint must meet or exceed every value above before this upgrade is offered to it.
          </p>
          <span className="ml-auto text-[12px] text-[#7B8FA5]">
            Evaluated against <span className="font-semibold text-[#364658]">{inScope.toLocaleString()}</span> endpoints ·{' '}
            <span className="font-semibold text-[#22A06B]">{readiness.ready.toLocaleString()} compatible</span>
          </span>
          <button onClick={onViewEndpoints} className="text-[12px] font-medium text-[#3D8BD0] hover:underline">View endpoints ›</button>
        </div>
      </section>
    </div>
  );
}
