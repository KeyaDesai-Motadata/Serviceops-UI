import type { InstallRow } from '../ui/InstallationTab';
import type { OsUpgrade } from './osUpgrade';
import { endpointsFor } from './osUpgrade';

/* Installation rows for one image — the endpoints a deployment has actually
 * touched, not the whole eligible fleet. Only compatible machines are ever
 * attempted, which is why an incompatible endpoint never appears here. */
export function installRowsFor(u: OsUpgrade): InstallRow[] {
  return endpointsFor(u)
    .filter((e) => e.status === 'Compatible')
    .slice(0, 12)
    .map((e, i): InstallRow => {
      const installStatus = i % 5 === 0 ? 'Failed' : i % 3 === 0 ? 'In Progress' : i < 6 ? 'Success' : 'Not Ready';
      return {
        id: e.endpointId,
        hostName: e.hostName,
        ip: e.ipAddress,
        configType: 'Install',
        deploymentDate: installStatus === 'Not Ready' ? null : `Wed, Sep 23, 2026 0${1 + (i % 8)}:${String((i * 11) % 60).padStart(2, '0')} AM`,
        installStatus,
        retry: installStatus === 'Failed' ? (i % 2) + 1 : 0,
        downloadStatus: installStatus === 'Not Ready' ? 'Pending' : 'Success',
        taskType: 'Auto Patch Deploy Task',
        online: installStatus !== 'Not Ready',
      };
    });
}
