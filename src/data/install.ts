import type { InstallRow } from '../ui/InstallationTab';
import { eligibleFor, type OsUpgrade } from './osUpgrade';

/* Only machines that were actually attempted — a compatible endpoint. */
export function installRowsFor(u: OsUpgrade): InstallRow[] {
  return eligibleFor(u)
    .filter((r) => r.verdict === 'Compatible')
    .slice(0, 12)
    .map((r, i): InstallRow => {
      const installStatus = i % 5 === 0 ? 'Failed' : i % 3 === 0 ? 'In Progress' : i < 6 ? 'Success' : 'Not Ready';
      return {
        id: r.endpoint.id,
        hostName: r.endpoint.hostName,
        ip: r.endpoint.ip,
        configType: 'Install',
        deploymentDate: installStatus === 'Not Ready' ? null
          : `Wed, Sep 23, 2026 0${1 + (i % 8)}:${String((i * 11) % 60).padStart(2, '0')} AM`,
        installStatus,
        retry: installStatus === 'Failed' ? (i % 2) + 1 : 0,
        downloadStatus: installStatus === 'Not Ready' ? 'Pending' : 'Success',
        taskType: 'Auto Patch Deploy Task',
        online: installStatus !== 'Not Ready',
      };
    });
}
