import { OS_UPGRADES, countsFor, eligibleFor, byId, type OsUpgrade } from './osUpgrade';
import { FLEET } from './fleet';
import { endpointsForRun } from './deployment';
import { lifecycleOf, osRuns } from './dashboard';

/* Data for the OS Upgrade dashboard, one function per widget in the spec. */

/** Statuses that make a published deployment "active". */
const ACTIVE = ['Ready to deploy', 'Ready to Deploy', 'Downloading', 'Downloaded', 'In Progress'];

// ── KPI 1 · Upgraded Successfully ─────────────────────────────────────────

/* DISTINCT endpoints, not a sum of per-run successes: a machine that took two
 * upgrades in the window is one machine upgraded. */
export function upgradedSuccessfully(): string[] {
  const ids = new Set<string>();
  osRuns().forEach((d) => endpointsForRun(d)
    .filter((e) => e.status === 'Success')
    .forEach((e) => ids.add(e.id)));
  return [...ids];
}

// ── KPI 2 · EOL Systems ───────────────────────────────────────────────────

export const eolSystems = () => FLEET.filter((e) => lifecycleOf(e.family, e.release) === 'End of support');

// ── KPI 3 · Active OS Upgrade Deployments ─────────────────────────────────

/* A run counts as active when at least ONE of its endpoints is still moving —
 * the run's own header status can read Completed while stragglers retry. */
export const activeDeployments = () => osRuns().filter((d) =>
  ACTIVE.includes(d.status) ||
  endpointsForRun(d).some((e) => e.status === 'In Progress' || e.status === 'Yet to Receive'));

// ── Chart 1 · EOL Systems by OS ───────────────────────────────────────────

/* Top 10 by count, everything below folded into Others — a long tail of
 * single-device versions buries the versions worth acting on. */
export function eolByOsVersion() {
  const tally = new Map<string, number>();
  eolSystems().forEach((e) => {
    const k = `${e.family} ${e.release}`;
    tally.set(k, (tally.get(k) ?? 0) + 1);
  });
  const rows = [...tally.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  if (rows.length <= 10) return rows;
  const others = rows.slice(10).reduce((s, r) => s + r.value, 0);
  return [...rows.slice(0, 10), { label: 'Others', value: others }];
}

// ── Chart 2 · Compatibility by OS Upgrade Patch ───────────────────────────

/* Ranked by ELIGIBLE endpoints (compatible + incompatible), because a patch
 * nothing is eligible for tells you nothing about compatibility. */
export function compatibilityByPatch() {
  return OS_UPGRADES
    .map((u) => {
      const c = countsFor(u);
      return { id: u.id, label: u.name, eligible: c.compatible + c.incompatible, compatible: c.compatible, incompatible: c.incompatible };
    })
    .filter((r) => r.eligible > 0)
    .sort((a, b) => b.eligible - a.eligible)
    .slice(0, 10)
    .map((r) => ({
      id: r.id,
      label: r.label,
      segments: [
        { label: 'Compatible', value: r.compatible, color: 'var(--color-ok)' },
        { label: 'Incompatible', value: r.incompatible, color: 'var(--color-risk)' },
      ],
    }));
}

// ── Chart 3 · Top Incompatibility Reasons ─────────────────────────────────

/* ENDPOINTS per failed prerequisite, deduplicated: one machine short of disk
 * against three target patches is one machine short of disk. */
export function topIncompatibilityReasons() {
  const RULES = ['Free Disk', 'RAM', 'TPM version', 'Secure Boot', 'CPU Speed', 'CPU Cores'];
  const seen = new Map<string, Set<string>>();
  OS_UPGRADES.forEach((u) => eligibleFor(u)
    .filter((r) => r.verdict === 'Incompatible')
    .forEach((r) => r.reasons.forEach((reason) => {
      const rule = RULES.find((k) => reason.toLowerCase().startsWith(k.toLowerCase())) ?? reason;
      if (!seen.has(rule)) seen.set(rule, new Set());
      seen.get(rule)!.add(r.endpoint.id);
    })));
  return RULES
    .map((label) => ({ label, value: seen.get(label)?.size ?? 0 }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
}

// ── Chart 4 · Compatibility donut for one patch ───────────────────────────

export function compatibilityFor(id: string) {
  const c = countsFor(byId(id));
  return [
    { label: 'Compatible', value: c.compatible, color: 'var(--color-ok)' },
    { label: 'Incompatible', value: c.incompatible, color: 'var(--color-risk)' },
  ];
}

export type { OsUpgrade };
