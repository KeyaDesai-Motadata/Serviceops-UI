import { useEffect, useState } from 'react';
import { Shell } from './ui/Shell';
import { Dashboard } from './screens/Dashboard';
import { PatchesPage, type PatchTab } from './screens/PatchesPage';
import { OsUpgradeDetail } from './screens/OsUpgradeDetail';
import { EndpointsList } from './screens/EndpointsList';
import { EndpointDetail } from './screens/EndpointDetail';
import { DeploymentsList } from './screens/DeploymentsList';
import { DeploymentCreate } from './screens/DeploymentCreate';
import { DeploymentDetail } from './screens/DeploymentDetail';
import { AdminLayout } from './admin/AdminLayout';
import { AdminOsUpgrade } from './admin/AdminOsUpgrade';

/* Routing, the way the product works: the sidebar's Patch flyout opens one of
 * three LISTINGS, and a record is reached by clicking a row. There is no screen
 * switcher — a page you can only reach from a debug strip is not a page.
 *
 *   #/patches                  Patches | OS Upgrades
 *   #/patches/os-upgrades      the OS Upgrade tab
 *   #/patches/OSU-1            one image
 *   #/endpoints                endpoint listing
 *   #/endpoints/EP-16          one endpoint
 *   #/deployments              deployment listing
 *   #/deployments/new          create a run (?image=OSU-2 / ?endpoint=EP-16 prefill
 *                              an OS Upgrade run — the records' Deploy OS Upgrade)
 *   #/deployments/PDR-2041     one run
 *   #/admin/os-upgrade         Admin › Patch Management › OS Upgrade
 */

/* A dashboard widget drills into a listing WITH a filter already applied, so the
 * filter travels in the hash: the destination is a link the reader can bookmark
 * or send to whoever has to fix it, not a screen they arrive at and re-filter. */
type Route =
  | { page: 'dashboard' }
  | { page: 'patches'; tab: PatchTab }
  | { page: 'upgrade'; id: string; tab?: string; bucket?: string; q?: string }
  | { page: 'endpoints'; os?: string }
  | { page: 'endpoint'; id: string }
  | { page: 'deployments'; filter?: string }
  | { page: 'deployment-new'; image?: string; endpoint?: string }
  | { page: 'deployment'; id: string }
  | { page: 'admin'; module: 'os-upgrade' };

