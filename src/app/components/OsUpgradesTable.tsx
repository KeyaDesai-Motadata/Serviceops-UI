import { ChevronUp, ChevronDown, MonitorUp } from 'lucide-react';
import { EOS_TONE } from './osUpgradeTechnician';
import type { OsUpgradeRow, Readiness } from './osUpgradeTechnician';

/* The OS Upgrades grid — the second tab of the Patches page.
 *
 * It is the PATCH grid, minus the columns an ISO has no answer for and plus the two it needs.
 * Dropped: Missing Endpoint (a machine is not *missing* Windows 11, it is eligible for it),
 * Severity (an image carries no CVSS rating) and Reboot Required (always Yes, so the column
 * carries no information). Added: End of Support, which is what actually makes an upgrade
 * urgent, and Compatibility, so "which upgrade is blocked on most of my fleet" is answerable
 * from the list rather than one drawer at a time.
 */

export type SortKey = 'id' | 'name' | 'release' | 'eos' | 'compat' | 'installed' | 'approval';

interface Props {
  rows: OsUpgradeRow[];
  selected: Set<string>;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelect: (id: string, checked: boolean) => void;
  sortColumn: SortKey | null;
  sortDirection: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  onOpen: (row: OsUpgradeRow) => void;
}

/* Compatibility, in the slot Severity vacated — the same position a technician's eye already
 * scans for "how much work is this". Two counts, matching the two statuses the Endpoint tab
 * defines; machines already on the target build are neither, and are counted separately. */
function CompatCell({ r }: { r: Readiness }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px]">
      <span className="inline-flex items-center gap-1 font-semibold text-[#15803D]">
        <span className="size-2 rounded-full bg-[#22C55E]" />
        {r.ready.toLocaleString()}
      </span>
      <span className="text-[#CBD5E1]">·</span>
      <span className={`inline-flex items-center gap-1 font-semibold ${r.blocked ? 'text-[#DC2626]' : 'text-[#9CA3AF]'}`}>
        <span className={`size-2 rounded-full ${r.blocked ? 'bg-[#EF4444]' : 'bg-[#CBD5E1]'}`} />
        {r.blocked.toLocaleString()}
      </span>
    </span>
  );
}

function SortHead({ label, k, sortColumn, sortDirection, onSort, className = '' }: {
  label: string; k: SortKey; sortColumn: SortKey | null; sortDirection: 'asc' | 'desc'; onSort: (k: SortKey) => void; className?: string;
}) {
  const active = sortColumn === k;
  return (
    <th className={`px-4 py-2.5 text-left text-[12px] font-semibold text-[#364658] tracking-wider ${className}`}>
      <button onClick={() => onSort(k)} className="inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-semibold hover:text-[#3D8BD0]">
        {label}
        {active && (sortDirection === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
      </button>
    </th>
  );
}

const Dash = () => <span className="text-[12px] text-[#9ca3af]">---</span>;

export function OsUpgradesTable({
  rows, selected, allSelected, onSelectAll, onSelect,
  sortColumn, sortDirection, onSort, onOpen,
}: Props) {
  return (
    <table className="w-full min-w-[1180px]">
      <thead className="border-b border-[#e5e7eb]">
        <tr>
          <th className="w-[40px] px-4 py-2.5 text-left">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
            />
          </th>
          <SortHead label="Patch ID" k="id" {...{ sortColumn, sortDirection, onSort }} />
          <SortHead label="Name" k="name" className="min-w-[300px]" {...{ sortColumn, sortDirection, onSort }} />
          <SortHead label="Release Date" k="release" className="min-w-[170px]" {...{ sortColumn, sortDirection, onSort }} />
          <SortHead label="End of Support" k="eos" className="min-w-[175px]" {...{ sortColumn, sortDirection, onSort }} />
          <SortHead label="Compatibility" k="compat" className="min-w-[150px]" {...{ sortColumn, sortDirection, onSort }} />
          <SortHead label="Installed System" k="installed" className="min-w-[150px]" {...{ sortColumn, sortDirection, onSort }} />
          <SortHead label="Approval Status" k="approval" className="min-w-[160px]" {...{ sortColumn, sortDirection, onSort }} />
        </tr>
      </thead>
      <tbody className="divide-y divide-[#e5e7eb] bg-white">
        {rows.length === 0 ? (
          <tr><td colSpan={8} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No OS upgrades found.</td></tr>
        ) : rows.map((row) => {
          const { img, eos, readiness, approval } = row;
          return (
            <tr
              key={img.id}
              onClick={() => onOpen(row)}
              className="cursor-pointer transition-colors hover:bg-[#f9fafb]"
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.has(img.id)}
                  onChange={(e) => onSelect(img.id, e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                />
              </td>

              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{img.id}</span>
              </td>

              {/* The OS glyph is the fastest way to tell a platform apart in a scan — Platform
                  itself is a header KPI on the record, not a column. */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <MonitorUp size={15} className="flex-shrink-0 text-[#7B8FA5]" />
                  <span className="block max-w-[360px] truncate text-[12px] text-[#364658]" title={img.title}>{img.title}</span>
                </div>
              </td>

              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{img.releaseDate}</td>

              {/* End of Support takes the slot Severity had on the patch grid, for the same
                  reason: it is the field that says how urgently this row wants attention. */}
              <td className="px-4 py-3 whitespace-nowrap" title={eos.date}>
                {eos.tone === 'ok' ? (
                  <span className="text-[12px] text-[#6B7280]">{eos.label}</span>
                ) : (
                  <span
                    className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: EOS_TONE[eos.tone].bg, color: EOS_TONE[eos.tone].fg }}
                  >
                    {eos.label}
                  </span>
                )}
              </td>

              <td className="px-4 py-3"><CompatCell r={readiness} /></td>

              {/* Installed System means what it means on the patch grid — endpoints already
                  running this build, so the upgrade does not apply to them. */}
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">
                {readiness.onBuild > 0 ? readiness.onBuild.toLocaleString() : <Dash />}
              </td>

              <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{ color: approval === 'Approved' ? '#22A06B' : '#D97706' }}
                >
                  <span
                    className="size-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: approval === 'Approved' ? '#22C55E' : '#F59E0B' }}
                  />
                  {approval}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
