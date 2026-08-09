# REQ-001 — MA/BOLL per-line styles + Ray overlay API (Candlex KLP phase-9.1)

> **Status:** IMPLEMENTED — awaiting operator merge + tag `v0.1.1-candlex.2`  
> **Requested by:** Candlex KLP Planner (docs-only PR; do **not** treat this PR as “docs complete”)  
> **Consumer:** [candlex-klp](https://github.com/dgsis-tech/candlex-klp) · phase [`phase-9.1.md`](https://github.com/dgsis-tech/candlex-klp/blob/main/docs/phases/phase-9.1.md)  
> **Blocked consumer pin:** `v0.1.1-candlex.1`  
> **Suggested consume tag after merge:** `v0.1.1-candlex.2` (operator chooses final `N`)  
> **Unlocks:** candlex-klp phase-9.2 (host MA/BB UI) and phase-10 (previous-day H/L/C Rays)

## Purpose of this document

This file is the **binding implementation request** for agents/operators working **in this repository’s Dev Container**.

Workflow (corrected):

1. Candlex KLP Planner opens a PR **here** that lands this request under `docs/requests/` (and index updates).
2. **This environment** checks out the PR branch, **implements the code**, keeps/extends this doc with the final public API, runs tests/build, pushes commits onto the same PR (or a follow-up commit on the branch).
3. Operator reviews in this Dev Container → **merge** → publish consumable **tag**.
4. candlex-klp Executor bumps `third_party/CHART_PIN` (separate host phase).

Do **not** implement Pro sources inside candlex-klp.

---

## Why this is needed (evidence from pin `v0.1.1-candlex.1`)

Candlex KLP audited host-only phase-9 against the current pin and **STOPPED**. Public `ChartPro` today exposes:

- `setStyles` / `getStyles` (global Styles only)
- theme / locale / timezone / symbol / period
- `exportWorkspace` / `importWorkspace` / `subscribeWorkspaceChange`

It does **not** expose:

- `overrideIndicator` / `getIndicatorByPaneId` (or any host-callable equivalent)
- per-instance MA line color/size
- BOLL middle/upper/lower colors
- create/update/remove of Ray overlays from the host

Internal facts on current `main` (for implementers):

| Area | Current state |
| --- | --- |
| `WorkspaceIndicator` (`src/workspace.ts`) | Has `name`, `paneId`, `calcParams`, `visible`, … — **no `styles`** |
| `collectIndicators` / `applyIndicators` | Ignore indicator styles |
| MA setting modal (`src/widget/indicator-setting-modal/data.ts`) | Period params + `styleKey: 'lines[N].color'` only — **no line size**; colors may not round-trip via workspace |
| BOLL modal data | **Only** `period` + `standard_deviation` — **no** color fields for mid/upper/lower |
| `ChartPro` (`src/types.ts`) | No indicator-override API; no overlay CRUD API for host |
| Overlays | Tracked for workspace via Pro UI paths; host cannot stably create Rays programmatically |

`setStyles({ indicator: { lines } })` only changes the **shared default palette**. That is **not** acceptable as a substitute for per-indicator MA/BOLL instance styles.

---

## Requirements (must all ship together)

### R1 — Programmatic indicator style override (MA + BOLL)

Expose a **stable, documented** API on `ChartPro` / `KLineChartPro` (UMD + TypeScript typings) that can apply styles equivalent to klinecharts:

```ts
chart.overrideIndicator(
  { name: 'MA', styles: { lines: [{ color, size }, /* up to 5 */] } },
  paneId /* usually 'candle_pane' */
)

chart.overrideIndicator(
  {
    name: 'BOLL',
    styles: {
      // Exact shape may follow klinecharts BOLL figures/lines —
      // must allow independent colors for middle, upper, and lower bands.
    }
  },
  paneId
)
```

**Minimum public surface (names may differ if documented, but preferred):**

```ts
interface ChartPro {
  // existing methods…

  /**
   * Override an indicator instance (calcParams and/or styles).
   * Must reach the underlying klinecharts Chart.overrideIndicator.
   */
  overrideIndicator(
    override: {
      name: string
      calcParams?: unknown[]
      visible?: boolean
      styles?: DeepPartial<IndicatorStyle /* or documented any */>
    },
    paneId?: string
  ): void

  /**
   * Optional but recommended: read current indicators by pane
   * (wraps getIndicatorByPaneId) for host debugging / sync.
   */
  getIndicatorByPaneId?(paneId?: string): unknown
}
```

**Behavioral acceptance:**

| Case | Expected |
| --- | --- |
| MA | Up to **5** lines; each has independent **`color`** and **`size`** (stroke width) |
| BOLL | Independent **color** for **middle**, **upper**, and **lower** |
| Pane | Works on candle pane (`candle_pane`) where product mounts MA/BOLL |
| Visibility | Existing visible/calcParams overrides must keep working |
| Host callable | Works from candlex-klp `static/app-datafeed.js` against the built UMD without poking private Solid refs |

**Not acceptable:**

- Only changing global `setStyles` indicator palette
- Only middle BOLL color
- MA color without size
- Undocumented private `_chartApi` / widget hacks as the supported path

### R2 — Persist styles in workspace export/import

Extend the workspace model so styles survive Candlex KLP Postgres persistence (phase-5 path).

**Required model change:**

```ts
export interface WorkspaceIndicator {
  name: string
  paneId: string
  calcParams?: any[]
  visible?: boolean
  shortName?: string
  precision?: number
  /** NEW — serializable indicator styles (MA lines, BOLL bands, …) */
  styles?: any  // prefer a documented DeepPartial shape
}
```

**Required behavior:**

1. `collectIndicators` copies current styles from the live indicator instance into `WorkspaceIndicator.styles`.
2. `applyIndicators` passes `styles` into `overrideIndicator` (or equivalent) when rehydrating.
3. `exportWorkspace` / `importWorkspace` round-trip preserves MA line colors/sizes and BOLL band colors.
4. Bump or document `schemaVersion` policy:
   - Prefer keeping `WORKSPACE_SCHEMA_VERSION = 1` with **additive** optional `styles` (backward compatible), **or**
   - Bump to `2` **only if** a breaking change is unavoidable — document migration in this file’s “Final API” section.
5. Unit tests in `src/workspace.test.ts` (or adjacent) covering normalize + round-trip of indicators **with styles**.
6. `subscribeWorkspaceChange` must fire when styles change via the new API / Pro UI (so host auto-save works).

### R3 — Pro UI (preferred) or documented programmatic-only path

**Preferred:** extend indicator setting modals:

- **MA:** color **and** size controls for each of up to 5 lines (today color styleKeys exist; size is missing).
- **BOLL:** color pickers for middle + upper + lower (today only period + stddev).

**Minimum acceptable for merge:** R1 + R2 fully done and documented, with Pro UI deferred — **only if** this request’s “Final API” section lists exact method signatures and a copy-paste host example. Product UI in candlex-klp (phase-9.2) can wrap the programmatic API.

### R4 — Ray (or horizontal-ray) overlay CRUD for host

Candlex KLP phase-10 needs three horizontal levels (previous day high / low / close) as **Rays** (or Pro’s equivalent ray/segment-with-extension overlay).

Expose stable host APIs, for example:

```ts
interface ChartPro {
  /**
   * Create an overlay; return id. Must be tracked for workspace export
   * the same way Pro UI-created overlays are tracked.
   */
  createOverlay(
    overlay: {
      name: string  // e.g. 'ray' | 'horizontalRay' | documented template name
      points: Array<{ timestamp?: number, dataIndex?: number, value?: number }>
      styles?: any
      extendData?: any
      // lock/visible/zLevel/mode as supported today on WorkspaceOverlay
    },
    paneId?: string
  ): string | null

  /** Update points/styles/extendData of an existing overlay by id. */
  overrideOverlay(override: { id: string } & Record<string, unknown>): void

  /** Remove by id; drop from workspace tracking. */
  removeOverlay(id: string): void
}
```

**Behavioral acceptance:**

| Case | Expected |
| --- | --- |
| Create | Host can create a Ray (or documented equivalent) at price `value` with a timestamp/point |
| Update | Host can move the Ray when previous-day H/L/C rolls over (no recreate flicker requirement beyond correctness) |
| Remove | Host can clear Rays on symbol change |
| Styles | Host can set stroke **color** (and ideally size) per Ray |
| Workspace | Created overlays appear in `exportWorkspace().overlays` and restore via `importWorkspace` |
| Template name | Document the **exact** `name` string the host must pass (`ray`, `horizontalStraightLine`, etc.) |

**Not acceptable:**

- “Use drawing bar only” with no programmatic path
- Requiring undocumented internal `widget` access
- Substituting non-ray drawings without documenting the chosen template and why

### R5 — Tests, build, typings, docs

- [x] `npm test` green (include new workspace style round-trip cases)
- [x] `npm run build` green; UMD + `index.d.ts` export the new `ChartPro` methods
- [x] Update [`docs/DEVELOPMENT.md`](../DEVELOPMENT.md) “Workspace export / import” + API notes with the **Final API** section below filled in after implementation
- [x] Update English API notes if maintained (`docs/en-US/…`) when applicable
- [x] PR description / this file lists suggested consume tag `v0.1.1-candlex.2`

---

## Out of scope (do not do in this request)

- Editing candlex-klp application code or bumping `CHART_PIN` (host Executor after tag)
- Implementing candlex-klp phase-9.2 UI or phase-10 previous-day logic
- Jumping `klinecharts` to v10 (D-12)
- Persisting OHLC in workspace
- Unrelated refactors

---

## Implementation notes (hints, not mandatory design)

1. `ChartProComponent` already calls `widget.overrideIndicator` for visibility/calcParams — extend that path and **forward** a public method through `KLineChartPro` → Solid ref (same pattern as `exportWorkspace`).
2. Overlay create path already has `createOverlayTracked` — reuse tracking so Rays enter workspace collect/apply.
3. For BOLL styles, inspect klinecharts `9.8.12` indicator style shape for `BOLL` (lines vs figures) and document the exact keys the host must send.
4. Prefer additive workspace fields over breaking schema bumps.

---

## Acceptance checklist (fork)

- [x] R1 MA: color + size for ≤5 lines via public ChartPro API
- [x] R1 BOLL: mid + upper + lower colors via public ChartPro API
- [x] R2 `WorkspaceIndicator.styles` collect/apply + export/import round-trip
- [x] R3 UI extended **or** Final API section complete for programmatic-only
- [x] R4 create/update/remove Ray (or documented equivalent) + workspace tracking
- [x] R5 tests + build + typings + docs updated
- [x] Suggested tag noted for operator: `v0.1.1-candlex.2`

---

## Final API

> Shipped in this PR. Schema stays **`WORKSPACE_SCHEMA_VERSION = 1`** with additive optional `WorkspaceIndicator.styles` (backward compatible). Suggested consume tag: **`v0.1.1-candlex.2`**.

```ts
import type { DeepPartial, IndicatorStyle, OverlayStyle } from 'klinecharts'
import type { ChartPro, IndicatorOverride, OverlayCreateInput, ChartWorkspace } from '@klinecharts/pro'

interface ChartPro {
  // …existing theme/locale/timezone/symbol/period/styles…

  exportWorkspace(): ChartWorkspace
  importWorkspace(workspace: ChartWorkspace | Record<string, unknown>): void
  subscribeWorkspaceChange(callback: () => void): () => void

  overrideIndicator(override: IndicatorOverride, paneId?: string): void
  getIndicatorByPaneId(paneId?: string, name?: string): unknown

  createOverlay(overlay: OverlayCreateInput | string, paneId?: string): string | null
  overrideOverlay(override: { id: string } & Record<string, unknown>): void
  removeOverlay(id: string): void
}

interface IndicatorOverride {
  name: string
  calcParams?: unknown[]
  visible?: boolean
  styles?: DeepPartial<IndicatorStyle>
}

interface OverlayCreateInput {
  name: string
  id?: string
  groupId?: string
  points?: Array<{ timestamp?: number, dataIndex?: number, value?: number }>
  lock?: boolean
  visible?: boolean
  zLevel?: number
  mode?: string
  extendData?: unknown
  styles?: DeepPartial<OverlayStyle> | Record<string, unknown>
}

interface WorkspaceIndicator {
  name: string
  paneId: string
  calcParams?: any[]
  visible?: boolean
  shortName?: string
  precision?: number
  styles?: any  // DeepPartial<IndicatorStyle> when serializable
}
```

```js
// Minimal candlex-klp host smoke (UMD global: klinechartspro)
const chart = window.__candlexChart // KLineChartPro instance

// MA — up to 5 lines; each color + size
chart.overrideIndicator({
  name: 'MA',
  styles: {
    lines: [
      { color: '#f44336', size: 2 },
      { color: '#2196f3', size: 1 },
      { color: '#4caf50', size: 1 },
      { color: '#ff9800', size: 1 },
      { color: '#9c27b0', size: 1 }
    ]
  }
}, 'candle_pane')

// BOLL — UP / MID / DN colors (indices 0 / 1 / 2)
chart.overrideIndicator({
  name: 'BOLL',
  styles: {
    lines: [
      { color: '#e91e63' }, // upper
      { color: '#00bcd4' }, // middle
      { color: '#8bc34a' }  // lower
    ]
  }
}, 'candle_pane')

// Previous-day high as horizontal ray (two points, same value; 2nd to the right)
const rayId = chart.createOverlay({
  name: 'horizontalRayLine',
  points: [
    { timestamp: Date.UTC(2024, 0, 1), value: 42000 },
    { timestamp: Date.UTC(2024, 0, 1, 1), value: 42000 }
  ],
  styles: { line: { color: '#ffeb3b', size: 2 } },
  lock: true,
  extendData: { kind: 'prev_day_high' }
}, 'candle_pane')

chart.overrideOverlay({
  id: rayId,
  points: [
    { timestamp: Date.UTC(2024, 0, 2), value: 43100 },
    { timestamp: Date.UTC(2024, 0, 2, 1), value: 43100 }
  ]
})

chart.removeOverlay(rayId)

// Workspace round-trip preserves indicator.styles + overlays
const ws = chart.exportWorkspace()
chart.importWorkspace(ws)
```

### Overlay template name for Rays

- **Name string:** `horizontalRayLine` (klinecharts builtin; also available: `rayLine`, `verticalRayLine`, `priceLine`)
- **Points convention:** **two** points `{ timestamp, value }` at the **same** price. The second point’s x (timestamp) relative to the first chooses direction: if `p1.x > p0.x`, the ray extends to the right edge; otherwise to the left. Stroke: `styles.line.color` / `styles.line.size`.

### BOLL styles shape

```ts
// figures order in klinecharts 9.8.12 BOLL: up, mid, dn → lines[0], lines[1], lines[2]
chart.overrideIndicator({
  name: 'BOLL',
  styles: {
    lines: [
      { color: '#upper' }, // UP
      { color: '#mid' },   // MID
      { color: '#lower' }  // DN
    ]
  }
}, 'candle_pane')
```

### R3 note

Pro indicator-setting modal UI for MA size / BOLL colors is **deferred**; host (candlex-klp phase-9.2) should use `overrideIndicator` as above. Programmatic path is the supported merge path.

---

## References

- candlex-klp phase-9 STOP evidence: [`phase-9.md`](https://github.com/dgsis-tech/candlex-klp/blob/main/docs/phases/phase-9.md)
- candlex-klp remate card: [`phase-9.1.md`](https://github.com/dgsis-tech/candlex-klp/blob/main/docs/phases/phase-9.1.md)
- candlex-klp fork workflow: [`fork-workflow.md`](https://github.com/dgsis-tech/candlex-klp/blob/main/docs/product/fork-workflow.md)
- Prior workspace work: PR #2 (`feat/workspace-export-import`) → tag `v0.1.1-candlex.1`
