import { FLEET, type Endpoint, type Family } from './fleet';

/* The OS Upgrade catalogue — Windows only, because that is what the module
 * ships. Every compatibility number on every screen is computed from THIS
 * catalogue against THE fleet in fleet.ts. Nothing is generated per image. */

export interface Prereq { attribute: string; value: string; }

export interface OsUpgrade {
  id: string;
  name: string;                 // full title, as the product shows it
  family: Family;               // what it upgrades TO
  edition: string;
  osVersion: string;
  build: number;                // decides "already on this build"
  architecture: string;
  language: string;
  size: string;
  releaseDate: string;
  eosDate: string;
  approval: 'Approved' | 'Not Approved';
  kb: string;                   // Microsoft KB article for the feature update
  source: string;
  status: string;
  downloadStatus: string;
  downloadOn: string;
  rebootRequired: string;
  uuid: string;
  referenceUrl: string;
  description: string;
  prereqs: Prereq[];
}

const WIN11: Prereq[] = [
  { attribute: 'RAM', value: '4 GB or more' },
  { attribute: 'Free Disk', value: '64 GB or more' },
  { attribute: 'TPM Version', value: '2.0 or higher' },
  { attribute: 'Secure Boot', value: 'Turned on' },
  { attribute: 'CPU Speed', value: '1 GHz or faster' },
  { attribute: 'CPU Cores', value: '2 or more' },
  { attribute: 'Architecture', value: '64-bit only' },
  { attribute: 'Device Model', value: 'Not restricted' },
];

const WINSRV: Prereq[] = [
  { attribute: 'RAM', value: '8 GB or more' },
  { attribute: 'Free Disk', value: '80 GB or more' },
  { attribute: 'TPM Version', value: '2.0 or higher' },
  { attribute: 'Secure Boot', value: 'Turned on' },
  { attribute: 'CPU Speed', value: '1 GHz or faster' },
  { attribute: 'CPU Cores', value: '4 or more' },
  { attribute: 'Architecture', value: '64-bit only' },
  { attribute: 'Device Model', value: 'Not restricted' },
];

