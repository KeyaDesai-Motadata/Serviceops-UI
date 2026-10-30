# OS Upgrade UI — new ServiceOps look

The OS Upgrade prototype (`../os-upgrade-ui`) rebuilt in the **new ServiceOps UI**
(`../serviceops-ticket-detail`): the grey icon rail with hover flyouts, the
logo + search top bar, List + KPI listing pages with uppercase grids and blue id
pills, and record pages with a record tab, a one-line header KPI row, blue
underline tabs and a searchable **Properties** panel with the Ask AI box.

**Data is unchanged.** `src/data/` is a byte-for-byte copy of the old app's, so
every image, endpoint, deployment, prerequisite and dashboard figure is the same.
Only the UI layer (`src/ui/`, `src/screens/`) was redone. The old key-field grid
and "Other Info" rail are folded into the Properties panel — every field is
still there.

The old app is untouched and still the one that is live at
https://keyadesai-motadata.github.io/Serviceops-UI/. This folder has no git repo
and no deploy workflow yet.

## Admin › Patch Management › OS Upgrade

Opened from the header **gear** (`#/admin/os-upgrade`). "Back to app" returns.

- **No pre-built catalogue** — a list of Windows versions would need syncing on
  every Microsoft release; only created OS upgrades appear. Two example records,
  both valid (an invalid ISO cannot be saved). List columns: ID, Name, Language,
  Size, Upload Time, Action — **no Upload Status**.
- Dropdowns: **Operating System** = Windows 11 / Windows 10 only; **Edition** =
  every client edition except the Enterprise family (Home, Home N, Home Single
  Language, Pro, Pro N, Pro Education (N), Pro for Workstations (N), Education
  (N) — no SE, which has no ISO); **Language** = English only — English (US) en-US, English
  (International) en-GB. No Build column.
- **Create OS Upgrade** = **Name** (the admin's own label, not checked) then the
  fields an ISO records about itself, each checked after upload
  (`src/admin/isoVerify.ts`):

  | Field | Read from the ISO |
  | --- | --- |
  | Operating System | `install.wim` image name / installation type |
  | Version (24H2…) | `DisplayVersion` (or `ReleaseId`) in the image's offline registry |
  | Edition | `EditionID` of each WIM index — any index satisfies a multi-edition ISO |
  | Architecture | WIM architecture |
  | Language | WIM default language |

- The ISO field is the module's own: "Choose files (or) Drop here" + Browse,
  then a file chip. **The upload runs in the form** (% · bar · "X of Y · ETA",
  Pause / Resume / Stop), then the ISO is validated against the details.
- **A mismatch is a validation error on the form**: each field that disagrees
  is outlined red with "The ISO has …", a summary lists them, and
  **Create / Update stays disabled** until the details or the ISO are fixed.
  Fixing a field clears its error at once. A failed transfer offers Retry.
- **Clicking a row reopens the same form**, filled in; its ISO is already
  validated. Changed details are checked again; a new ISO uploads again.
- The **Windows File Server required to upload** notice sits in the ISO File
  section, directly above the drop zone.
- Mock: the upload is simulated and the ISO's metadata is inferred from the
  FILE NAME (e.g. `Win11_24H2_English_x64.iso` → Windows 11 24H2, consumer
  editions, en-US, x64). The backend would run `DISM /Get-WimInfo` instead.

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
pnpm dev      # http://localhost:5175
pnpm build
```

Mock data only — no backend.
