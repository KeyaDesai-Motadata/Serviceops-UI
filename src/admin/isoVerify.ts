/* What an OS upgrade's creator DECLARES, what the uploaded ISO actually
 * CONTAINS, and the comparison between the two.
 *
 * Every declared field is one the ISO records about itself, so each one can be
 * checked rather than trusted:
 *
 *   Operating System  install.wim image NAME / installation type (Client|Server)
 *   Version           DisplayVersion (ReleaseId on 1809) in the image's
 *                     offline SOFTWARE registry hive
 *   Edition           EDITIONID of each image index — a multi-edition ISO
 *                     carries several, and any one of them satisfies the field
 *   Architecture      the WIM's ARCHITECTURE (x64 / x86 / ARM64)
 *   Language          the image's default LANGUAGE (en-US …)
 *   Build             the WIM VERSION 10.0.<build> — read and shown, not asked:
 *                     nobody types it correctly, and Version already pins it
 *
 * In the product the backend runs `DISM /Get-WimInfo` (+ the offline registry
 * read) on the file server after the transfer. In this prototype the metadata
 * is inferred from the FILE NAME, so a demo can make a match or a mismatch at
 * will: "Win11_24H2_English_x64.iso" reads as Windows 11 24H2 consumer
 * editions, en-US, x64. */

/* Windows 10 and 11 only (29 Oct 2026). A server ISO is still READ correctly, so
   uploading one simply fails validation on Operating System. */
export const OS_FAMILIES = ['Windows 11', 'Windows 10'] as const;

export const isServer = (os: string) => os.startsWith('Windows Server');

/* Every Windows 10 / 11 client edition EXCEPT the Enterprise family (Enterprise,
   Enterprise N, Enterprise LTSC, IoT Enterprise), which is deliberately not offered
   (29 Oct 2026), and Windows 11 SE, which ships only pre-installed on school
   devices — there is no SE ISO to upload. The N editions are the EU builds
   without media features. */
export const CLIENT_EDITIONS = [
  'Home', 'Home N', 'Home Single Language',
  'Pro', 'Pro N', 'Pro Education', 'Pro Education N', 'Pro for Workstations', 'Pro for Workstations N',
  'Education', 'Education N',
];
export const SERVER_EDITIONS = ['Standard', 'Datacenter'];
export const editionsFor = (os: string) => (isServer(os) ? SERVER_EDITIONS : CLIENT_EDITIONS);

export const ARCHITECTURES = ['x64', 'x86', 'ARM64'] as const;

/* English only is supported (29 Oct 2026) — Microsoft ships it as two ISOs,
   "English" (en-US) and "English International" (en-GB). */
export const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (International)' },
];
/* Names for what an ISO may CONTAIN — wider than what can be chosen, so a
   French ISO is reported as French when it fails validation. */
const KNOWN_LANGUAGES: Record<string, string> = {
  'fr-FR': 'French', 'de-DE': 'German', 'es-ES': 'Spanish', 'ja-JP': 'Japanese', 'zh-CN': 'Chinese (Simplified)',
};
export const languageLabel = (code: string) => LANGUAGES.find((l) => l.code === code)?.label ?? KNOWN_LANGUAGES[code] ?? code;

/** The build each feature update ships on — only used to SHOW the detected build. */
const BUILDS: Record<string, number> = {
  'Windows 11|21H2': 22000, 'Windows 11|22H2': 22621, 'Windows 11|23H2': 22631,
  'Windows 11|24H2': 26100, 'Windows 11|25H2': 26200,
  'Windows 10|21H2': 19044, 'Windows 10|22H2': 19045,
  'Windows Server 2025|24H2': 26100, 'Windows Server 2022|21H2': 20348, 'Windows Server 2019|1809': 17763,
};

const DEFAULT_VERSION: Record<string, string> = {
  'Windows 11': '24H2', 'Windows 10': '22H2',
  'Windows Server 2025': '24H2', 'Windows Server 2022': '21H2', 'Windows Server 2019': '1809',
};