export const OS_UPGRADES: OsUpgrade[] = [
  {
    id: 'OSU-1', kb: 'KB5054156', name: 'Windows 11 (25H2) Enterprise (x64)', family: 'Windows 11',
    edition: 'Enterprise', osVersion: '25H2', build: 26200, architecture: '64 BIT', language: 'English (US)',
    size: '5.2 GB', releaseDate: 'Tue, Sep 30, 2025 05:30 PM', eosDate: '14 Oct 2027',
    approval: 'Approved', source: 'Vendor Catalog', status: 'Published',
    downloadStatus: 'Success', downloadOn: 'Sun, Jul 12, 2026 10:22 AM', rebootRequired: 'Yes',
    uuid: 'win11-25h2-enterprise-x64',
    referenceUrl: 'https://www.microsoft.com/software-download/windows11',
    description: 'Feature upgrade to Windows 11, version 25H2 for Enterprise editions. Replaces the running operating system in place, preserving installed applications and user data. A restart is required and the device must meet every prerequisite before the upgrade is offered to it.',
    prereqs: WIN11,
  },
  {
    id: 'OSU-2', kb: 'KB5044284', name: 'Windows 11 (24H2) Pro (x64)', family: 'Windows 11',
    edition: 'Pro', osVersion: '24H2', build: 26100, architecture: '64 BIT', language: 'English (US)',
    size: '5.6 GB', releaseDate: 'Tue, Oct 01, 2024 05:30 PM', eosDate: '13 Oct 2026',
    approval: 'Approved', source: 'Vendor Catalog', status: 'Published',
    downloadStatus: 'Success', downloadOn: 'Thu, Jul 02, 2026 04:38 PM', rebootRequired: 'Yes',
    uuid: 'win11-24h2-pro-x64',
    referenceUrl: 'https://www.microsoft.com/software-download/windows11',
    description: 'Feature upgrade to Windows 11, version 24H2 for Pro editions. End of support falls within the year, so devices taking this build should be planned onto 25H2 before October 2026.',
    prereqs: WIN11,
  },
  {
    id: 'OSU-3', kb: 'KB5015684', name: 'Windows 10 (22H2) Enterprise (x64)', family: 'Windows 10',
    edition: 'Enterprise', osVersion: '22H2', build: 19045, architecture: '64 BIT', language: 'English (US)',
    size: '4.7 GB', releaseDate: 'Tue, Oct 18, 2022 05:30 PM', eosDate: '14 Oct 2025',
    approval: 'Approved', source: 'Vendor Catalog', status: 'Published',
    downloadStatus: 'Success', downloadOn: 'Thu, Jun 18, 2026 11:04 AM', rebootRequired: 'Yes',
    uuid: 'win10-22h2-enterprise-x64',
    referenceUrl: 'https://www.microsoft.com/software-download/windows10',
    description: 'Final feature update for Windows 10. This build passed end of support in October 2025 and no longer receives security updates — devices still running it should be moved to Windows 11.',
    prereqs: WIN11,
  },
  {
    id: 'OSU-4', kb: 'KB5044281', name: 'Windows Server 2025 Datacenter (x64)', family: 'Windows Server 2022',
    edition: 'Datacenter', osVersion: '24H2', build: 26100, architecture: '64 BIT', language: 'English (US)',
    size: '6.4 GB', releaseDate: 'Fri, Nov 01, 2024 05:30 PM', eosDate: '10 Oct 2034',
    approval: 'Not Approved', source: 'Vendor Catalog', status: 'Published',
    downloadStatus: 'Success', downloadOn: 'Wed, Apr 08, 2026 10:09 AM', rebootRequired: 'Yes',
    uuid: 'winsrv-2025-datacenter-x64',
    referenceUrl: 'https://www.microsoft.com/evalcenter/windows-server-2025',
    description: 'In-place upgrade to Windows Server 2025 Datacenter from Server 2016 or later. Roles and features are preserved. Supported until October 2034.',
    prereqs: WINSRV,
  },
];

export const byId = (id: string) => OS_UPGRADES.find((u) => u.id === id) ?? OS_UPGRADES[0];

// ══ The one evaluator ═════════════════════════════════════════════════════

/* Four outcomes, and they PARTITION the fleet for any one image: every machine
 * is exactly one of these, so the four counts always sum to the fleet size.
 * That is what makes the dashboard's numbers addable. */
export type Verdict = 'Compatible' | 'Incompatible' | 'Already on this build' | 'Not applicable' | 'Not scanned';

export interface Evaluated {
  endpoint: Endpoint;
  verdict: Verdict;
  /** Populated only for Incompatible. */
  reasons: string[];
}

/** A client image never applies to a server, and vice versa. */
const isServer = (f: Family) => f.startsWith('Windows Server');

function applies(e: Endpoint, u: OsUpgrade): boolean {
  if (isServer(e.family) !== isServer(u.family)) return false;
  if (e.architecture !== u.architecture) return false;
  /* Edition is preserved by an in-place upgrade — a Pro device takes the Pro
     image, not the Enterprise one. */
  if (!isServer(e.family) && e.edition !== u.edition) return false;
  return true;
}

