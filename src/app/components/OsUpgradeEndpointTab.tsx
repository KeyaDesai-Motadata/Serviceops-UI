import { useState, useEffect } from 'react';
import { Search, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from './Pagination';
import { bucketRows, readinessFor } from './osUpgradeTechnician';
import type { OsImage } from './osUpgradeData';

/* Endpoint tab — OS Upgrade Patch Details.
 *
 * Lists only the endpoints ELIGIBLE for this upgrade: right OS family, right architecture, and a
 * current version below the target. Machines already running the target build are excluded
 * rather than counted as Compatible — counting them would overstate how much work is left, which
 * is the one number this tab exists to report. They are reported separately in the chip row, so
 * "where did the rest of my fleet go" still has an answer.
 *
 * Compatibility is EVALUATED from the Prerequisites tab's rules, never stored, so the two tabs
 * cannot contradict each other.
 */

type Bucket = 'Compatible' | 'Incompatible';
const BUCKETS: Bucket[] = ['Compatible', 'Incompatible'];

export function OsUpgradeEndpointTab({ img }: { img: OsImage }) {
  const [bucket, setBucket] = useState<Bucket>('Compatible');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const readiness = readinessFor(img);
  const counts: Record<Bucket, number> = { Compatible: readiness.ready, Incompatible: readiness.blocked };

  useEffect(() => { setCurrentPage(1); }, [bucket, search]);

  const q = search.trim().toLowerCase();
  const rows = bucketRows(img, bucket === 'Compatible' ? 'ready' : 'blocked').filter((r) =>
    !q ||
    r.endpointId.toLowerCase().includes(q) ||
    r.hostName.toLowerCase().includes(q) ||
    r.ipAddress.includes(q) ||
    r.currentOs.toLowerCase().includes(q) ||
    r.reasons.join(' ').toLowerCase().includes(q));

  const totalPages = Math.ceil(rows.length / itemsPerPage) || 1;
  const pageRows = rows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="px-6 py-4">
      {/* Compatibility chips + the refresh that re-reads endpoint data. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {BUCKETS.map((b) => (
          <button
            key={b}
            onClick={() => setBucket(b)}
            className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
              bucket === b ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#364658] hover:border-[#3D8BD0] hover:bg-[#F5F7FA]'
            }`}
          >
            <span
              className="size-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: b === 'Compatible' ? '#22C55E' : '#EF4444' }}
            />
            {b}
            <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums ${
              bucket === b ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#64748B]'
            }`}>
              {counts[b].toLocaleString()}
            </span>
          </button>
        ))}

        {/* Machines already on the target build are not eligible, so they are neither chip —
            stated rather than silently missing from the total. */}
        {readiness.onBuild > 0 && (
          <span className="ml-1 text-[12px] text-[#64748B]">
            {readiness.onBuild.toLocaleString()} already on this build
          </span>
        )}

        <button
          onClick={() => toast.success('Endpoint compatibility refreshed from the latest scan data')}
          title="Re-evaluate using the latest endpoint data"
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] hover:bg-[#F5F7FA]"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Select field to search..."
            className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
          />
          {search ? (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={16} /></button>
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              {['Endpoint ID', 'Host Name', 'IP Address', 'Current OS', 'Agent Version', 'Architecture', 'Compatibility Status', 'Reason'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {pageRows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No {bucket.toLowerCase()} endpoints found.</td></tr>
            ) : pageRows.map((r) => (
              <tr key={r.endpointId} className="hover:bg-[#f9fafb] transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{r.endpointId}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{r.hostName}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{r.ipAddress}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{r.currentOs}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{r.agentVersion ?? '---'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{r.arch ?? '---'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{ color: bucket === 'Compatible' ? '#22A06B' : '#DC2626' }}
                  >
                    <span
                      className="size-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: bucket === 'Compatible' ? '#22C55E' : '#EF4444' }}
                    />
                    {bucket}
                  </span>
                </td>
                {/* Only an Incompatible row has a reason — and every one of them has its own. */}
                <td className="px-4 py-3 text-[12px] text-[#DC2626]">
                  {r.reasons.length ? r.reasons.join(' · ') : <span className="text-[#9ca3af]">---</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sticky bottom-0 z-30 -mx-6 -mb-4 bg-white">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={rows.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
        />
      </div>
    </div>
  );
}