function parse(hash: string): Route {
  const [path, qs] = hash.replace(/^#\/?/, '').split('?');
  const p = new URLSearchParams(qs ?? '');
  const [a, b] = path.split('/').filter(Boolean);
  if (a === 'dashboard') return { page: 'dashboard' };
  /* Only one admin screen exists, so every admin address lands on it. */
  if (a === 'admin') return { page: 'admin', module: 'os-upgrade' };
  if (a === 'endpoints') return b ? { page: 'endpoint', id: b } : { page: 'endpoints', os: p.get('os') ?? undefined };
  if (a === 'deployments') {
    if (b === 'new') return { page: 'deployment-new', image: p.get('image') ?? undefined, endpoint: p.get('endpoint') ?? undefined };
    return b ? { page: 'deployment', id: b } : { page: 'deployments', filter: p.get('filter') ?? undefined };
  }
  if (a === 'patches') {
    if (!b) return { page: 'patches', tab: 'patches' };
    if (b === 'os-upgrades') return { page: 'patches', tab: 'os-upgrades' };
    return {
      page: 'upgrade', id: b,
      tab: p.get('tab') ?? undefined, bucket: p.get('bucket') ?? undefined, q: p.get('q') ?? undefined,
    };
  }
  return { page: 'patches', tab: 'os-upgrades' };
}

const query = (pairs: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(pairs).forEach(([k, v]) => { if (v) p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

const format = (r: Route): string => {
  switch (r.page) {
    case 'dashboard': return '#/dashboard';
    case 'admin': return `#/admin/${r.module}`;
    case 'endpoints': return `#/endpoints${query({ os: r.os })}`;
    case 'endpoint': return `#/endpoints/${r.id}`;
    case 'deployments': return `#/deployments${query({ filter: r.filter })}`;
    case 'deployment-new': return `#/deployments/new${query({ image: r.image, endpoint: r.endpoint })}`;
    case 'deployment': return `#/deployments/${r.id}`;
    case 'upgrade': return `#/patches/${r.id}${query({ tab: r.tab, bucket: r.bucket, q: r.q })}`;
    default: return r.tab === 'os-upgrades' ? '#/patches/os-upgrades' : '#/patches';
  }
};

/* Which sidebar entry the flyout should mark as current. Patches and
 * OS Upgrades are separate entries now, so the two patch tabs resolve to
 * different values — collapsing them would leave the marker on the wrong row. */
const moduleOf = (r: Route) =>
  r.page === 'dashboard' ? 'dashboard'
  : r.page === 'admin' ? 'admin'
  : r.page === 'endpoints' || r.page === 'endpoint' ? 'endpoints'
  : r.page.startsWith('deployment') ? 'deployments'
  : r.page === 'upgrade' || (r.page === 'patches' && r.tab === 'os-upgrades') ? 'os-upgrades'
  : 'patches';

export function App() {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));

  useEffect(() => {
    const onHash = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const canonical = format(route);
    if (window.location.hash !== canonical) window.history.replaceState(null, '', canonical);
  }, [route]);

  const go = (r: Route) => {
    const h = format(r);
    if (window.location.hash !== h) window.location.hash = h;
    else setRoute(r);
  };

  const navigate = (page: string) =>
    go(page === 'dashboard' ? { page: 'dashboard' }
      : page === 'admin' ? { page: 'admin', module: 'os-upgrade' }
      : page === 'endpoints' ? { page: 'endpoints' }
      : page === 'deployments' ? { page: 'deployments' }
      : page === 'os-upgrades' ? { page: 'patches', tab: 'os-upgrades' }
      : { page: 'patches', tab: 'patches' });

  return (
    <Shell page={moduleOf(route)} onNavigate={navigate} admin={route.page === 'admin'}>
      {route.page === 'admin' && (
        <AdminLayout active={route.module} onBack={() => go({ page: 'patches', tab: 'os-upgrades' })}>
          <AdminOsUpgrade />
        </AdminLayout>
      )}

      {route.page === 'dashboard' && (
        <Dashboard
          onOpenDeployments={(active) => go({ page: 'deployments', filter: active ? 'active' : undefined })}
          onOpenEndpoints={(os) => go({ page: 'endpoints', os })}
          onOpenCompatibility={(id, filter) => go(
            !filter ? { page: 'upgrade', id, tab: 'endpoint' }
              : filter === 'Compatible' || filter === 'Incompatible'
              ? { page: 'upgrade', id, tab: 'endpoint', bucket: filter }
              // Anything else is a prerequisite name, which narrows the
              // Incompatible bucket rather than replacing it.
              : { page: 'upgrade', id, tab: 'endpoint', bucket: 'Incompatible', q: filter },
          )}
        />
      )}

      {route.page === 'patches' && (
        <PatchesPage
          tab={route.tab}
          onOpen={(id, tab) => go({ page: 'upgrade', id, tab })}
        />
      )}

      {route.page === 'upgrade' && (
        <OsUpgradeDetail
          /* The key re-seeds the tab, bucket and search when a second
             drill-through lands on the page already showing the first. */
          key={`${route.id}|${route.tab ?? ''}|${route.bucket ?? ''}|${route.q ?? ''}`}
          id={route.id}
          initialTab={route.tab}
          initialBucket={route.bucket}
          initialQuery={route.q}
          onBack={() => go({ page: 'patches', tab: 'os-upgrades' })}
          onOpenRun={(runId) => go({ page: 'deployment', id: runId })}
          onDeploy={(image) => go({ page: 'deployment-new', image })}
        />
      )}

      {route.page === 'endpoints' && (
        <EndpointsList key={route.os ?? ''} osFilter={route.os} onOpen={(id) => go({ page: 'endpoint', id })} />
      )}

      {route.page === 'endpoint' && (
        <EndpointDetail
          onBack={() => go({ page: 'endpoints' })}
          onOpenUpgrade={(id) => go({ page: 'upgrade', id })}
          onDeploy={(endpoint, image) => go({ page: 'deployment-new', endpoint, image })}
        />
      )}

      {route.page === 'deployments' && (
        <DeploymentsList
          key={route.filter ?? ''}
          initialFilter={route.filter}
          onOpen={(id) => go({ page: 'deployment', id })}
          onCreate={() => go({ page: 'deployment-new' })}
        />
      )}

      {route.page === 'deployment-new' && (
        <DeploymentCreate
          key={`${route.image ?? ''}|${route.endpoint ?? ''}`}
          prefill={route.image || route.endpoint ? { image: route.image, endpoint: route.endpoint } : undefined}
          onBack={() => go({ page: 'deployments' })}
          onCreated={(id) => go({ page: 'deployment', id })}
        />
      )}

      {route.page === 'deployment' && (
        <DeploymentDetail
          id={route.id}
          onBack={() => go({ page: 'deployments' })}
          onOpenUpgrade={(id) => go({ page: 'upgrade', id })}
        />
      )}
    </Shell>
  );
}
