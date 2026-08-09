# REQ-002 — Toolbar trailing accessory slot + hide screenshot/fullscreen (Candlex KLP phase-18.1)

> **Status:** OPEN — docs request; implement in this Dev Container before treating PR as done  
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

_(Implementer fills after code lands.)_

---

## Acceptance checklist

- [ ] R1: host can hide screenshot + fullscreen via documented API/options
- [ ] R2: host can mount a node at toolbar trailing end per chart instance
- [ ] R3: no Pro-owned countdown timer/math
- [ ] R4: typings + UMD
- [ ] R5: Final API filled; tests/build green
- [ ] Tag published for candlex-klp pin bump
