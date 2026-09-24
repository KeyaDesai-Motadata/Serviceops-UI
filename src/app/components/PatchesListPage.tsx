import { useState, useEffect } from 'react';
import { ChevronDown, X, Search, FileText, Download, RefreshCw, History, Columns3, Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PatchesTable } from './PatchesTable';
import { OsUpgradesTable, type SortKey as UpgradeSortKey } from './OsUpgradesTable';
import { seedApprovals, upgradeRows } from './osUpgradeTechnician';
import type { OsUpgradeRow, UpgradeApproval } from './osUpgradeTechnician';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import type { PatchTab } from '../routes';

export type Severity = 'Critical' | 'Important' | 'Moderate' | 'Low' | 'Unspecified';
export type RebootRequired = 'Yes' | 'No' | 'May be';
export type ApprovalStatus = 'Approved' | 'Not Approved';

export interface Patch {
  id: string;
  name: string;
  severity: Severity;
  releaseDate: string;
  /** number of systems missing this patch, or null = --- */
  missingSystem: number | null;
  /** number of systems where it is installed, or null = --- */
  installedSystem: number | null;
  rebootRequired: RebootRequired;
  approvalStatus: ApprovalStatus;
  /** Patch catalog category (Updates / Security Updates / …). Defaults to "Updates". */
  category?: string;
  /** Optional release notes — only some patches carry one (shown on the detail Overview). */
  description?: string;
  /** Present ONLY when the record is a Patch DEPLOYMENT opened via deploymentToPatchShape —
   *  carries the real run properties so the deployment drawer's header KPIs stay data-driven. */
  deployment?: { status: string; policy: string; installAfter: string | null; expiryDate: string | null; deploymentType?: string };
  /** Present ONLY when the record is an ENDPOINT opened via endpointToPatchShape —
   *  carries the agent/health values so the endpoint drawer's header KPIs stay data-driven, and
   *  the OS facts its Patches tab evaluates an OS upgrade against. */
  endpoint?: {
    agentOnline: boolean;
    systemHealth: 'Healthy' | 'Warning' | 'Critical' | null;
    osName?: string;
    version?: string | null;
    architecture?: string;
  };
  /** Present ONLY when the record is a DETECTED CVE opened via cveToPatchShape —
   *  carries the CVE facts so the CVE drawer's Overview (metrics/references) stays data-driven. */
  cve?: { severity: string; cweId: string; cvssScore: number; exploitStatus: string; patchAvailability: string; nvdStatus: string };
  /** Present ONLY when the record is an OS UPGRADE opened via imageToPatchShape — carries the
   *  catalogue image id, and the drawer resolves everything else from OS_IMAGES rather than
   *  copying it, so the grid and the detail page cannot drift. */
  osUpgrade?: { imageId: string };
  /** Set ONLY when the endpoint was opened from the BOM module — makes the endpoint drawer land
   *  on its BOM tab. The same endpoint opened from Patch/Vulnerability lands on Overview. */
  bomMode?: boolean;
}

