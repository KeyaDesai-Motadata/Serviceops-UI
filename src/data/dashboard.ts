import {
  OS_UPGRADES, evaluateFleet, eligibleFor, countsFor, postureSummary,
  POSTURE_COLOR, postureOf, type OsUpgrade,
} from './osUpgrade';
import { FLEET, type Family } from './fleet';
import { DEPLOYMENTS, endpointsForRun } from './deployment';

/* Every figure resolves to a row in FLEET or a record in OS_UPGRADES.
 *
 * ⚠️ The rule that was broken before: per-image counts are NEVER summed across
 * images. A machine eligible for two builds is one machine. Anything reported
 * "across all target builds" goes through postureOf(), which resolves each
 * endpoint to exactly one state. */

export const TODAY = new Date(2026, 8, 25);
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function daysToEos(d: string): number {
  const m = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/.exec(d.trim());
  if (!m) return Infinity;
  return Math.round((new Date(Number(m[3]), MONTHS.indexOf(m[2]), Number(m[1])).getTime() - TODAY.getTime()) / 86_400_000);
}

export const osRuns = () => DEPLOYMENTS.filter((d) => d.category === 'OS Upgrade');

// ── lifecycle of the build a device is RUNNING ────────────────────────────

export type Lifecycle = 'Supported' | 'EOS within 180 days' | 'End of support';

/* Dates for the builds devices run, not the builds they are offered. */
const RUNNING_EOS: Record<string, string> = {
  'Windows 10 22H2': '14 Oct 2025',
  'Windows 10 21H2': '13 Jun 2024',
  'Windows 11 24H2': '13 Oct 2026',
  'Windows 11 25H2': '14 Oct 2027',
  'Windows Server 2019 1809': '09 Jan 2029',
  'Windows Server 2022 21H2': '14 Oct 2031',
};

export function lifecycleOf(family: Family, release: string): Lifecycle {
  const d = daysToEos(RUNNING_EOS[`${family} ${release}`] ?? '');
  if (d < 0) return 'End of support';
  if (d <= 180) return 'EOS within 180 days';
  return 'Supported';
}

export const LIFECYCLE_COLOR: Record<Lifecycle, string> = {
  Supported: 'var(--color-ok)',
  'EOS within 180 days': 'var(--color-warn)',
  'End of support': 'var(--color-risk)',
};

// ── headline numbers ──────────────────────────────────────────────────────

export function kpis(scope: OsUpgrade[]) {
  const posture = postureSummary(scope);
  const n = (l: string) => posture.find((p) => p.label === l)?.value ?? 0;
  const runs = osRuns();
  const success = runs.reduce((s, d) => s + d.success, 0);
  const failed = runs.reduce((s, d) => s + d.failed, 0);
  return {
    fleet: FLEET.length,
    ready: n('Ready to upgrade'),
    blocked: n('Blocked'),
    notScanned: n('Not scanned'),
    upToDate: n('Up to date'),
    /* Devices, not catalogue rows — the number a manager is accountable for. */
    pastEos: FLEET.filter((e) => lifecycleOf(e.family, e.release) === 'End of support').length,
    eosSoon: FLEET.filter((e) => lifecycleOf(e.family, e.release) === 'EOS within 180 days').length,
    successRate: success + failed ? Math.round((success / (success + failed)) * 100) : null,
    awaitingApproval: scope.filter((u) => u.approval !== 'Approved').length,
    activeRuns: runs.filter((d) => d.status !== 'Completed').length,
    rebootPending: FLEET.filter((e) => e.reboot === 'Yes').length,
  };
}

// ── 1 · Estate census ─────────────────────────────────────────────────────

const FAMILIES: Family[] = ['Windows 11', 'Windows 10', 'Windows Server 2022', 'Windows Server 2019'];

export const census = () => ({
  total: FLEET.length,
  rows: FAMILIES.map((f) => ({ label: f, value: FLEET.filter((e) => e.family === f).length })),
});

// ── 2 · Upgrade posture (cumulative — each device once) ───────────────────

export const posture = (scope: OsUpgrade[]) => postureSummary(scope).filter((p) => p.value > 0);

// ── 3 · Per-target readiness (a partition of the fleet) ───────────────────

export function targetReadiness(u: OsUpgrade) {
  const c = countsFor(u);
  return [
    { label: 'Compatible', value: c.compatible, color: 'var(--color-ok)' },
    { label: 'Incompatible', value: c.incompatible, color: 'var(--color-risk)' },
    { label: 'Not scanned', value: c.notScanned, color: 'var(--color-warn)' },
    { label: 'Already on this build', value: c.onBuild, color: 'var(--color-link)' },
    { label: 'Not applicable', value: c.notApplicable, color: 'var(--color-none)' },
  ].filter((s) => s.value > 0);
}

export const readinessByImage = (scope: OsUpgrade[]) =>
  scope.map((u) => {
    const c = countsFor(u);
    return {
      label: u.name, id: u.id,
      segments: [
        { label: 'Compatible', value: c.compatible, color: 'var(--color-ok)' },
        { label: 'Incompatible', value: c.incompatible, color: 'var(--color-risk)' },
        { label: 'Not scanned', value: c.notScanned, color: 'var(--color-warn)' },
      ],
    };
  });

// ── 4 · Why endpoints are blocked ─────────────────────────────────────────

