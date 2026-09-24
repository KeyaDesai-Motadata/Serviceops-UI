/* OS Upgrade — the technician-side derivations.
 *
 * The admin ISO catalogue answered one question per image: who is compatible. A technician asks
 * three, and the Patches module needs all three as COLUMNS:
 *
 *   how urgent is it   → End of Support, as a countdown rather than a date
 *   who can take it    → readiness, split ready / blocked / already on this build
 *   can I deploy it    → whether the ISO has actually landed
 *
 * Everything here is DERIVED from OS_IMAGES and computersFor(), the same pair the admin
 * Prerequisites card and Computers grid read. A number in the Patches grid therefore cannot
 * disagree with the prerequisite rules that produced it.
 */

import { OS_IMAGES, computersFor, prerequisitesFor, prereqPhrase } from './osUpgradeData';
import type { OsImage, EvaluatedComputer, Prereq } from './osUpgradeData';

/** The prototype's "today". One constant, so every countdown on every screen agrees. */
export const TODAY = new Date(2026, 8, 23); // 23 Sep 2026

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '14 Oct 2027' — the one date shape the OS catalogue is written in. */
function parseCatalogDate(s: string): Date | null {
  const m = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/.exec(s.trim());
  if (!m) return null;
  const mon = MONTHS.indexOf(m[2]);
  return mon < 0 ? null : new Date(Number(m[3]), mon, Number(m[1]));
}

// ── End of Support ─────────────────────────────────────────────────────────

export type EosTone = 'expired' | 'urgent' | 'soon' | 'ok';

export interface EosInfo {
  /** What the pill says. */
  label: string;
  /** Negative once the date has passed. */
  days: number;
  tone: EosTone;
  /** The raw date, for the tooltip — the pill trades it away for the countdown. */
  date: string;
}

/* Severity is meaningless for an ISO, so EOS takes that column's place: it is the thing that
 * actually makes an upgrade urgent, and it sorts. Thresholds are the support-lifecycle ones a
 * patching team already works to — inside a quarter is urgent, inside a year is worth planning. */
export function eosInfo(img: OsImage): EosInfo {
  const d = parseCatalogDate(img.eosDate);
  if (!d) return { label: img.eosDate || '---', days: Infinity, tone: 'ok', date: img.eosDate };
  const days = Math.round((d.getTime() - TODAY.getTime()) / 86_400_000);
  if (days < 0) return { label: `Unsupported since ${MONTHS[d.getMonth()]} ${d.getFullYear()}`, days, tone: 'expired', date: img.eosDate };
  if (days <= 90) return { label: `EOS in ${days} day${days === 1 ? '' : 's'}`, days, tone: 'urgent', date: img.eosDate };
  if (days <= 365) return { label: `EOS in ${Math.round(days / 30)} months`, days, tone: 'soon', date: img.eosDate };
  return { label: img.eosDate, days, tone: 'ok', date: img.eosDate };
}

export const EOS_TONE: Record<EosTone, { bg: string; fg: string }> = {
  expired: { bg: '#FEE2E2', fg: '#B91C1C' },
  urgent: { bg: '#FEF2F2', fg: '#DC2626' },
  soon: { bg: '#FFF7ED', fg: '#C2410C' },
  ok: { bg: 'transparent', fg: '#6B7280' },
};

// ── Readiness ──────────────────────────────────────────────────────────────

export interface Readiness {
  /** Meets every prerequisite. */
  ready: number;
  /** Fails at least one — `blockedRows` says which. */
  blocked: number;
  /** Already running this build, so the upgrade does not apply. */
  onBuild: number;
  /** ready + blocked + onBuild. */
  total: number;
  rows: EvaluatedComputer[];
}

/* An image's target build, as it appears in a machine's Current OS string. 'Windows 11' + '25H2',
 * 'Ubuntu Server' + '24.04.1 LTS' → 'Ubuntu' + '24.04'. Used only to spot machines that are
 * ALREADY there — those are neither ready nor blocked, they are done. */
function targetTokens(img: OsImage): { family: string; version: string } {
  const family = img.name.replace(/\s+(Server|Desktop)$/i, '');
  const version = /^\d+\.\d+/.test(img.osVersion)
    ? (img.osVersion.match(/^\d+\.\d+/) as RegExpMatchArray)[0]
    : img.osVersion;
  return { family, version };
}

const onTargetBuild = (c: EvaluatedComputer, img: OsImage): boolean => {
  const { family, version } = targetTokens(img);
  return c.currentOs.includes(family) && c.currentOs.includes(version);
};

/* computersFor() walks a 150-machine fleet through every prerequisite, and the grid asks for it
 * once per row. Memoised by image id — the fleet is deterministic, so a second call can only ever
 * return the same answer. */
const readinessCache = new Map<string, Readiness>();