// Realistic Windows / third-party patch catalog (mock).
export const mockPatches: Patch[] = [
  { id: 'PCH-4834', category: 'Critical Updates', name: 'Manual Patch — Internal Tooling Hotfix', severity: 'Critical', releaseDate: 'Wed, Jul 08, 2026 03:24 PM', missingSystem: null, installedSystem: null, rebootRequired: 'Yes', approvalStatus: 'Approved', description: 'Emergency hotfix packaged by the Platform Engineering team to address a privilege-escalation flaw in the internal agent updater service. A local user could place a crafted binary on the update path and have it executed under the SYSTEM account.\n\nThis is a manually uploaded package and is not distributed through the vendor catalog, so it must be approved and deployed by an administrator. A restart is required for the replacement service binary to load.' },
  { id: 'PCH-4833', name: 'Update for Microsoft 365 Apps (MonthlyEnterpriseChannel) Version 2404', severity: 'Low', releaseDate: 'Tue, Apr 14, 2026 04:55 PM', missingSystem: null, installedSystem: 1, rebootRequired: 'No', approvalStatus: 'Not Approved', description: 'This update rolls the Monthly Enterprise Channel build of Microsoft 365 Apps forward to Version 2404 (Build 17531.20152). It bundles the security fixes shipped in the April servicing release for Word, Excel, Outlook and PowerPoint, including two remote-code-execution issues in the Office graphics component that could be triggered by a specially crafted document.\n\nAlongside the security content, this build resolves a long-standing defect where Outlook could stop syncing shared calendars after a network interruption, and improves start-up time for Excel workbooks that contain large pivot caches. No configuration changes are required after installation.\n\nThe update installs in place and does not require a restart, though any open Office applications must be closed for servicing to complete. Devices that have Office deployed via the Office Deployment Tool will pick up the change automatically on their next scheduled update check.' },
  { id: 'PCH-4832', category: 'Security Updates', name: '2023-07 Cumulative Update for Windows 10 Version 22H2 for x64 (KB5028166)', severity: 'Critical', releaseDate: 'Tue, Jul 11, 2023 05:00 PM', missingSystem: null, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4824', name: 'Google Chrome 124.0.6367.79 Security Update', severity: 'Important', releaseDate: 'Tue, May 05, 2026 12:27 PM', missingSystem: null, installedSystem: null, rebootRequired: 'No', approvalStatus: 'Not Approved' },
  { id: 'PCH-4813', name: '2026-04 Cumulative Update for .NET Framework 3.5 and 4.8 for Windows 11 (KB5036893)', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 8, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4812', name: '2026-04 Cumulative Update for .NET Framework 4.8.1 for Windows Server 2022', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 3, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4811', category: 'Security Updates', name: '2026-04 Cumulative Update for Windows 11 Version 23H2 for x64 (KB5036894)', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 12, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved', description: 'Monthly quality and security rollup for Windows 11, version 23H2. It addresses vulnerabilities in the Windows Kernel, Secure Boot, Windows Media and the Remote Desktop Client, including several elevation-of-privilege and remote-code-execution issues rated Critical.\n\nThe rollup also fixes a regression that could cause File Explorer to stop responding when browsing network shares, and corrects a rendering problem on multi-monitor setups running mixed display scaling. This update supersedes the March cumulative update; installing it makes the earlier package unnecessary.\n\nA restart is required to complete installation on most devices.' },
  { id: 'PCH-4810', name: '2026-04 Cumulative Update for .NET Framework 3.5 and 4.8 for Windows 10 (KB5036892)', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 6, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4809', name: '2026-04 Cumulative Update for .NET Framework 4.8 for Windows Server 2019', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 2, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4808', name: '2026-04 Cumulative Update for .NET Framework 4.7.2 for Windows Server 2016', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 1, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4807', name: '2026-04 Cumulative Update for Windows 10 Version 22H2 for x64 (KB5036892)', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 15, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4806', name: '2026-04 Cumulative Update for .NET Framework 3.5 for Windows Server 2022', severity: 'Critical', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missingSystem: 4, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4804', category: 'Update Rollups', name: '2026-03 Cumulative Update Preview for Windows 11 Version 24H2 (KB5035942)', severity: 'Unspecified', releaseDate: 'Thu, Mar 26, 2026 09:00 PM', missingSystem: null, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4801', name: '2026-03 Cumulative Update for Windows Server 2022 (KB5035857)', severity: 'Unspecified', releaseDate: 'Sat, Mar 21, 2026 09:00 PM', missingSystem: null, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4800', name: '2026-03 Cumulative Update for Windows 11 Version 23H2 for x64 (KB5035853)', severity: 'Critical', releaseDate: 'Tue, Mar 10, 2026 05:00 PM', missingSystem: 9, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4799', name: '2026-02 Cumulative Update Preview for Windows 10 Version 22H2 (KB5034843)', severity: 'Unspecified', releaseDate: 'Tue, Feb 24, 2026 06:00 PM', missingSystem: null, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4797', name: '2026-02 Cumulative Update for Windows 11 Version 24H2 for x64 (KB5034765)', severity: 'Critical', releaseDate: 'Tue, Feb 10, 2026 06:00 PM', missingSystem: 7, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4795', name: '2026-02 Cumulative Update for Windows Server 2019 (KB5034768)', severity: 'Critical', releaseDate: 'Tue, Feb 10, 2026 06:00 PM', missingSystem: 2, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4794', name: '2026-01 Cumulative Update Preview for Windows 11 Version 23H2 (KB5034204)', severity: 'Unspecified', releaseDate: 'Thu, Jan 29, 2026 10:00 PM', missingSystem: null, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4793', name: '2026-01 Cumulative Update Preview for Windows 10 Version 22H2 (KB5034203)', severity: 'Unspecified', releaseDate: 'Thu, Jan 29, 2026 10:00 PM', missingSystem: null, installedSystem: 1, rebootRequired: 'May be', approvalStatus: 'Not Approved' },
  { id: 'PCH-4792', name: 'Mozilla Firefox 125.0.2 Security & Stability Update', severity: 'Important', releaseDate: 'Mon, Apr 21, 2026 11:00 AM', missingSystem: 5, installedSystem: 3, rebootRequired: 'No', approvalStatus: 'Approved' },
  { id: 'PCH-4790', category: 'Security Updates', name: 'Adobe Acrobat Reader DC 2024.002.20933 Security Update', severity: 'Critical', releaseDate: 'Tue, Apr 08, 2026 09:30 PM', missingSystem: 11, installedSystem: 4, rebootRequired: 'No', approvalStatus: 'Approved', description: 'Security update for Adobe Acrobat Reader DC that resolves multiple out-of-bounds read and use-after-free vulnerabilities which could lead to arbitrary code execution when opening a malicious PDF. Adobe rates this update as priority 1 and recommends applying it as soon as possible.' },
  { id: 'PCH-4788', name: 'Security Update for Microsoft Edge (Chromium) 124.0.2478.51', severity: 'Important', releaseDate: 'Fri, Apr 18, 2026 02:00 PM', missingSystem: 6, installedSystem: 8, rebootRequired: 'No', approvalStatus: 'Approved' },
  { id: 'PCH-4785', category: 'Definition Updates', name: 'Microsoft Defender Antimalware Platform Update 4.18.24030', severity: 'Moderate', releaseDate: 'Wed, Apr 02, 2026 07:15 AM', missingSystem: 1, installedSystem: 22, rebootRequired: 'No', approvalStatus: 'Approved' },
  { id: 'PCH-4782', name: '7-Zip 24.05 (x64) Update', severity: 'Low', releaseDate: 'Mon, Mar 24, 2026 10:10 AM', missingSystem: 3, installedSystem: 9, rebootRequired: 'No', approvalStatus: 'Not Approved' },
  { id: 'PCH-4780', name: 'Oracle Java SE 8 Update 411 (JRE) Security Patch', severity: 'Critical', releaseDate: 'Tue, Feb 18, 2026 08:00 PM', missingSystem: 4, installedSystem: 2, rebootRequired: 'No', approvalStatus: 'Not Approved' },
  { id: 'PCH-4778', name: 'Zoom Client for Meetings 5.17.11 Security Update', severity: 'Important', releaseDate: 'Thu, Feb 27, 2026 03:45 PM', missingSystem: 7, installedSystem: 12, rebootRequired: 'No', approvalStatus: 'Approved' },
  { id: 'PCH-4775', category: 'Update Rollups', name: 'Servicing Stack Update for Windows Server 2022 (KB5034439)', severity: 'Moderate', releaseDate: 'Tue, Jan 14, 2026 06:00 PM', missingSystem: 2, installedSystem: 5, rebootRequired: 'Yes', approvalStatus: 'Approved' },
  { id: 'PCH-4772', name: 'Notepad++ 8.6.5 (64-bit) Update', severity: 'Low', releaseDate: 'Fri, Mar 07, 2026 09:20 AM', missingSystem: null, installedSystem: 6, rebootRequired: 'No', approvalStatus: 'Not Approved' },
  { id: 'PCH-4769', name: 'VLC media player 3.0.20 Security Update', severity: 'Moderate', releaseDate: 'Wed, Jan 22, 2026 01:00 PM', missingSystem: 5, installedSystem: 4, rebootRequired: 'No', approvalStatus: 'Not Approved' },
  { id: 'PCH-4766', name: 'Git for Windows 2.44.0 Update', severity: 'Low', releaseDate: 'Tue, Mar 18, 2026 04:30 PM', missingSystem: 2, installedSystem: 7, rebootRequired: 'No', approvalStatus: 'Approved' },
  { id: 'PCH-4763', category: 'Security Updates', name: 'PuTTY 0.81 Security Update (CVE-2024-31497)', severity: 'Critical', releaseDate: 'Mon, Apr 15, 2026 05:40 PM', missingSystem: 3, installedSystem: 1, rebootRequired: 'No', approvalStatus: 'Not Approved', description: 'Upgrades PuTTY to 0.81 to remediate CVE-2024-31497, a biased-nonce weakness in the NIST P-521 ECDSA signature generation that can allow an attacker who observes a number of signatures to recover the private key. Any P-521 keys used with an affected PuTTY build should be treated as compromised and rotated after updating.' },
];

/* Adapt a catalogue image onto the Patch shape, so an OS upgrade opens the SAME detail page a
 * patch does — same tab strip, same properties rail, same approve/decline flow, same audit
 * trail. Only `osUpgrade` is carried; the drawer resolves the image from OS_IMAGES rather than
 * reading a copy, so the grid and the record cannot drift.
 *
 * Severity is set to Unspecified because the shape demands a value, not because an ISO has one —
 * the detail page never renders it for this record type. Reboot is always Yes for a feature
 * upgrade, which is why it is not a column on the grid either. */
const imageToPatchShape = (row: OsUpgradeRow): Patch => ({
  id: row.img.id,
  name: row.img.title,
  severity: 'Unspecified',
  releaseDate: row.img.releaseDate,
  missingSystem: null,
  installedSystem: row.readiness.onBuild || null,
  rebootRequired: 'Yes',
  approvalStatus: row.approval,
  category: 'OS Upgrade',
  osUpgrade: { imageId: row.img.id },
});

/* Toolbar for the Patches page.
 *
 * The tab strip is the bifurcation: software patches and OS upgrades are both patching work and
 * belong under one nav entry, but they share almost no columns — Severity says nothing about an
 * ISO, and End of Support says nothing about a KB. Each tab therefore owns its own view filter,
 * its own CTA and its own grid; only the title row and the search box are common. */
function PatchesToolbar({
  tab, onTabChange, patchCount, upgradeCount, searchQuery, setSearchQuery,
}: {
  tab: PatchTab;
  onTabChange: (t: PatchTab) => void;
  patchCount: number;
  upgradeCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const IconBtn = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <button className="flex h-[30px] w-[30px] items-center justify-center rounded text-[#6b7280] hover:bg-[#f3f4f6]" title={title}>
      {children}
    </button>
  );
  const isUpgrades = tab === 'os-upgrades';

  const TAB_LABELS: { key: PatchTab; label: string; count: number }[] = [
    { key: 'patches', label: 'Software Patches', count: patchCount },
    { key: 'os-upgrades', label: 'OS Upgrades', count: upgradeCount },
  ];

  return (
    <div className="bg-white">
      {/* ONE row: title, then the tabs, then the actions.
       *
       * The tabs sit BESIDE the title rather than on a strip of their own. A dedicated strip cost
       * a full 42px band to hold two buttons, while this row carried a wide empty gap — and the
       * page already worked this way before the tabs existed, when `Missing Patches ▾` sat right
       * of the title. The tabs are still tabs: underline, counts, places you go, not filters.
       *
       * `items-stretch` is what lets each tab's own `border-b-2` land exactly on the row's
       * bottom rule; with `items-center` the underline would float above it. */}
      <div className="flex items-stretch justify-between border-b border-[#E3E8EF] px-6">
        <div className="flex items-stretch gap-6">
          <h1 className="flex items-center text-[16px] font-semibold text-[#364658]">Patches</h1>

          {/* The counts are the bifurcation signal: "32 patches, 15 upgrades" reads before
              anything is clicked. */}
          {TAB_LABELS.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={`-mb-px flex items-center gap-2 border-b-2 py-3 text-[13px] font-medium transition-colors ${
                tab === t.key ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:text-[#364658]'
              }`}
            >
              {t.label}
              <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${
                tab === t.key ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#64748B]'
              }`}>
                {t.count.toLocaleString()}
              </span>
            </button>
          ))}

          {/* The saved view sits AFTER the tabs, because the tab is what decides which views
              exist. Before them it read as though it governed the tabs; left of the search it
              read as a search scope. The row descends: module → record type → slice.
              ⚠️ OS Upgrades has NO view control. A patch has real slices to choose between
              (Missing / Installed / Declined); the fifteen published images are one set with
              nothing to pick from, so the dropdown would open onto a single option and offer
              the reader a choice that isn't one. */}
          {!isUpgrades && (
            <div className="flex items-center gap-4">
              <span className="h-4 w-px bg-[#E3E8EF]" />
              <button className="flex items-center gap-1 whitespace-nowrap text-[14px] font-medium text-[#364658] hover:text-[#3D8BD0]">
                <span>Missing Patches</span>
                <ChevronDown size={16} className="text-[#6b7280]" />
              </button>
            </div>
          )}
        </div>

        {/* The CTA belongs to the tab — a technician authors a patch, but never an OS image. */}
        <div className="flex items-center gap-1 py-2.5">
          <IconBtn title="New"><FileText size={16} /></IconBtn>
          <IconBtn title="Export"><Download size={16} /></IconBtn>
          <IconBtn title="Refresh"><RefreshCw size={16} /></IconBtn>
          <IconBtn title="Download"><Download size={16} /></IconBtn>
          <IconBtn title="History"><History size={16} /></IconBtn>
          <IconBtn title="Columns"><Columns3 size={16} /></IconBtn>
          {/* ⚠️ The OS Upgrades tab has NO create CTA. A technician does not author an OS image —
              the catalogue is published to them — and a deployment is started from the Patch
              Deployment module, which already has its own OS Upgrade category. A second door to
              that flow here would be a second place for it to drift. */}
          {!isUpgrades && (
            <button className="ml-2 flex h-[34px] items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0]">
              <Plus size={15} />
              Create Patch
            </button>
          )}
        </div>
      </div>

      {/* Second Row: full-width search, as it was before the tabs existed. */}
      <div className="px-6 py-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isUpgrades ? 'Search image, edition, version...' : 'Select field to search...'}
            className="h-[36px] w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658] transition-colors"
            >
              <X size={16} />
            </button>
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
          )}
        </div>
      </div>
    </div>
  );
}

export function PatchesListPage({ onNavigate, tab = 'patches', onTabChange }: {
  onNavigate: (page: string) => void;
  /** Which grid to show. Owned by the router so a tab is linkable. */
  tab?: PatchTab;
  onTabChange?: (t: PatchTab) => void;
}) {
  const [patches] = useState<Patch[]>(mockPatches);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<keyof Patch | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  /* ── OS Upgrades tab ───────────────────────────────────────────────────
     Its own selection, sort and page, because the two grids have nothing in common to share —
     a sort key on one is not a column on the other. */
  const [approvals] = useState<Record<string, UpgradeApproval>>(seedApprovals);
  const [upgradeSelected, setUpgradeSelected] = useState<Set<string>>(new Set());
  const [upgradeSort, setUpgradeSort] = useState<UpgradeSortKey | null>(null);
  const [upgradeSortDir, setUpgradeSortDir] = useState<'asc' | 'desc'>('asc');

  const allUpgrades = upgradeRows(approvals);

  /* Approval moves on the RECORD, through the detail page's own Approve / Decline buttons —
     one approval process, not a second one for upgrades. The grid seeds and reports it; the
     drawer holds the decision, exactly as it already does for a patch. */

  // Switching tabs or searching starts the grid at the top; the tabs keep their own selections.
  useEffect(() => { setCurrentPage(1); }, [searchQuery, tab]);
  useEffect(() => { setSearchQuery(''); }, [tab]);

  const { open: openInStack } = useDrawerStack();
  const handleOpenPatch = (patch: Patch) => {
    openInStack('patches', patch.id, patch.name, patch);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(patches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(p => p.id)));
    } else {
      setSelected(new Set());
    }
  };
  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
  };
  const handleSort = (column: keyof Patch) => {
    if (sortColumn === column) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(column); setSortDirection('asc'); }
  };

  let filtered = patches;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = patches.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.severity.toLowerCase().includes(q) ||
      p.releaseDate.toLowerCase().includes(q) ||
      p.rebootRequired.toLowerCase().includes(q) ||
      p.approvalStatus.toLowerCase().includes(q)
    );
  }

  let sorted = [...filtered];
  if (sortColumn) {
    sorted.sort((a, b) => {
      const aStr = String(a[sortColumn] ?? '');
      const bStr = String(b[sortColumn] ?? '');
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map(p => p.id);
  const allCurrentSelected = currentPageIds.every(id => selected.has(id)) && currentPageIds.length > 0;

  // ── OS Upgrades: search, sort, page ──────────────────────────────────
  const uq = searchQuery.trim().toLowerCase();
  const upgradesFiltered = !uq ? allUpgrades : allUpgrades.filter(({ img, eos }) =>
    img.id.toLowerCase().includes(uq) ||
    img.title.toLowerCase().includes(uq) ||
    img.name.toLowerCase().includes(uq) ||
    img.edition.toLowerCase().includes(uq) ||
    img.osVersion.toLowerCase().includes(uq) ||
    img.architecture.toLowerCase().includes(uq) ||
    img.platform.toLowerCase().includes(uq) ||
    eos.label.toLowerCase().includes(uq));

  /* Sorted on what each column MEANS, not on what it prints: End of Support sorts by days
     remaining so "Unsupported since Oct 2025" lands above "EOS in 61 days", and Readiness sorts
     by how many machines are blocked — the number a technician is actually ranking by. */
  const upgradeSortValue = (r: OsUpgradeRow): string | number => {
    switch (upgradeSort) {
      case 'id': return Number(r.img.id.replace(/\D/g, ''));
      case 'name': return r.img.title.toLowerCase();
      case 'release': return r.img.releaseDate.toLowerCase();
      case 'eos': return r.eos.days;
      case 'compat': return r.readiness.blocked;
      case 'installed': return r.readiness.onBuild;
      case 'approval': return r.approval;
      default: return 0;
    }
  };
  const upgradesSorted = [...upgradesFiltered];
  if (upgradeSort) {
    upgradesSorted.sort((a, b) => {
      const av = upgradeSortValue(a);
      const bv = upgradeSortValue(b);
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return upgradeSortDir === 'asc' ? cmp : -cmp;
    });
  }
  const upgradeTotalPages = Math.ceil(upgradesSorted.length / itemsPerPage) || 1;
  const upgradesPaged = upgradesSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const upgradePageIds = upgradesPaged.map((r) => r.img.id);
  const allUpgradesSelected = upgradePageIds.length > 0 && upgradePageIds.every((id) => upgradeSelected.has(id));

  const handleUpgradeSort = (k: UpgradeSortKey) => {
    if (upgradeSort === k) setUpgradeSortDir(upgradeSortDir === 'asc' ? 'desc' : 'asc');
    else { setUpgradeSort(k); setUpgradeSortDir('asc'); }
  };

  const isUpgrades = tab === 'os-upgrades';
  const changeTab = (t: PatchTab) => { onTabChange?.(t); };

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="patches" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={isUpgrades ? upgradeSelected.size : selected.size} />
        <PatchesToolbar
          tab={tab}
          onTabChange={changeTab}
          patchCount={patches.length}
          upgradeCount={allUpgrades.length}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            {isUpgrades ? (
              <OsUpgradesTable
                rows={upgradesPaged}
                selected={upgradeSelected}
                allSelected={allUpgradesSelected}
                onSelectAll={(checked) => setUpgradeSelected(checked ? new Set(upgradePageIds) : new Set())}
                onSelect={(id, checked) => setUpgradeSelected((prev) => {
                  const next = new Set(prev);
                  checked ? next.add(id) : next.delete(id);
                  return next;
                })}
                sortColumn={upgradeSort}
                sortDirection={upgradeSortDir}
                onSort={handleUpgradeSort}
                onOpen={(row) => openInStack('patches', row.img.id, row.img.title, imageToPatchShape(row))}
              />
            ) : (
              <PatchesTable
                patches={paginated}
                selected={selected}
                allSelected={allCurrentSelected}
                onSelectAll={handleSelectAll}
                onSelect={handleSelect}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onPatchClick={handleOpenPatch}
              />
            )}
          </div>
            <Pagination
              currentPage={currentPage}
              totalPages={isUpgrades ? upgradeTotalPages : totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={isUpgrades ? upgradesSorted.length : sorted.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
            />
        </main>
      </div>

    </div>
  );
}
