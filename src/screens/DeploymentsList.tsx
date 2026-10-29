import { useState } from 'react';
import { DataTable, Pagination, IdPill, ListingHeader, KpiStrip, Toolbar, FilterChip, type Column, type KpiCard } from '../ui/Table';
import { Dot, Dash } from '../ui/Detail';
import { DEPLOYMENTS, type Deployment } from '../data/deployment';

/* Patch Deployment listing.
 *
 * The saved views are the product's, and OS Upgrade Deployments is one of them
 * — a run's Deployment Category is what the view filters on, which is why that
 * column leads the record rather than sitting among the details. In the new UI
 * the active view's name IS the page title, with the picker behind its chevron. */

/* An OS Upgrade run is ACTIVE while any endpoint is still moving — ready to
 * deploy, downloading, downloaded or in progress. A run whose header reads
 * Completed is finished, so it is not in this view even if a retry is pending. */
const ACTIVE = ['Ready to deploy', 'Ready to Deploy', 'Downloading', 'Downloaded', 'In Progress'];

const VIEWS = [
  { id: 'all', label: 'All Deployments', match: () => true },
  { id: 'os-upgrade', label: 'OS Upgrade Deployments', match: (d: Deployment) => d.category === 'OS Upgrade' },
  /* Not offered in the view picker (removed 29 Oct 2026) — kept only as the
     target of the OS Upgrade Dashboard's "Active OS Upgrade Deployments" KPI,
     where it shows as the View chip so the list still matches the number. */
  { id: 'active', label: 'Active OS Upgrade Deployments', hidden: true, match: (d: Deployment) => d.category === 'OS Upgrade' && ACTIVE.includes(d.status) },
  { id: 'pending', label: 'Pending', match: (d: Deployment) => d.status !== 'Completed' },
  { id: 'draft', label: 'Draft', match: (d: Deployment) => d.status === 'Draft' },
];

/** The status palette moved to the new UI's hues; the labels are the run's own. */
const STATUS_COLOR: Record<string, string> = {
  'In Progress': '#F59E0B', 'Ready to Deploy': '#3D8BD0', Downloading: '#3D8BD0', Completed: '#22C55E',
};
export const statusColor = (d: Deployment) => STATUS_COLOR[d.status] ?? d.statusColor;

export function DeploymentsList({ onOpen, onCreate, initialFilter }: {
  onOpen: (id: string) => void; onCreate: () => void; initialFilter?: string;
}) {
  const [q, setQ] = useState('');
  const [view, setView] = useState(() => VIEWS.find((v) => v.id === initialFilter) ?? VIEWS[1]);
  const [kpi, setKpi] = useState<string | null>(null);

  const KPIS: Record<string, (d: Deployment) => boolean> = {
    'In Progress': (d) => d.status === 'In Progress' || d.status === 'Downloading',
    'Ready to Deploy': (d) => d.status === 'Ready to Deploy',
    'Completed': (d) => d.status === 'Completed',
    'With Failures': (d) => d.failed > 0,
  };

  const query = q.trim().toLowerCase();
  const rows = DEPLOYMENTS.filter(view.match).filter((d) => !kpi || KPIS[kpi](d)).filter((d) =>
    !query || d.id.toLowerCase().includes(query) || d.name.toLowerCase().includes(query) ||
    d.category.toLowerCase().includes(query) || d.status.toLowerCase().includes(query));

  const inView = DEPLOYMENTS.filter(view.match);
  const cards: KpiCard[] = Object.entries(KPIS).map(([label, test]) => {
    const hits = inView.filter(test);
    return {
      label, value: hits.length, active: kpi === label,
      color: hits.length ? { 'In Progress': '#B45309', 'Ready to Deploy': '#3D8BD0', Completed: '#22A06B', 'With Failures': '#DC2626' }[label] : undefined,
      sub: label === 'With Failures'
        ? `${hits.reduce((s, d) => s + d.failed, 0)} endpoints failed`
        : `${hits.reduce((s, d) => s + d.targeted, 0)} endpoints targeted`,
      onClick: () => setKpi(kpi === label ? null : label),
    };
  });

  const cols: Column<Deployment>[] = [
    { key: 'id', header: 'ID', cell: (d) => <IdPill>{d.id}</IdPill> },
    { key: 'name', header: 'Name', cell: (d) => d.name },
    { key: 'cat', header: 'Deployment Category', cell: (d) => d.category },
    { key: 'status', header: 'Status', cell: (d) => <Dot color={statusColor(d)}>{d.status}</Dot> },
    { key: 'policy', header: 'Deployment Policy', cell: (d) => d.policy },
    { key: 'targeted', header: 'Targeted', cell: (d) => d.targeted },
    { key: 'after', header: 'Install After', cell: (d) => d.installAfter },
    { key: 'expiry', header: 'Expiry Date', cell: (d) => d.expiryDate === '---' ? <Dash /> : d.expiryDate },
  ];

  return (
    <div className="flex h-full flex-col">
      <ListingHeader
        title="Patch Deployment"
        views={VIEWS.filter((v) => !('hidden' in v && v.hidden))}
        view={view.id}
        onView={(id) => { setView(VIEWS.find((v) => v.id === id) ?? VIEWS[0]); setKpi(null); }}
        cta={{ label: 'Create', onClick: onCreate }}
      />
      <KpiStrip cards={cards} />
      <Toolbar search={q} onSearch={setQ} placeholder="Search deployment, category, status..." more={false}>
        {/* The active view as a removable chip, so what is being hidden is never invisible. */}
        {view.id !== 'all' && <FilterChip label="View" value={view.label} onClear={() => setView(VIEWS[0])} />}
        {kpi && <FilterChip label="Showing" value={kpi} onClear={() => setKpi(null)} />}
      </Toolbar>
      <DataTable columns={cols} rows={rows} rowKey={(d) => d.id} onRowClick={(d) => onOpen(d.id)} empty="No deployments found." />
      <Pagination total={rows.length} />
    </div>
  );
}