export function evaluate(e: Endpoint, u: OsUpgrade): Evaluated {
  if (!applies(e, u)) return { endpoint: e, verdict: 'Not applicable', reasons: [] };
  if (e.build >= u.build) return { endpoint: e, verdict: 'Already on this build', reasons: [] };
  /* ⚠️ Never scanned is its OWN verdict. Counting it as Incompatible would
     inflate the hardware gap with machines nobody has measured. */
  if (!e.specs) return { endpoint: e, verdict: 'Not scanned', reasons: [] };

  const s = e.specs;
  const reasons: string[] = [];
  const min = (attr: string) => Number(/([\d.]+)/.exec(u.prereqs.find((p) => p.attribute === attr)?.value ?? '')?.[1] ?? 0);
  if (s.ram < min('RAM')) reasons.push(`RAM below ${min('RAM')} GB`);
  if (s.disk < min('Free Disk')) reasons.push(`Free Disk below ${min('Free Disk')} GB`);
  if (s.tpm < min('TPM Version')) reasons.push(`TPM version below ${min('TPM Version')}`);
  if (!s.secureBoot) reasons.push('Secure Boot is Disabled');
  if (s.cpuSpeed < min('CPU Speed')) reasons.push(`CPU Speed below ${min('CPU Speed')} GHz`);
  if (s.cpuCores < min('CPU Cores')) reasons.push(`CPU Cores below ${min('CPU Cores')}`);

  return { endpoint: e, verdict: reasons.length ? 'Incompatible' : 'Compatible', reasons };
}

/** Every machine judged against one image — a partition of the whole fleet. */
export const evaluateFleet = (u: OsUpgrade): Evaluated[] => FLEET.map((e) => evaluate(e, u));

/** The eligible population only: what the record's Endpoint tab lists. */
export const eligibleFor = (u: OsUpgrade): Evaluated[] =>
  evaluateFleet(u).filter((r) => r.verdict === 'Compatible' || r.verdict === 'Incompatible' || r.verdict === 'Not scanned');

export const countsFor = (u: OsUpgrade) => {
  const all = evaluateFleet(u);
  const n = (v: Verdict) => all.filter((r) => r.verdict === v).length;
  return {
    compatible: n('Compatible'),
    incompatible: n('Incompatible'),
    notScanned: n('Not scanned'),
    onBuild: n('Already on this build'),
    notApplicable: n('Not applicable'),
    total: all.length,
  };
};

// ══ Cumulative — every device once ════════════════════════════════════════

/* ⚠️ Across several target builds the per-image counts CANNOT be summed: a
 * machine eligible for both 25H2 and 24H2 would be counted twice, which is how
 * "462 compatible" appeared against a fleet of 46. Each endpoint is therefore
 * resolved to ONE cumulative state. */
export type Posture = 'Up to date' | 'Ready to upgrade' | 'Blocked' | 'Not scanned' | 'No upgrade available';

export function postureOf(e: Endpoint, scope: OsUpgrade[] = OS_UPGRADES): Posture {
  const verdicts = scope.map((u) => evaluate(e, u));
  if (verdicts.some((v) => v.verdict === 'Compatible')) return 'Ready to upgrade';
  if (verdicts.some((v) => v.verdict === 'Incompatible')) return 'Blocked';
  if (verdicts.some((v) => v.verdict === 'Not scanned')) return 'Not scanned';
  /* Nothing left to move to: the machine already sits on the newest build its
     family has, rather than there being no image at all. */
  if (verdicts.some((v) => v.verdict === 'Already on this build')) return 'Up to date';
  return 'No upgrade available';
}

export const POSTURE_ORDER: Posture[] = ['Ready to upgrade', 'Blocked', 'Not scanned', 'Up to date', 'No upgrade available'];

export const POSTURE_COLOR: Record<Posture, string> = {
  'Ready to upgrade': 'var(--color-ok)',
  Blocked: 'var(--color-risk)',
  'Not scanned': 'var(--color-warn)',
  'Up to date': 'var(--color-link)',
  'No upgrade available': 'var(--color-none)',
};

export function postureSummary(scope: OsUpgrade[] = OS_UPGRADES) {
  const tally = Object.fromEntries(POSTURE_ORDER.map((p) => [p, 0])) as Record<Posture, number>;
  FLEET.forEach((e) => { tally[postureOf(e, scope)] += 1; });
  return POSTURE_ORDER.map((label) => ({ label, value: tally[label], color: POSTURE_COLOR[label] }));
}
