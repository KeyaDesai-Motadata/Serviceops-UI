import { useState } from 'react';
import { Download, RefreshCw, Columns3, FileText, ChevronDown, Plus, Check } from 'lucide-react';
import { DataTable, Pagination, SearchBar, IdPill, type Column } from '../ui/Table';
import { Dot, Dash } from '../ui/Detail';
import { DEPLOYMENTS, type Deployment } from '../data/deployment';

/* Patch Deployment listing.
 *
 * The saved views are the product's, and OS Upgrade Deployments is one of them
 * — a run's Deployment Category is what the view filters on, which is why that
 * column leads the record rather than sitting among the details. */

const VIEWS = [
  { id: 'all', label: 'All Deployments', match: () => true },
  { id: 'os-upgrade', label: 'OS Upgrade Deployments', match: (d: Deployment) => d.category === 'OS Upgrade' },
  { id: 'pending', label: 'Pending', match: (d: Deployment) => d.status !== 'Completed' },
  { id: 'draft', label: 'Draft', match: (d: Deployment) => d.status === 'Draft' },
];

export function DeploymentsList({ onOpen, onCreate }: { onOpen: (id: string) => void; onCreate: () => void }) {
  const [q, setQ] = useState('');
  const [view, setView] = useState(VIEWS[1]);
  const [menu, setMenu] = useState(false);

  const query = q.trim().toLowerCase();
  const rows = DEPLOYMENTS.filter(view.match).filter((d) =>
    !query || d.id.toLowerCase().includes(query) || d.name.toLowerCase().includes(query) ||
    d.category.toLowerCase().includes(query) || d.status.toLowerCase().includes(query));

  const cols: Column<Deployment>[] = [
    { key: 'id', header: 'ID', cell: (d) => <button onClick={() => onOpen(d.id)}><IdPill>{d.id}</IdPill></button> },
    { key: 'name', header: 'Name', cell: (d) => (
      <button onClick={() => onOpen(d.id)} className="text-left hover:text-link">{d.name}</button>
    ) },
    { key: 'cat', header: 'Deployment Category', cell: (d) => d.category },
    { key: 'status', header: 'Status', cell: (d) => (
      <Dot color={d.statusColor}><span style={{ color: d.statusColor }}>{d.status}</span></Dot>
    ) },
    { key: 'policy', header: 'Deployment Policy', cell: (d) => d.policy },
    { key: 'targeted', header: 'Targeted', cell: (d) => d.targeted },
    { key: 'after', header: 'Install After', cell: (d) => d.installAfter },
    { key: 'expiry', header: 'Expiry Date', cell: (d) => d.expiryDate === '---' ? <Dash /> : d.expiryDate },
  ];

  const IconBtn = ({ icon: Icon, title }: { icon: typeof Download; title: string }) => (
    <button title={title} className="flex size-8 items-center justify-center rounded-md text-ink-soft hover:bg-strip">
      <Icon size={15} />
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b border-line px-5 py-3">
        <h1 className="text-[17px] font-semibold text-ink">Patch Deployment</h1>

        <div className="relative">
          <button
            onClick={() => setMenu((v) => !v)}
            className="flex items-center gap-1 text-[13px] font-medium text-ink hover:text-link"
          >
            {view.label} <ChevronDown size={15} className="text-label" />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 w-[240px] rounded-lg border border-line bg-white py-1 shadow-lg">
                {VIEWS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setView(v); setMenu(false); }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] ${
                      v.id === view.id ? 'bg-chip font-medium text-ink' : 'text-value hover:bg-strip'
                    }`}
                  >
                    <span className="w-4">{v.id === view.id && <Check size={13} />}</span>
                    {v.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <IconBtn icon={FileText} title="Export" />
          <IconBtn icon={Download} title="Download" />
          <IconBtn icon={RefreshCw} title="Refresh" />
          <IconBtn icon={Columns3} title="Columns" />
          <button
            onClick={onCreate}
            className="ml-1.5 flex h-8 items-center gap-1.5 rounded-md bg-ink px-3 text-[12.5px] font-medium text-white hover:bg-ink-soft"
          >
            <Plus size={14} /> Create Deployment
          </button>
        </div>
      </div>

      {/* The active view shown as a removable chip, so what is being hidden is
          never invisible. */}
      {view.id !== 'all' && (
        <div className="flex items-center gap-2 px-5 pt-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-chip px-2 py-1 text-[11.5px] text-ink">
            {view.label}
            <button onClick={() => setView(VIEWS[0])} className="text-label hover:text-risk">×</button>
          </span>
        </div>
      )}

      <div className="px-5 py-3"><SearchBar value={q} onChange={setQ} /></div>
      <DataTable columns={cols} rows={rows} rowKey={(d) => d.id} empty="No deployments found." />
      <Pagination total={rows.length} noun="items" />
    </div>
  );
}
