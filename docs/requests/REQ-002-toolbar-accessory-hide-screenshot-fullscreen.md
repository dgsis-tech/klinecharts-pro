# REQ-002 — Toolbar trailing accessory slot + hide screenshot/fullscreen (Candlex KLP phase-18.1)

> **Status:** IMPLEMENTED — awaiting operator merge + tag `v0.1.1-candlex.3`  
> **Requested by:** Candlex KLP Planner (docs-only PR; do **not** treat this PR as “docs complete”)  
> **Consumer:** [candlex-klp](https://github.com/dgsis-tech/candlex-klp) · phase [`phase-18.1.md`](https://github.com/dgsis-tech/candlex-klp/blob/main/docs/phases/phase-18.1.md)  
> **Blocked consumer pin:** `v0.1.1-candlex.2`  
> **Suggested consume tag after merge:** `v0.1.1-candlex.3` (operator chooses final `N`)  
> **Unlocks:** candlex-klp phase-18 (countdown at toolbar end · D-29)

## Purpose of this document

This file is the **binding implementation request** for agents/operators working **in this repository’s Dev Container**.

Workflow:

1. Candlex KLP Planner opens a PR **here** that lands this request under `docs/requests/` (and index updates).
2. **This environment** checks out the PR branch, **implements the code**, keeps/extends this doc with the final public API, runs tests/build, pushes commits onto the same PR.
3. Operator reviews → **merge** → publish consumable **tag**.
4. candlex-klp Executor bumps `third_party/CHART_PIN` (phase-18.1 host half) then implements UI in phase-18.

Do **not** implement Pro sources inside candlex-klp.

---

## Why this is needed (product D-29)

Candlex KLP shows a **per-pane candle countdown** today as a host overlay (top-right / price-axis zone). Product decision **D-29**:

1. Countdown must sit on the **Pro chart toolbar row**, at the **end** of that menu line — **not** over the price axis / last-price zone.
2. Remove Pro toolbar affordances **screenshot** and **fullscreen** to free that space.
3. Host still owns countdown logic (UTC close for the pane TF); Pro must expose a **stable mount / slot**, not own market-time math.

Pin `v0.1.1-candlex.2` does not expose a documented trailing toolbar accessory or a stable way for the host to hide screenshot/fullscreen without fragile CSS.

---

## Requirements (must all ship together)

### R1 — Hide screenshot + fullscreen on the period / widget toolbar

Expose a **stable config** (constructor options and/or `ChartPro` method) so the host can **hide** the built-in **screenshot** and **fullscreen** controls on the chart toolbar.

- Default for Candlex consumption: **both hidden**.
- Prefer removing from DOM / not rendering (not only `display:none` that still steals focus/layout in fragile ways).
- Document exact option names in “Final API”.

### R2 — Trailing toolbar accessory slot (host mount)

Provide a **documented empty container** (or equivalent API) at the **end** of the Pro toolbar / period-bar row where the host can mount DOM (countdown label).

Minimum acceptable shapes (pick one, document in Final API):

```ts
// Preferred: host gets an HTMLElement to append into
const el = chart.getToolbarAccessoryContainer?.() // or similar
el.appendChild(countdownNode)

// Or: constructor / setOption provides a host-owned element id / selector
```

Rules:

- Slot is **per chart instance** (each Candlex pane mounts its own Pro instance).
- Slot sits at the **trailing end** of the same row as period / widget tools (after remaining built-ins).
- Slot must not break existing period / symbol / drawing toolbar layout on desktop.
- Slot remains available after theme/locale/period changes (or Pro re-creates and documents re-query).

### R3 — Do not implement countdown math in Pro

Pro must **not** compute candle close / session countdown. Host owns TF + UTC close. Pro only provides chrome (R1/R2).

### R4 — Typings + UMD

Public TypeScript typings and UMD `ChartPro` surface must expose R1/R2. Smoke-friendly for candlex-klp host JS.

### R5 — Docs + build

- Update this file’s **Final API** section with exact names/signatures.
- `npm test` / `npm run build` green in Dev Container.
- Index row in `docs/requests/README.md` → status IMPLEMENTED when code lands.

---

## Out of scope

- Host countdown UI/CSS typography (candlex-klp phase-18)
- Changing MA/BOLL/Ray APIs from REQ-001
- DataHub / auth / Postgres

---

## Final API

> Shipped with REQ-003 / REQ-004 on branch `feat/candlex-req-002-003-004`. Suggested consume tag: **`v0.1.1-candlex.3`**.

```ts
interface PeriodBarOptions {
  showScreenshot?: boolean          // default false — do not mount screenshot tool
  showFullscreen?: boolean          // default false — do not mount fullscreen tool
  showToolbarAccessory?: boolean    // default true — trailing host mount
  // also used by REQ-004:
  showPeriods?: boolean             // default false
  toolsIconOnly?: boolean           // default true
}

interface ChartProOptions {
  // …
  periodBar?: PeriodBarOptions
}

interface ChartPro {
  /** Trailing toolbar mount for host countdown DOM. Null if disabled / not mounted. */
  getToolbarAccessoryContainer(): HTMLElement | null
}
```

```js
// Host smoke (UMD: klinechartspro)
const chart = new klinechartspro.KLineChartPro({
  container: el,
  symbol,
  period,
  datafeed,
  periodBar: {
    showScreenshot: false,
    showFullscreen: false,
    showToolbarAccessory: true
  }
})
const slot = chart.getToolbarAccessoryContainer()
if (slot) slot.appendChild(countdownNode) // host-owned; Pro does not compute close time
```

Screenshot/fullscreen are **not rendered** when the options are false (not CSS-only hide). Slot uses `margin-left: auto` at the end of the period-bar row. Re-query `getToolbarAccessoryContainer()` after mount; the element is stable across theme/locale/period changes.

---

## Acceptance checklist

- [x] R1: host can hide screenshot + fullscreen via documented API/options
- [x] R2: host can mount a node at toolbar trailing end per chart instance
- [x] R3: no Pro-owned countdown timer/math
- [x] R4: typings + UMD
- [x] R5: Final API filled; tests/build green
- [ ] Tag published for candlex-klp pin bump
