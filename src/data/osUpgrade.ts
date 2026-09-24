/* Mock catalogue for the OS Upgrade screens.
 *
 * Shaped the way the product shapes a patch record, because an OS upgrade IS a
 * patch here — same id space, same approval, same audit. The fields that differ
 * are the ones an operating system image has and a vendor fix does not:
 * edition, architecture, language, end of support, and the prerequisite rules
 * its compatibility is judged by. */

export interface Prereq { attribute: string; value: string; }

export interface OsUpgrade {
  id: string;
  name: string;
  platform: 'Windows' | 'Linux';
  edition: string;
  osVersion: string;
  architecture: string;
  language: string;
  size: string;
  releaseDate: string;
  eosDate: string;
  approval: 'Approved' | 'Not Approved';
  testStatus: string;
  source: string;
  status: string;
  downloadStatus: string;
  downloadOn: string;
  rebootRequired: string;
  uuid: string;
  referenceUrl: string;
  description: string;
  prereqs: Prereq[];
  /** Endpoints in scope: eligible for this image and not already on it. */
  compatible: number;
  incompatible: number;
  /** Already running this build, so the upgrade does not apply — the grid's
   *  "Installed System", and neither compatibility bucket. */
  onBuild: number;
}

const WIN11: Prereq[] = [
  { attribute: 'RAM', value: '4 GB or more' },
  { attribute: 'Free Disk', value: '64 GB or more' },
  { attribute: 'TPM Version', value: '2.0 or higher' },
  { attribute: 'Secure Boot', value: 'Turned on' },
  { attribute: 'CPU Speed', value: '1 GHz or faster' },
  { attribute: 'CPU Cores', value: '2 or more' },
  { attribute: 'Architecture', value: '64-bit only' },
  { attribute: 'Current OS', value: 'Windows 10 2004 or later' },
  { attribute: 'Device Model', value: 'Not restricted' },
];

const LINUX: Prereq[] = [
  { attribute: 'RAM', value: '4 GB or more' },
  { attribute: 'Free Disk', value: '25 GB or more' },
  { attribute: 'TPM Version', value: 'Not restricted' },
  { attribute: 'Secure Boot', value: 'Not restricted' },
  { attribute: 'CPU Speed', value: '2 GHz or faster' },
  { attribute: 'CPU Cores', value: '2 or more' },
  { attribute: 'Architecture', value: '64-bit only' },
  { attribute: 'Current OS', value: 'Ubuntu 20.04 or later' },
  { attribute: 'Device Model', value: 'Not restricted' },
];

