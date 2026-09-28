/* THE fleet. One list of real machines with the hardware the prerequisite rules
 * are judged against.
 *
 * ⚠️ There is exactly one fleet. The previous build had two — this list, and a
 * synthetic ~150-per-image population generated inside the compatibility
 * helper — so the dashboard could say "7 managed endpoints" and "462
 * compatible" on the same screen. Every count on every screen now resolves to
 * a row in here.
 *
 * Windows only: OS Upgrade ships Windows feature updates, so a Linux row would
 * be a device the module can never act on.
 */

export type Edition = 'Pro' | 'Enterprise' | 'Datacenter' | 'Standard';
export type Family = 'Windows 11' | 'Windows 10' | 'Windows Server 2019' | 'Windows Server 2022';

export interface Endpoint {
  id: string;
  hostName: string;
  ip: string;
  family: Family;
  edition: Edition;
  /** Display version, e.g. '22H2'. */
  release: string;
  /** Windows build number — what decides "already on this build". */
  build: number;
  architecture: '64 BIT' | '32 BIT';
  remoteOffice: string;
  agentVersion: string;
  health: 'Healthy' | 'Warning' | 'Critical' | null;
  online: boolean;
  reboot: 'Yes' | 'No';
  tags: string[];
  /** Inventory the prerequisite rules read. Null = never scanned. */
  specs: { ram: number; disk: number; tpm: number; secureBoot: boolean; cpuSpeed: number; cpuCores: number } | null;
}

const OFFICES = ['Ahmedabad HQ', 'Mumbai Office', 'Pune Development Center', 'Bengaluru Campus', 'Delhi NCR Office'];
const AGENTS = ['8.7.503', '8.7.408', '8.7.404', '8.7.301', '8.6.300'];

/* Deterministic generator — same fleet on every render, with a realistic spread
 * of blockers rather than random noise. The i % 12 rota is what produces a
 * believable hardware gap: roughly a third of Windows 10 devices fail at least
 * one Windows 11 rule, which is what the estate actually looks like. */
function make(i: number, family: Family, edition: Edition, release: string, build: number): Endpoint {
  const base = { ram: [8, 16, 16, 32, 8, 16][i % 6], disk: [120, 210, 256, 480, 96, 180][i % 6], tpm: 2, secureBoot: true, cpuSpeed: 2 + ((i % 5) * 0.4), cpuCores: 4 + (i % 4) * 2 };
  const specs =
    i % 12 === 3 ? { ...base, disk: 41 }
    : i % 12 === 5 ? { ...base, tpm: 1.2, secureBoot: false }
    : i % 12 === 7 ? { ...base, ram: 2, disk: 58 }
    : i % 12 === 9 ? { ...base, secureBoot: false }
    : i % 12 === 11 ? null                       // never scanned — a real third state
    : base;
  const prefix = family.startsWith('Windows Server') ? 'SRV' : ['FIN', 'ENG', 'SAL', 'HR', 'OPS', 'MKT'][i % 6];
  return {
    id: `EP-${100 + i}`,
    hostName: `${prefix}-${family.startsWith('Windows Server') ? 'NODE' : 'LT'}-${String(1000 + i * 7).slice(1)}`,
    ip: `10.20.${20 + (i % 5)}.${((i * 13) % 200) + 20}`,
    family, edition, release, build,
    architecture: '64 BIT',
    remoteOffice: OFFICES[i % OFFICES.length],
    agentVersion: AGENTS[i % AGENTS.length],
    health: i % 9 === 4 ? 'Warning' : i % 17 === 8 ? 'Critical' : 'Healthy',
    online: i % 7 !== 3,
    reboot: i % 8 === 2 ? 'Yes' : 'No',
    tags: i % 10 === 0 ? ['vip'] : [],
    specs,
  };
}

/* 46 machines: a majority still on Windows 10 (the estate an upgrade module
 * exists for), a Windows 11 population already ahead, and a few servers. */
export const FLEET: Endpoint[] = [
  ...Array.from({ length: 18 }, (_, i) => make(i, 'Windows 10', i % 3 === 0 ? 'Enterprise' : 'Pro', '22H2', 19045)),
  ...Array.from({ length: 6 }, (_, i) => make(18 + i, 'Windows 10', 'Pro', '21H2', 19044)),
  ...Array.from({ length: 9 }, (_, i) => make(24 + i, 'Windows 11', i % 2 === 0 ? 'Enterprise' : 'Pro', '24H2', 26100)),
  ...Array.from({ length: 6 }, (_, i) => make(33 + i, 'Windows 11', 'Enterprise', '25H2', 26200)),
  ...Array.from({ length: 4 }, (_, i) => make(39 + i, 'Windows Server 2019', 'Datacenter', '1809', 17763)),
  ...Array.from({ length: 3 }, (_, i) => make(43 + i, 'Windows Server 2022', 'Standard', '21H2', 20348)),
];

export const endpointById = (id: string) => FLEET.find((e) => e.id === id) ?? FLEET[0];

/** 'Microsoft Windows 11 Pro' — how the product names the installed OS. */
export const osNameOf = (e: Endpoint) => `Microsoft ${e.family} ${e.edition}`;