export function readinessFor(img: OsImage): Readiness {
  const hit = readinessCache.get(img.id);
  if (hit) return hit;
  const rows = computersFor(img);
  let ready = 0;
  let blocked = 0;
  let onBuild = 0;
  rows.forEach((r) => {
    if (onTargetBuild(r, img)) onBuild += 1;
    else if (r.status === 'Compatible') ready += 1;
    else blocked += 1;
  });
  const out: Readiness = { ready, blocked, onBuild, total: rows.length, rows };
  readinessCache.set(img.id, out);
  return out;
}

export type ReadinessBucket = 'ready' | 'blocked' | 'onBuild';

/* The three buckets, split by the SAME test that produced the counts — so the bar, the pills and
 * the machine list can never add up differently. A machine already on the target build is in
 * neither of the other two: the upgrade does not apply to it, ready or not. */
export function bucketRows(img: OsImage, bucket: ReadinessBucket): EvaluatedComputer[] {
  return readinessFor(img).rows.filter((r) => {
    if (onTargetBuild(r, img)) return bucket === 'onBuild';
    return bucket === (r.status === 'Compatible' ? 'ready' : 'blocked');
  });
}

/** The blocked machines, each already carrying its `reasons` from the evaluator. */
export const blockedRows = (img: OsImage): EvaluatedComputer[] => bucketRows(img, 'blocked');

/** The single most common reason machines cannot take this image — the headline for the drawer. */
export function topBlocker(img: OsImage): string | null {
  const tally = new Map<string, number>();
  blockedRows(img).forEach((r) => r.reasons.forEach((x) => tally.set(x, (tally.get(x) ?? 0) + 1)));
  let best: string | null = null;
  let n = 0;
  tally.forEach((count, reason) => { if (count > n) { n = count; best = reason; } });
  return best;
}

// ── The ISO gate ───────────────────────────────────────────────────────────

/* The seam of the whole move: the admin still owns uploading the image, the technician owns
 * targeting and deploying it. An image with no ISO behind it is listed — a technician needs to
 * know the upgrade exists — but it cannot be deployed, and the row says whose job that is. */
export const isoReady = (img: OsImage): boolean => img.status === 'Uploaded';

export const ISO_LABEL: Record<OsImage['status'], string> = {
  Uploaded: 'Available',
  'In Progress': 'Uploading',
  Paused: 'Upload paused',
  Failed: 'Upload failed',
  Cancelled: 'Upload cancelled',
  'Not Uploaded': 'Not uploaded',
};

// ── The technician's list row ──────────────────────────────────────────────

export type UpgradeApproval = 'Approved' | 'Not Approved';

export interface OsUpgradeRow {
  img: OsImage;
  eos: EosInfo;
  readiness: Readiness;
  iso: boolean;
  approval: UpgradeApproval;
}

/* Approval is real state the technician moves, not a stored field on the ISO — the admin uploads
 * an image, the patching team decides whether it may be rolled out. Seeded so the grid opens with
 * a believable mix rather than every row in one state. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0;
  return h;
}

export const seedApprovals = (): Record<string, UpgradeApproval> =>
  Object.fromEntries(OS_IMAGES.map((i) => [
    i.id,
    // An image nobody can deploy has never been through approval.
    isoReady(i) && hash(i.id) % 3 !== 0 ? 'Approved' : 'Not Approved',
  ])) as Record<string, UpgradeApproval>;

export function upgradeRows(approvals: Record<string, UpgradeApproval>): OsUpgradeRow[] {
  return OS_IMAGES.map((img) => ({
    img,
    eos: eosInfo(img),
    readiness: readinessFor(img),
    iso: isoReady(img),
    approval: approvals[img.id] ?? 'Not Approved',
  }));
}

// ── One endpoint's upgrade ─────────────────────────────────────────────────

export interface PrereqCheck {
  attribute: string;
  required: string;
  actual: string;
  ok: boolean;
}

export type UpgradeState = 'Ready' | 'Blocked' | 'Current' | 'None';

export interface EndpointUpgrade {
  state: UpgradeState;
  /** The image this machine is being offered. Absent when `state` is 'None'. */
  img?: OsImage;
  checks: PrereqCheck[];
  failed: number;
  iso: boolean;
  /** Why there is nothing to offer — shown when `state` is 'None' or 'Current'. */
  note?: string;
}

/* Which image a machine is offered. The upgrade LADDER, not the catalogue: a Windows 10 box is
 * offered Windows 11 in its own edition, a 2019 server is offered 2025. Only uploaded images are
 * targeted where one exists, because offering a machine an ISO nobody can deploy is a dead end. */
function targetFor(osName: string): OsImage | undefined {
  const pick = (f: (i: OsImage) => boolean) => OS_IMAGES.find((i) => f(i) && isoReady(i)) ?? OS_IMAGES.find(f);
  if (/Windows Server/i.test(osName)) return pick((i) => i.prereq === 'winsrv' && /2025/.test(i.title));
  if (/Windows 11/i.test(osName)) return pick((i) => i.prereq === 'win11' && i.osVersion === '25H2' && i.architecture === 'x64');
  if (/Windows 10/i.test(osName)) {
    const edition = /Enterprise/i.test(osName) ? 'Enterprise' : 'Pro';
    return pick((i) => i.prereq === 'win11' && i.edition === edition && i.architecture === 'x64');
  }
  if (/Ubuntu|Debian|CentOS|Red Hat|Linux/i.test(osName)) return pick((i) => i.prereq === 'linux');
  return undefined;
}

