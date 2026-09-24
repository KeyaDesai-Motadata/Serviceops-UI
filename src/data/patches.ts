/* The software-patch side of the Patches page. Only enough rows to make the
 * first tab real — the OS Upgrade tab is what this project is about. */

export interface Patch {
  id: string; name: string; severity: string; severityColor: string;
  releaseDate: string; missing: number | null; installed: number | null;
  reboot: string; approval: 'Approved' | 'Not Approved';
}

export const PATCHES: Patch[] = [
  { id: 'PCH-4834', name: 'Manual Patch — Internal Tooling Hotfix', severity: 'Critical', severityColor: '#DC2626', releaseDate: 'Wed, Jul 08, 2026 03:24 PM', missing: null, installed: null, reboot: 'Yes', approval: 'Approved' },
  { id: 'PCH-4833', name: 'Update for Microsoft 365 Apps (MonthlyEnterpriseChannel) Version 2404', severity: 'Low', severityColor: '#111827', releaseDate: 'Tue, Apr 14, 2026 04:55 PM', missing: null, installed: 1, reboot: 'No', approval: 'Not Approved' },
  { id: 'PCH-4811', name: '2026-04 Cumulative Update for Windows 11 Version 23H2 for x64 (KB5036894)', severity: 'Critical', severityColor: '#DC2626', releaseDate: 'Tue, Apr 14, 2026 05:00 PM', missing: 12, installed: 1, reboot: 'May be', approval: 'Not Approved' },
  { id: 'PCH-4792', name: 'Mozilla Firefox 125.0.2 Security & Stability Update', severity: 'Important', severityColor: '#D97706', releaseDate: 'Mon, Apr 21, 2026 11:00 AM', missing: 5, installed: 3, reboot: 'No', approval: 'Approved' },
  { id: 'PCH-4790', name: 'Adobe Acrobat Reader DC 2024.002.20933 Security Update', severity: 'Critical', severityColor: '#DC2626', releaseDate: 'Tue, Apr 08, 2026 09:30 PM', missing: 11, installed: 4, reboot: 'No', approval: 'Approved' },
  { id: 'PCH-4785', name: 'Microsoft Defender Antimalware Platform Update 4.18.24030', severity: 'Moderate', severityColor: '#EAB308', releaseDate: 'Wed, Apr 02, 2026 07:15 AM', missing: 1, installed: 22, reboot: 'No', approval: 'Approved' },
  { id: 'PCH-4763', name: 'PuTTY 0.81 Security Update (CVE-2024-31497)', severity: 'Critical', severityColor: '#DC2626', releaseDate: 'Mon, Apr 15, 2026 05:40 PM', missing: 3, installed: 1, reboot: 'No', approval: 'Not Approved' },
];