export const OS_UPGRADES: OsUpgrade[] = [
  {
    id: 'OSU-1', name: 'Windows 11 (25H2) Enterprise (x64)', platform: 'Windows',
    edition: 'Enterprise', osVersion: '25H2', architecture: '64 BIT', language: 'English (US)',
    size: '5.2 GB', releaseDate: 'Tue, Sep 30, 2025 05:30 PM', eosDate: '14 Oct 2027',
    approval: 'Approved', testStatus: 'Not Tested', source: 'Vendor Catalog', status: 'Published',
    downloadStatus: 'Success', downloadOn: 'Sun, Jul 12, 2026 10:22 AM', rebootRequired: 'Yes',
    uuid: 'win11-25h2-enterprise-x64',
    referenceUrl: 'https://www.microsoft.com/software-download/windows11',
    description: 'Feature upgrade to Windows 11, version 25H2 for Enterprise editions. Replaces the running operating system in place, preserving installed applications and user data. A restart is required and the device must meet every prerequisite below before the upgrade is offered to it.',
    prereqs: WIN11, compatible: 117, incompatible: 52, onBuild: 0,
  },
  {
    id: 'OSU-2', name: 'Ubuntu Server 22.04.4 LTS (x64)', platform: 'Linux',
    edition: 'Server', osVersion: '22.04.4 LTS', architecture: '64 BIT', language: 'Multi-language',
    size: '1.8 GB', releaseDate: 'Thu, Feb 22, 2024 11:00 AM', eosDate: '31 May 2027',
    approval: 'Not Approved', testStatus: 'Not Tested', source: 'Vendor Catalog', status: 'Published',
    downloadStatus: 'Success', downloadOn: 'Thu, Jul 09, 2026 08:15 AM', rebootRequired: 'Yes',
    uuid: 'ubuntu-server-22-04-4-lts-x64',
    referenceUrl: 'https://releases.ubuntu.com/22.04/',
    description: 'Long-term support release of Ubuntu Server 22.04.4. Supported until May 2027. The upgrade runs in place via the distribution upgrade path and requires a restart to complete.',
    prereqs: LINUX, compatible: 81, incompatible: 35, onBuild: 54,
  },
  {
    id: 'OSU-3', name: 'Windows 11 (24H2) Pro (x64)', platform: 'Windows',
    edition: 'Pro', osVersion: '24H2', architecture: '64 BIT', language: 'English (US)',
    size: '5.6 GB', releaseDate: 'Tue, Oct 01, 2024 05:30 PM', eosDate: '13 Oct 2026',
    approval: 'Approved', testStatus: 'Passed', source: 'Vendor Catalog', status: 'Published',
    downloadStatus: 'Success', downloadOn: 'Thu, Jul 02, 2026 04:38 PM', rebootRequired: 'Yes',
    uuid: 'win11-24h2-pro-x64',
    referenceUrl: 'https://www.microsoft.com/software-download/windows11',
    description: 'Feature upgrade to Windows 11, version 24H2 for Pro editions. End of support falls within the year, so devices taking this build should be planned onto 25H2 before October 2026.',
    prereqs: WIN11, compatible: 119, incompatible: 52, onBuild: 0,
  },
  {
    id: 'OSU-4', name: 'Windows 10 (22H2) Enterprise (x64)', platform: 'Windows',
    edition: 'Enterprise', osVersion: '22H2', architecture: '64 BIT', language: 'English (US)',
    size: '4.7 GB', releaseDate: 'Tue, Oct 18, 2022 05:30 PM', eosDate: '14 Oct 2025',
    approval: 'Approved', testStatus: 'Passed', source: 'Vendor Catalog', status: 'Published',
    downloadStatus: 'Success', downloadOn: 'Thu, Jun 18, 2026 11:04 AM', rebootRequired: 'Yes',
    uuid: 'win10-22h2-enterprise-x64',
    referenceUrl: 'https://www.microsoft.com/software-download/windows10',
    description: 'Final feature update for Windows 10. This build passed end of support in October 2025 and no longer receives security updates — devices still running it should be moved to Windows 11.',
    prereqs: WIN11, compatible: 123, incompatible: 49, onBuild: 0,
  },
  {
    id: 'OSU-5', name: 'Windows Server 2025 Datacenter (x64)', platform: 'Windows',
    edition: 'Datacenter', osVersion: '24H2', architecture: '64 BIT', language: 'English (US)',
    size: '6.4 GB', releaseDate: 'Fri, Nov 01, 2024 05:30 PM', eosDate: '10 Oct 2034',
    approval: 'Not Approved', testStatus: 'Not Tested', source: 'Vendor Catalog', status: 'Published',
    downloadStatus: 'Success', downloadOn: 'Wed, Apr 08, 2026 10:09 AM', rebootRequired: 'Yes',
    uuid: 'winsrv-2025-datacenter-x64',
    referenceUrl: 'https://www.microsoft.com/evalcenter/windows-server-2025',
    description: 'In-place upgrade to Windows Server 2025 Datacenter from Server 2016 or later. Roles and features are preserved. Supported until October 2034.',
    prereqs: WIN11, compatible: 22, incompatible: 6, onBuild: 4,
  },
];

export const byId = (id: string) => OS_UPGRADES.find((u) => u.id === id) ?? OS_UPGRADES[0];

// ── the fleet, judged against an image ────────────────────────────────────

export interface ScopedEndpoint {
  id: string; hostName: string; ip: string; currentOs: string;
  agentVersion: string; architecture: string;
  status: 'Compatible' | 'Incompatible'; reason: string;
}

const HOSTS = ['DESKTOP-5JPPI6F', 'WIN-400A8KHMR82', 'FIN-LAPTOP-22', 'HR-PC-09', 'SALES-WKS-14',
  'DEV-BOX-03', 'LEGACY-PC-01', 'REMOTE-EP-42', 'ENG-LT-112', 'OPS-DT-129', 'MKT-LT-146', 'SUP-DT-163'];
const REASONS = ['Free Disk below 64 GB', 'TPM version below 2.0 · Secure Boot is Disabled',
  'RAM below 4 GB', 'Current OS build older than 2004', 'Free Disk below 64 GB · RAM below 4 GB'];

/** Deterministic, so a row reads the same on every render. */
export function endpointsFor(u: OsUpgrade): ScopedEndpoint[] {
  const total = u.compatible + u.incompatible;
  const n = Math.min(total, 24);
  const compatShare = Math.round((u.compatible / total) * n);
  return Array.from({ length: n }, (_, i) => {
    const ok = i < compatShare;
    return {
      id: `EP-${380 + i * 3}`,
      hostName: HOSTS[i % HOSTS.length] + (i >= HOSTS.length ? `-${i}` : ''),
      ip: `172.16.${14 + (i % 6)}.${((i * 17) % 200) + 20}`,
      currentOs: u.platform === 'Windows'
        ? ['Windows 10 22H2', 'Windows 10 21H2', 'Windows 10 2004'][i % 3]
        : ['Ubuntu 20.04 LTS', 'Ubuntu 22.04 LTS'][i % 2],
      agentVersion: ['8.7.408', '8.7.404', '8.7.301', '8.6.300'][i % 4],
      architecture: '64 BIT',
      status: ok ? 'Compatible' : 'Incompatible',
      reason: ok ? '' : REASONS[i % REASONS.length],
    };
  });
}