/* An endpoint's hardware, as the agent would have reported it. The endpoints list carries OS and
 * network facts only, so the prerequisite-bearing specs are drawn deterministically from the
 * endpoint id: same machine, same numbers, every render. The rota puts roughly a third of the
 * fleet behind on one prerequisite, which is what makes the Blocked state reachable from the UI. */
function specsFor(endpointId: string, arch: string) {
  const h = hash(endpointId);
  const base = {
    ram: [8, 16, 16, 32, 8, 16][h % 6],
    disk: [120, 210, 256, 480, 96, 180][(h >> 3) % 6],
    tpm: 2,
    secureBoot: true,
    cpuSpeed: 2 + ((h >> 5) % 5) * 0.4,
    cpuCores: 4 + ((h >> 7) % 4) * 2,
    arch,
  };
  switch (h % 9) {
    case 0: return { ...base, disk: 41 };
    case 1: return { ...base, tpm: 1.2, secureBoot: false };
    case 2: return { ...base, ram: 2, disk: 58 };
    default: return base;
  }
}

/** How a machine's actual value reads in the Prerequisite table, in the rule's own units. */
function actualFor(p: Prereq, s: ReturnType<typeof specsFor>, currentOs: string): string {
  switch (p.key) {
    case 'ram': return `${s.ram} GB`;
    case 'disk': return `${s.disk} GB`;
    case 'tpm': return s.tpm.toFixed(1);
    case 'secureBoot': return s.secureBoot ? 'Enabled' : 'Disabled';
    case 'cpuSpeed': return `${s.cpuSpeed.toFixed(1)} GHz`;
    case 'cpuCores': return String(s.cpuCores);
    case 'arch': return s.arch;
    case 'currentOs': return currentOs;
    default: return '---';
  }
}

/* The Required column reads as a sentence, the same way the admin Prerequisites card does —
 * `[Windows 10 2004+]` is builder syntax, and a technician comparing it against "Windows 10
 * Enterprise" in the next column should not have to translate the brackets. */
function requiredFor(p: Prereq): string {
  const { lead, value, qualifier } = prereqPhrase(p);
  return [lead, value, qualifier].filter(Boolean).join(' ');
}

/** Build number out of '10.0.26200.8328' — the third part is the Windows release. */
const buildOf = (version: string | null): number => Number(version?.split('.')[2] ?? 0);

export function upgradeForEndpoint(
  endpointId: string,
  osName: string,
  version: string | null,
  architecture = '64-bit',
): EndpointUpgrade {
  const img = targetFor(osName);
  if (!img) {
    return { state: 'None', checks: [], failed: 0, iso: false, note: `No upgrade image is published for ${osName}.` };
  }

  /* Already there. Windows 11 ships 25H2 as build 26200, so a machine on that build is running
     the image it would otherwise be offered — the tab says so rather than offering it again. */
  if (/Windows 11/i.test(osName) && buildOf(version) >= 26200) {
    return { state: 'Current', img, checks: [], failed: 0, iso: isoReady(img), note: 'Running the latest published build.' };
  }
  if (/Windows Server 2025/i.test(osName)) {
    return { state: 'Current', img, checks: [], failed: 0, iso: isoReady(img), note: 'Running the latest published build.' };
  }

  const shortOs = osName.replace(/^Microsoft\s+/, '');
  const specs = specsFor(endpointId, architecture.replace(' BIT', '-bit').toLowerCase() === '64-bit' ? '64-bit' : '32-bit');
  const checks: PrereqCheck[] = prerequisitesFor(img).map((p) => {
    const actual = actualFor(p, specs, shortOs);
    let ok = true;
    switch (p.key) {
      case 'ram': ok = specs.ram >= (p.num ?? 0); break;
      case 'disk': ok = specs.disk >= (p.num ?? 0); break;
      case 'tpm': ok = specs.tpm >= (p.num ?? 0); break;
      case 'secureBoot': ok = specs.secureBoot; break;
      case 'cpuSpeed': ok = specs.cpuSpeed >= (p.num ?? 0); break;
      case 'cpuCores': ok = specs.cpuCores >= (p.num ?? 0); break;
      case 'arch': ok = specs.arch === p.value; break;
      // The floor is a release rank; every endpoint in this fleet clears it.
      case 'currentOs': ok = true; break;
      default: ok = true;
    }
    return { attribute: p.attribute, required: requiredFor(p), actual, ok };
  });

  const failed = checks.filter((c) => !c.ok).length;
  return { state: failed ? 'Blocked' : 'Ready', img, checks, failed, iso: isoReady(img) };
}
