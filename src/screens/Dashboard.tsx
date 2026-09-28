import { useState, type ReactNode } from 'react';
import { ChevronDown, RefreshCw, Filter, Download, FileText, MoreVertical } from 'lucide-react';
import { KpiTile, Widget } from '../ui/DashKit';
import { DonutSplit } from '../ui/FpCharts';
import { RankedBars, StackedRows } from '../ui/Chart';
import { OS_UPGRADES, byId } from '../data/osUpgrade';
import {
  upgradedSuccessfully, eolSystems, activeDeployments,
  eolByOsVersion, compatibilityByPatch, topIncompatibilityReasons, compatibilityFor,
} from '../data/osDash';

/* OS Upgrade Dashboard.
 *
 * Built to this product's dashboard architecture: a dashboard PICKER beside the
 * title, a date range and Manage Dashboard in the header, a row of KPI tiles
 * that each carry their own refresh and info, then widget cards with a title,
 * those same two icons and a menu.
 *
 * Every figure here drills through, and the drill-through is the point of the
 * widget — a count you cannot open is a count you cannot act on. Each tile and
 * each bar names its destination in its tooltip before it is clicked.
 */

const DASHBOARDS = ['Patch Dashboard', 'OS Upgrade Dashboard', 'Vulnerability Dashboard', 'Asset Dashboard'];
const RANGE = 'Sat, Sep 19, 2026 12:00 AM - Fri, Sep 25, 2026 11:59 PM';

export interface DashboardProps {
  /** OS Upgrade Deployment Summary. `active` pre-filters to in-flight runs. */
  onOpenDeployments?: (active?: boolean) => void;
  /** List of endpoints. `osVersion` pre-filters to one EOL OS + version. */
  onOpenEndpoints?: (osVersion?: string) => void;
  /** OS Upgrade Endpoint Compatibility, on the image's own page. */
  onOpenCompatibility?: (upgradeId: string, filter?: string) => void;
}