export interface Declared {
  os: string; version: string; edition: string; arch: string; language: string;
}

export interface Detected {
  os: string; version: string; build: number | null; editions: string[];
  arch: string; language: string;
}

/** Prototype stand-in for reading install.wim — see the header comment. */
export function detectFromFileName(fileName: string): Detected {
  const n = fileName.toLowerCase();

  const os =
    /server[\s_-]*2025/.test(n) ? 'Windows Server 2025'
    : /server[\s_-]*2022/.test(n) ? 'Windows Server 2022'
    : /server[\s_-]*2019/.test(n) ? 'Windows Server 2019'
    : /win(dows)?[\s_-]*10/.test(n) ? 'Windows 10'
    : 'Windows 11';

  const version = (/(\d{2}h\d)/.exec(n)?.[1] ?? (/1809/.test(n) ? '1809' : DEFAULT_VERSION[os])).toUpperCase();

  const arch = /arm64/.test(n) ? 'ARM64' : /x86|32[\s_-]*bit/.test(n) ? 'x86' : 'x64';

  const language =
    /englishinternational|en-gb|english[\s_-]*uk/.test(n) ? 'en-GB'
    : /french|fr-fr/.test(n) ? 'fr-FR'
    : /german|de-de/.test(n) ? 'de-DE'
    : /spanish|es-es/.test(n) ? 'es-ES'
    : /japanese|ja-jp/.test(n) ? 'ja-JP'
    : /chinese|zh-cn/.test(n) ? 'zh-CN'
    : 'en-US';

  /* Which editions the WIM indexes hold. Microsoft's own media is mostly
     multi-edition: the consumer ISO carries Home…Pro for Workstations, the
     business (VL) ISO Pro / Education / Enterprise. A single-edition name
     narrows it to that one. */
  const editions = isServer(os)
    ? (/datacenter/.test(n) && !/standard/.test(n) ? ['Datacenter'] : /standard/.test(n) && !/datacenter/.test(n) ? ['Standard'] : SERVER_EDITIONS)
    : /business/.test(n) ? ['Pro', 'Pro N', 'Pro Education', 'Pro Education N', 'Pro for Workstations', 'Pro for Workstations N', 'Education', 'Education N', 'Enterprise', 'Enterprise N']
    : /enterprise/.test(n) ? ['Enterprise']
    : /pro[\s_-]*education/.test(n) ? ['Pro Education']
    : /workstation/.test(n) ? ['Pro for Workstations']
    : /education/.test(n) ? ['Education']
    : /_pro_|[\s_-]pro[\s_.-]/.test(n) ? ['Pro']
    : /home/.test(n) ? ['Home']
    : ['Home', 'Home N', 'Home Single Language', 'Education', 'Education N', 'Pro', 'Pro N', 'Pro Education', 'Pro Education N', 'Pro for Workstations', 'Pro for Workstations N'];

  return { os, version, build: BUILDS[`${os}|${version}`] ?? null, editions, arch, language };
}

export interface CheckRow {
  label: string;
  declared: string;
  found: string;
  ok: boolean;
  /** Where in the ISO the value is read from — shown so a mismatch can be trusted. */
  source: string;
}

export function compare(d: Declared, x: Detected): CheckRow[] {
  return [
    { label: 'Operating System', declared: d.os, found: x.os, ok: d.os === x.os, source: 'install.wim · image name' },
    { label: 'Version', declared: d.version.trim().toUpperCase() || '—', found: x.version, ok: d.version.trim().toUpperCase() === x.version, source: 'image registry · DisplayVersion' },
    { label: 'Edition', declared: d.edition, found: x.editions.join(', '), ok: x.editions.includes(d.edition), source: 'install.wim · EditionID per index' },
    { label: 'Architecture', declared: d.arch, found: x.arch, ok: d.arch === x.arch, source: 'install.wim · architecture' },
    { label: 'Language', declared: languageLabel(d.language), found: languageLabel(x.language), ok: d.language === x.language, source: 'install.wim · default language' },
  ];
}
