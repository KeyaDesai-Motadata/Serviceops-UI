import { useEffect, useState } from 'react';
import { Shell } from './ui/Shell';
import { PatchesPage, type PatchTab } from './screens/PatchesPage';
import { OsUpgradeDetail } from './screens/OsUpgradeDetail';
import { EndpointsList } from './screens/EndpointsList';
import { EndpointDetail } from './screens/EndpointDetail';
import { DeploymentsList } from './screens/DeploymentsList';
import { DeploymentCreate } from './screens/DeploymentCreate';
import { DeploymentDetail } from './screens/DeploymentDetail';

/* Routing, the way the product works: the sidebar's Patch flyout opens one of
 * three LISTINGS, and a record is reached by clicking a row. There is no screen
 * switcher — a page you can only reach from a debug strip is not a page.
 *
 *   #/patches                  Software Patches | OS Upgrades
 *   #/patches/os-upgrades      the OS Upgrade tab
 *   #/patches/OSU-1            one image
 *   #/endpoints                endpoint listing
 *   #/endpoints/EP-16          one endpoint
 *   #/deployments              deployment listing
 *   #/deployments/new          create a run
 *   #/deployments/PDR-2041     one run
 */

type Route =
  | { page: 'patches'; tab: PatchTab }
  | { page: 'upgrade'; id: string }
  | { page: 'endpoints' }
  | { page: 'endpoint'; id: string }
  | { page: 'deployments' }
  | { page: 'deployment-new' }
  | { page: 'deployment'; id: string };

function parse(hash: string): Route {
  const [a, b] = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (a === 'endpoints') return b ? { page: 'endpoint', id: b } : { page: 'endpoints' };
  if (a === 'deployments') {
    if (b === 'new') return { page: 'deployment-new' };
    return b ? { page: 'deployment', id: b } : { page: 'deployments' };
  }
  if (a === 'patches') {
    if (!b) return { page: 'patches', tab: 'patches' };
    if (b === 'os-upgrades') return { page: 'patches', tab: 'os-upgrades' };
    return { page: 'upgrade', id: b };
  }
  return { page: 'patches', tab: 'os-upgrades' };
}

const format = (r: Route): string => {
  switch (r.page) {
    case 'endpoints': return '#/endpoints';
    case 'endpoint': return `#/endpoints/${r.id}`;
    case 'deployments': return '#/deployments';
    case 'deployment-new': return '#/deployments/new';
    case 'deployment': return `#/deployments/${r.id}`;
    case 'upgrade': return `#/patches/${r.id}`;
    default: return r.tab === 'os-upgrades' ? '#/patches/os-upgrades' : '#/patches';
  }
};

/** Which patch sub-page the sidebar flyout should mark as current. */
const moduleOf = (r: Route) =>
  r.page === 'endpoints' || r.page === 'endpoint' ? 'endpoints'
  : r.page.startsWith('deployment') ? 'deployments'
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
    go(page === 'endpoints' ? { page: 'endpoints' }
      : page === 'deployments' ? { page: 'deployments' }
      : { page: 'patches', tab: 'patches' });

  return (
    <Shell page={moduleOf(route)} onNavigate={navigate}>
      {route.page === 'patches' && (
        <PatchesPage
          tab={route.tab}
          onTab={(t) => go({ page: 'patches', tab: t })}
          onOpen={(id) => go({ page: 'upgrade', id })}
        />
      )}

      {route.page === 'upgrade' && (
        <OsUpgradeDetail
          id={route.id}
          onBack={() => go({ page: 'patches', tab: 'os-upgrades' })}
          onOpenRun={(runId) => go({ page: 'deployment', id: runId })}
        />
      )}

      {route.page === 'endpoints' && <EndpointsList onOpen={(id) => go({ page: 'endpoint', id })} />}

      {route.page === 'endpoint' && (
        <EndpointDetail
          onBack={() => go({ page: 'endpoints' })}
          onOpenUpgrade={(id) => go({ page: 'upgrade', id })}
        />
      )}

      {route.page === 'deployments' && (
        <DeploymentsList
          onOpen={(id) => go({ page: 'deployment', id })}
          onCreate={() => go({ page: 'deployment-new' })}
        />
      )}

      {route.page === 'deployment-new' && (
        <DeploymentCreate
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