export function Dashboard({ onOpenDeployments, onOpenEndpoints, onOpenCompatibility }: DashboardProps) {
  const [dash, setDash] = useState('OS Upgrade Dashboard');
  const [compatTarget, setCompatTarget] = useState(OS_UPGRADES[0].id);

  const upgraded = upgradedSuccessfully();
  const eol = eolSystems();
  const active = activeDeployments();
  const byOs = eolByOsVersion();
  const byPatch = compatibilityByPatch();
  const reasons = topIncompatibilityReasons();

  const IconBtn = ({ icon: Icon, title }: { icon: typeof RefreshCw; title: string }) => (
    <button title={title} className="flex size-8 items-center justify-center rounded-md text-ink-soft hover:bg-strip">
      <Icon size={15} />
    </button>
  );

  const VersionPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="relative">
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className="h-7 w-[200px] appearance-none truncate rounded-md border border-line bg-white pl-2.5 pr-7 text-[12px] text-value focus:border-link focus:outline-none"
      >
        {OS_UPGRADES.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-label" />
    </div>
  );

  const Note = ({ children }: { children: ReactNode }) => (
    <p className="mt-auto w-full border-t border-line pt-2 text-[11px] leading-relaxed text-label">{children}</p>
  );

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header: title, dashboard picker, then range + controls + Manage. */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
        <h1 className="text-[17px] font-semibold text-ink">Dashboard</h1>
        <div className="relative">
          <select
            value={dash} onChange={(e) => setDash(e.target.value)}
            className="h-8 appearance-none rounded-md bg-transparent pl-1 pr-7 text-[15px] font-medium text-ink hover:text-link focus:outline-none"
          >
            {DASHBOARDS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-label" />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[12.5px] text-label">{RANGE}</span>
          <IconBtn icon={Filter} title="Filter" />
          <IconBtn icon={RefreshCw} title="Refresh" />
          <button className="flex h-8 items-center rounded-md bg-ink px-3 text-[12.5px] font-medium text-white hover:bg-ink-soft">
            Manage Dashboard
          </button>
          <IconBtn icon={Download} title="Download" />
          <IconBtn icon={FileText} title="Export" />
          <IconBtn icon={MoreVertical} title="More" />
        </div>
      </div>

      <div className="scroll-y min-h-0 flex-1 px-5 py-4">
        {/* ── The three KPIs ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <KpiTile
            value={upgraded.length}
            label="Upgraded Successfully"
            drillTo="OS Upgrade Deployment Summary"
            onClick={() => onOpenDeployments?.()}
          />
          <KpiTile
            value={eol.length}
            label="EOL Systems"
            drillTo="OS Version Distribution & End-of-Support"
            onClick={() => onOpenEndpoints?.('eol')}
          />
          <KpiTile
            value={active.length}
            label="Active OS Upgrade Deployments"
            drillTo="OS Upgrade Deployment Summary, active only"
            onClick={() => onOpenDeployments?.(true)}
          />
        </div>

        {/* Distinct endpoints, not a sum of run successes — the same machine can
            appear in more than one run in the window. */}
        <p className="mt-2 text-[11px] text-label">
          Counts are for the selected date range. <span className="font-medium text-value">Upgraded Successfully</span> counts
          distinct endpoints, so a machine that took two upgrades in the window is counted once.
        </p>

        {/* ── EOL by OS + version, and compatibility per patch ───────────── */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Widget title="EOL Systems by OS">
            <div className="pb-4 pt-2">
            <RankedBars
              rows={byOs}
              color="var(--color-risk)"
              unit=" endpoints"
              labelWidth={150}
              drillTo="the endpoint list for that OS version"
              onRow={(label) => onOpenEndpoints?.(label === 'Others' ? 'eol' : label)}
            />
            </div>
            <Note>
              OS + version, highest first — top 10, with anything past that folded into
              <span className="font-medium text-value"> Others</span>. Bars total {eol.length} endpoints, the EOL KPI above.
            </Note>
          </Widget>

          <Widget title="Compatibility by OS Upgrade Patch">
            <div className="pb-1 pt-2">
            <StackedRows
              rows={byPatch}
              labelWidth={190}
              onRow={(id) => onOpenCompatibility?.(id)}
              onSegment={(id, segment) => onOpenCompatibility?.(id, segment)}
            />
            </div>
            <div className="mt-3 flex w-full justify-center gap-5">
              {[['Compatible', 'var(--color-ok)'], ['Incompatible', 'var(--color-risk)']].map(([l, c]) => (
                <span key={l} className="inline-flex items-center gap-1.5 text-[11.5px] text-value">
                  <span className="size-2.5 rounded-sm" style={{ background: c }} />{l}
                </span>
              ))}
            </div>
            <Note>
              Top 10 patches by eligible endpoints. A bar counts only endpoints the patch
              <em> applies</em> to — already on the build, not applicable and not scanned are excluded, which is why
              rows differ in length. Click a segment to open that patch at that status.
            </Note>
          </Widget>
        </div>

        {/* ── Reasons, and the per-version split ────────────────────────── */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Widget title="Top Incompatibility Reasons">
            <div className="pb-4 pt-2">
            <RankedBars
              rows={reasons}
              color="var(--color-warn)"
              unit=" endpoints"
              labelWidth={130}
              drillTo="the endpoints blocked by it"
              onRow={(label) => onOpenCompatibility?.(compatTarget, label)}
            />
            </div>
            <Note>
              Distinct endpoints failing each prerequisite, highest first. One machine short of both
              disk and RAM appears in both bars, so these do <span className="font-medium text-value">not</span> sum
              to the blocked total.
            </Note>
          </Widget>

          <Widget
            title="OS Upgrade Compatibility"
            center
            control={<VersionPicker value={compatTarget} onChange={setCompatTarget} />}
          >
            <div className="py-3"><DonutSplit slices={compatibilityFor(compatTarget)} /></div>
            <Note>
              Compatible and incompatible endpoints for the selected version. The centre total is the
              endpoints <em>eligible</em> for {byId(compatTarget).name} — not the whole fleet, since the rest
              are already on this build or running a different OS.
            </Note>
          </Widget>
        </div>
      </div>
    </div>
  );
}
