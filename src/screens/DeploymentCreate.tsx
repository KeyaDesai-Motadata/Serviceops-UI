import { useState } from 'react';
import { ChevronLeft, Plus, X, MonitorUp, Monitor, Building2, Check } from 'lucide-react';
import { IdPill } from '../ui/Table';
import { PickerDrawer } from '../ui/PickerDrawer';
import { OS_UPGRADES } from '../data/osUpgrade';

/* Patch Deployment — creation.
 *
 * ⚠️ Deployment Category is the field the whole form turns on. Choosing
 * "OS Upgrade" swaps the payload section from Patches to OS Upgrade Patches,
 * and that picker takes exactly ONE image: a run delivers a single operating
 * system, so the limit is enforced by the control rather than by an error
 * afterwards — picking a second replaces the first.
 */

type Category = 'Patch' | 'OS Upgrade';

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="mb-1.5 block text-[12px] text-label">
    {children}{required && <span className="ml-0.5 text-risk">*</span>}
  </label>
);

const field = 'h-9 w-full rounded-md border border-line bg-white px-2.5 text-[12.5px] text-value focus:border-link focus:outline-none';

export function DeploymentCreate({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const [category, setCategory] = useState<Category>('OS Upgrade');
  const [name, setName] = useState('Windows 11 25H2 — Finance rollout');
  const [image, setImage] = useState<string | null>('OSU-1');
  const [picking, setPicking] = useState(false);
  const [endpoints, setEndpoints] = useState(['EP-408', 'EP-406', 'EP-400']);
  const [offices, setOffices] = useState(['Ahmedabad HQ']);

  const picked = OS_UPGRADES.find((u) => u.id === image) ?? null;

  /* Only images that have actually landed can be deployed — a run built on one
     that never downloaded could not run. */
  const deployable = OS_UPGRADES.filter((u) => u.downloadStatus === 'Success');

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="border-b border-line px-5 py-5 last:border-0">
      <h2 className="mb-4 text-[13.5px] font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );

  const Chip = ({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) => (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-chip px-2 py-1 text-[12px] text-ink">
      {children}
      <button onClick={onRemove} className="text-label hover:text-risk"><X size={12} /></button>
    </span>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-line px-5 py-3">
        <button onClick={onBack} className="flex size-7 items-center justify-center rounded text-ink-soft hover:bg-strip">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-[16px] font-semibold text-ink">Create Patch Deployment</h1>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onBack} className="h-8 rounded-md border border-line px-3 text-[12.5px] font-medium text-ink-soft hover:bg-strip">Cancel</button>
          <button
            onClick={() => onCreated('PDR-2041')}
            disabled={!name.trim() || (category === 'OS Upgrade' && !image)}
            className="flex h-8 items-center gap-1.5 rounded-md bg-ink px-3 text-[12.5px] font-medium text-white enabled:hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check size={14} /> Create Deployment
          </button>
        </div>
      </div>

      <div className="scroll-y min-h-0 flex-1">
        <Section title="Deployment Details">
          <div className="grid max-w-[980px] grid-cols-3 gap-x-6 gap-y-4">
            <div className="col-span-2">
              <Label required>Deployment Name</Label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
            </div>
            <div>
              {/* The field the form turns on. */}
              <Label required>Deployment Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={field}>
                <option>Patch</option>
                <option>OS Upgrade</option>
              </select>
            </div>
            <div><Label>Deployment Policy</Label><select className={field}><option>Production Endpoints — Staged Rollout</option><option>Lab &amp; Build — Immediate</option></select></div>
            <div><Label>Install After</Label><input type="datetime-local" defaultValue="2026-09-27T15:30" className={field} /></div>
            <div><Label>Expiry Date</Label><input type="datetime-local" defaultValue="2026-10-10T23:59" className={field} /></div>
          </div>
        </Section>

        <Section title={category === 'OS Upgrade' ? 'OS Upgrade Patch' : 'Patches'}>
          {category === 'OS Upgrade' ? (
            <>
              <p className="mb-3 max-w-[70ch] text-[12.5px] text-label">
                A run delivers one operating system image. Choosing another replaces the one selected.
              </p>
              {picked ? (
                <div className="flex max-w-[980px] items-center gap-3 rounded-lg border border-line px-4 py-3">
                  <MonitorUp size={16} className="flex-none text-label" />
                  <IdPill>{picked.id}</IdPill>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-value">{picked.name}</span>
                  <span className="text-[12px] text-label">{picked.size}</span>
                  <button onClick={() => setPicking(true)} className="text-[12.5px] font-medium text-link hover:underline">Change OS Upgrade Patch</button>
                  <button onClick={() => setImage(null)} className="text-label hover:text-risk"><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => setPicking(true)} className="flex h-9 items-center gap-1.5 rounded-md border border-dashed border-line px-3 text-[12.5px] font-medium text-link hover:bg-strip">
                  <Plus size={14} /> Add OS upgrade patch
                </button>
              )}

            </>
          ) : (
            <button className="flex h-9 items-center gap-1.5 rounded-md border border-dashed border-line px-3 text-[12.5px] font-medium text-link hover:bg-strip">
              <Plus size={14} /> Add patches
            </button>
          )}
        </Section>

        <Section title="Target">
          <div className="grid max-w-[980px] grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <Label>Endpoints</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {endpoints.map((e) => (
                  <Chip key={e} onRemove={() => setEndpoints(endpoints.filter((x) => x !== e))}>
                    <Monitor size={12} className="text-label" />{e}
                  </Chip>
                ))}
                <button className="flex h-7 items-center gap-1 rounded-md border border-dashed border-line px-2 text-[12px] text-link hover:bg-strip">
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
            <div>
              <Label>Remote Offices</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {offices.map((o) => (
                  <Chip key={o} onRemove={() => setOffices(offices.filter((x) => x !== o))}>
                    <Building2 size={12} className="text-label" />{o}
                  </Chip>
                ))}
                <button className="flex h-7 items-center gap-1 rounded-md border border-dashed border-line px-2 text-[12px] text-link hover:bg-strip">
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Options">
          <div className="grid max-w-[980px] grid-cols-3 gap-x-6 gap-y-4">
            <div><Label>Notify To</Label><input defaultValue="IT Support Team" className={field} /></div>
            <div><Label>Retry Failed Configuration</Label><select className={field}><option>Enabled</option><option>Disabled</option></select></div>
            <div><Label>Reboot Behaviour</Label><select className={field}><option>Prompt the logged-in user</option><option>Force after install</option><option>Do not reboot</option></select></div>
          </div>
          {category === 'OS Upgrade' && (
            <p className="mt-4 max-w-[70ch] rounded-md bg-warn-soft px-3 py-2 text-[12px] text-warn">
              An OS upgrade replaces the running operating system and always requires a restart.
              Endpoints that fail a prerequisite are skipped rather than attempted.
            </p>
          )}
        </Section>
      </div>

      {/* The picker is a side drawer over a scrim — the product's "Add …" pattern.
          `single` locks the rest of the list once one image is chosen. */}
      <PickerDrawer
        open={picking}
        title="OS Upgrade Patches"
        subtitle="A run delivers one operating system image. Only images that have downloaded can be deployed."
        rows={deployable.map((u) => ({ id: u.id, name: u.name, meta: u.size }))}
        selected={image ? [image] : []}
        single
        onClose={() => setPicking(false)}
        onApply={(ids) => setImage(ids[0] ?? null)}
      />
    </div>
  );
}
