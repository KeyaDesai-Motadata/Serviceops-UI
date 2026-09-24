/* Patch Deployment mock data — the run, and the endpoints it targeted.
 *
 * A deployment carries a Deployment Category: Patch or OS Upgrade. That one
 * field decides what the run delivers, and therefore what every other field on
 * the page means, which is why it leads the record. */

export type DeploymentCategory = 'Patch' | 'OS Upgrade';

export interface Deployment {
  id: string;
  name: string;
  category: DeploymentCategory;
  status: string;
  statusColor: string;
  policy: string;
  installAfter: string;
  expiryDate: string;
  remoteOffices: string;
  notifyTo: string;
  retry: string;
  createdBy: string;
  createdOn: string;
  lastUpdated: string;
  /** The OS image this run delivers, for an OS Upgrade run. */
  payloadId: string;
  payloadName: string;
  targeted: number;
  success: number;
  failed: number;
  inProgress: number;
}

export const DEPLOYMENTS: Deployment[] = [
  {
    id: 'PDR-2041', name: 'Windows 11 25H2 — Finance rollout', category: 'OS Upgrade',
    status: 'In Progress', statusColor: '#D97706',
    policy: 'Production Endpoints — Staged Rollout',
    installAfter: 'Sun, Sep 27, 2026 03:30 PM', expiryDate: 'Sat, Oct 10, 2026 11:59 PM',
    remoteOffices: 'Ahmedabad HQ, Mumbai Office', notifyTo: 'IT Support Team',
    retry: 'Enabled', createdBy: 'Rakesh Rathod', createdOn: 'Mon, Sep 21, 2026 05:24 PM',
    lastUpdated: 'Thu, Sep 24, 2026 09:12 AM',
    payloadId: 'OSU-1', payloadName: 'Windows 11 (25H2) Enterprise (x64)',
    targeted: 42, success: 28, failed: 3, inProgress: 11,
  },
  {
    id: 'PDR-2038', name: 'Ubuntu 22.04 LTS — build agents', category: 'OS Upgrade',
    status: 'Ready to Deploy', statusColor: '#2563EB',
    policy: 'Lab & Build — Immediate',
    installAfter: 'Mon, Sep 28, 2026 01:00 AM', expiryDate: '---',
    remoteOffices: 'Pune Development Center', notifyTo: 'Platform Engineering',
    retry: 'Enabled', createdBy: 'Neha Raje', createdOn: 'Tue, Sep 22, 2026 11:40 AM',
    lastUpdated: 'Tue, Sep 22, 2026 11:40 AM',
    payloadId: 'OSU-2', payloadName: 'Ubuntu Server 22.04.4 LTS (x64)',
    targeted: 18, success: 0, failed: 0, inProgress: 0,
  },
  {
    id: 'PDR-2029', name: 'September security rollup', category: 'Patch',
    status: 'Completed', statusColor: '#16A34A',
    policy: 'Production Endpoints — Staged Rollout',
    installAfter: 'Tue, Sep 08, 2026 10:00 PM', expiryDate: 'Tue, Sep 22, 2026 11:59 PM',
    remoteOffices: 'All offices', notifyTo: 'IT Support Team',
    retry: 'Enabled', createdBy: 'System', createdOn: 'Mon, Sep 07, 2026 06:00 PM',
    lastUpdated: 'Wed, Sep 23, 2026 02:15 AM',
    payloadId: 'PCH-4811', payloadName: '2026-09 Cumulative Update for Windows 11',
    targeted: 264, success: 251, failed: 9, inProgress: 0,
  },
];

export const deploymentById = (id: string) => DEPLOYMENTS.find((d) => d.id === id) ?? DEPLOYMENTS[0];

export interface DeployedEndpoint {
  id: string; hostName: string; ip: string; remoteOffice: string;
  status: 'Success' | 'Failed' | 'In Progress' | 'Yet to Receive';
  deployedOn: string; retryCount: number; reason: string;
}

const OFFICES = ['Ahmedabad HQ', 'Mumbai Office', 'Pune Development Center', 'Bengaluru Campus'];
const FAIL = ['Insufficient free disk on the system volume',
  'Agent went offline mid-transfer', 'Restart was deferred by the logged-in user'];

export function endpointsForRun(d: Deployment): DeployedEndpoint[] {
  const n = Math.min(d.targeted, 20);
  return Array.from({ length: n }, (_, i) => {
    const status: DeployedEndpoint['status'] =
      i < Math.round((d.success / d.targeted) * n) ? 'Success'
      : i < Math.round(((d.success + d.failed) / d.targeted) * n) ? 'Failed'
      : d.inProgress > 0 ? 'In Progress' : 'Yet to Receive';
    return {
      id: `EP-${400 + i * 2}`,
      hostName: ['FIN-LT-0188', 'SAL-LT-0204', 'ENG-LT-0312', 'HR-DT-0142', 'DEV-BOX-03'][i % 5] + (i > 4 ? `-${i}` : ''),
      ip: `10.20.${22 + (i % 4)}.${((i * 13) % 200) + 20}`,
      remoteOffice: OFFICES[i % OFFICES.length],
      status,
      deployedOn: status === 'Yet to Receive' ? '---' : `Wed, Sep 23, 2026 ${String(1 + (i % 9)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')} AM`,
      retryCount: status === 'Failed' ? (i % 2) + 1 : 0,
      reason: status === 'Failed' ? FAIL[i % FAIL.length] : '',
    };
  });
}