/* Counted per RULE and DEDUPLICATED by endpoint: a machine failing disk on two
 * different target builds is one machine short of disk, not two. */
export function blockedByRule(scope: OsUpgrade[]) {
  const RULES = ['RAM', 'Free Disk', 'TPM version', 'Secure Boot', 'CPU Speed', 'CPU Cores'];
  const seen = new Map<string, Set<string>>();
  scope.forEach((u) => eligibleFor(u)
    .filter((r) => r.verdict === 'Incompatible')
    .forEach((r) => r.reasons.forEach((reason) => {
      const rule = RULES.find((k) => reason.toLowerCase().startsWith(k.toLowerCase())) ?? reason;
      if (!seen.has(rule)) seen.set(rule, new Set());
      seen.get(rule)!.add(r.endpoint.id);
    })));
  return RULES.map((label) => ({ label, value: seen.get(label)?.size ?? 0 }))
    .sort((a, b) => b.value - a.value);
}

/* Machines by HOW MANY rules they fail — one blocker is a setting, three is a
 * refresh. Deduplicated across images by taking each endpoint's worst case. */
export function fixEffort(scope: OsUpgrade[]) {
  const worst = new Map<string, number>();
  scope.forEach((u) => eligibleFor(u)
    .filter((r) => r.verdict === 'Incompatible')
    .forEach((r) => worst.set(r.endpoint.id, Math.max(worst.get(r.endpoint.id) ?? 0, r.reasons.length))));
  const c = (f: (n: number) => boolean) => [...worst.values()].filter(f).length;
  return [
    { label: '1 blocker', value: c((n) => n === 1), color: 'var(--color-warn)' },
    { label: '2 blockers', value: c((n) => n === 2), color: 'var(--color-risk)' },
    { label: '3 or more', value: c((n) => n >= 3), color: '#8C1D3F' },
  ].filter((s) => s.value > 0);
}

// ── 5 · Lifecycle of what the fleet runs ──────────────────────────────────

export function lifecycleByBuild() {
  const acc = new Map<string, { label: string; life: Lifecycle; n: number }>();
  FLEET.forEach((e) => {
    const key = `${e.family} ${e.release}`;
    const cur = acc.get(key) ?? { label: key, life: lifecycleOf(e.family, e.release), n: 0 };
    cur.n += 1; acc.set(key, cur);
  });
  const order: Lifecycle[] = ['End of support', 'EOS within 180 days', 'Supported'];
  return [...acc.values()]
    .sort((a, b) => order.indexOf(a.life) - order.indexOf(b.life) || b.n - a.n)
    .map((r) => ({ label: r.label, id: r.label, segments: [{ label: r.life, value: r.n, color: LIFECYCLE_COLOR[r.life] }] }));
}

export function lifecycleSummary() {
  const order: Lifecycle[] = ['Supported', 'EOS within 180 days', 'End of support'];
  return order.map((label) => ({
    label,
    value: FLEET.filter((e) => lifecycleOf(e.family, e.release) === label).length,
    color: LIFECYCLE_COLOR[label],
  })).filter((s) => s.value > 0);
}

// ── 6 · Upgrade path ──────────────────────────────────────────────────────

export function upgradePaths(scope: OsUpgrade[]) {
  const acc = new Map<string, number>();
  scope.forEach((u) => evaluateFleet(u)
    .filter((r) => r.verdict === 'Compatible')
    .forEach((r) => {
      const k = `${r.endpoint.family} ${r.endpoint.release} ${r.endpoint.edition}||${u.name}`;
      acc.set(k, (acc.get(k) ?? 0) + 1);
    }));
  return [...acc.entries()]
    .map(([k, value]) => ({ from: k.split('||')[0], to: k.split('||')[1], value }))
    .sort((a, b) => b.value - a.value);
}

// ── 7 · Rollout ───────────────────────────────────────────────────────────

export const runProgress = () =>
  osRuns().map((d) => ({
    label: d.name, id: d.id,
    segments: [
      { label: 'Success', value: d.success, color: 'var(--color-ok)' },
      { label: 'Failed', value: d.failed, color: 'var(--color-risk)' },
      { label: 'In Progress', value: d.inProgress, color: 'var(--color-warn)' },
      { label: 'Yet to Receive', value: Math.max(0, d.targeted - d.success - d.failed - d.inProgress), color: 'var(--color-none)' },
    ],
  }));

export function statusByOffice() {
  const acc = new Map<string, Record<string, number>>();
  osRuns().forEach((d) => endpointsForRun(d).forEach((e) => {
    const row = acc.get(e.remoteOffice) ?? { Success: 0, Failed: 0, 'In Progress': 0, 'Yet to Receive': 0 };
    row[e.status] += 1; acc.set(e.remoteOffice, row);
  }));
  return [...acc.entries()].map(([label, r]) => ({
    label, id: label,
    segments: [
      { label: 'Success', value: r.Success, color: 'var(--color-ok)' },
      { label: 'Failed', value: r.Failed, color: 'var(--color-risk)' },
      { label: 'In Progress', value: r['In Progress'], color: 'var(--color-warn)' },
      { label: 'Yet to Receive', value: r['Yet to Receive'], color: 'var(--color-none)' },
    ],
  })).sort((a, b) => b.segments[1].value - a.segments[1].value);
}

export { postureOf, POSTURE_COLOR };
