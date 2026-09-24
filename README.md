# OS Upgrade UI

A design prototype of **OS Upgrade** in Motadata ServiceOps, built in the
product's own UI language — icon rail, dark pill tabs, key-field grids, the
"Other Info" rail and the product's pagination.

**Live:** https://keyadesai-motadata.github.io/Serviceops-UI/

## Screens

Reached the way the product reaches them: hover the **Patch** icon in the left
rail and pick a sub-module. Records open by clicking a row.

| | |
| --- | --- |
| `#/patches` | Software Patches \| OS Upgrades |
| `#/patches/OSU-1` | one OS upgrade — Overview · Prerequisites · Endpoint · Installation · Audit Trail |
| `#/endpoints` | endpoint listing |
| `#/endpoints/EP-16` | one endpoint, with OS Upgrade as a fourth patch bucket |
| `#/deployments` | patch deployment listing |
| `#/deployments/new` | create a run |
| `#/deployments/PDR-2041` | one run — Analytics · Endpoint · Patches · Installation · Audit Trail |

## What the design says

- **An OS upgrade is a patch here** — same id space, same approval, same audit,
  reached from the same module. Only the fields differ.
- **End of Support replaces Severity.** An image carries no CVSS rating, and
  EOS is what actually makes an upgrade urgent.
- **Compatibility replaces Missing Endpoint.** A machine is not *missing* an
  operating system, it is *eligible* for one.
- **Fields with no answer are removed, not blanked.** A row that can only ever
  read `---` teaches a reader the page is broken.
- **Compatibility is evaluated, never stored**, so the Prerequisites tab and the
  Endpoint verdicts cannot disagree.

## Running it

```
pnpm install
pnpm dev      # http://localhost:5174
pnpm build
```

Mock data only — no backend.
