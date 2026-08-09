# REQ-003 — Reliable symbol/period reload (fix `loading` race) (Candlex KLP phase-19)

> **Status:** IMPLEMENTED — awaiting operator merge + tag `v0.2.0`  
> **Requested by:** Candlex KLP Planner (docs-only PR; do **not** treat this PR as “docs complete”)  
> **Consumer:** [candlex-klp](https://github.com/dgsis-tech/candlex-klp) · phase [`phase-19.md`](https://github.com/dgsis-tech/candlex-klp/blob/main/docs/phases/phase-19.md)  
> **Blocked consumer pin:** `v0.1.1-candlex.2`  
> **Suggested consume tag after merge:** `v0.2.0`  
> **Related:** REQ-002 (toolbar) can ship in the same or adjacent tag

## Purpose

Binding request for agents in **this** Dev Container. Candlex sees **intermittent** failures when changing **period (timeframe) inside the chart** and when host calls `importWorkspace` / `setPeriod` while a history/`loadMore` fetch is in flight: sometimes no new candles load; UI looks “stuck”; axes/volume may still respond.

## Evidence (pin `v0.1.1-candlex.2`)

In `ChartProComponent.tsx`, symbol/period reload is gated by a plain `let loading`:

```ts
createEffect((prev?: PrevSymbolPeriod) => {
  if (!loading) {
    loading = true
    // getHistoryKLineData → applyNewData → subscribe → updateData
    loading = false
    return { symbol: s, period: p }
  }
  return prev  // ← period/symbol change silently dropped
})
```

`loadMore` also sets `loading = true` without always clearing via the same path users expect. Concurrent `importWorkspace` (clears indicators + may `setPeriod`) races the same gate.

Operator repros (candlex-klp):

1. Show/apply MA·BB → candles freeze (host was calling `importWorkspace` mid-stream; also hits this race).
2. Change timeframe **on the Pro chart** → sometimes stuck / wrong or empty candles (**intermittent**).

## Requirements

### R1 — Never drop symbol/period changes

If `setSymbol` / `setPeriod` / equivalent signal updates occur while a fetch is in progress, **queue** the latest desired `{symbol, period}` and run it when the in-flight work finishes (or cancel+restart). Do **not** return `prev` and forget the new period.

### R2 — `loadMore` must not permanently block period changes

`loading` during `loadMore` must not swallow user period changes. Prefer separate flags or abort/restart history when period changes mid-`loadMore`.

### R3 — `importWorkspace` coordination

Document whether `importWorkspace` should avoid calling `setSymbol`/`setPeriod` when unchanged, or always go through the same queued reload path so host mid-stream imports cannot leave the chart on a stale period with cleared indicators.

### R4 — Optional: public `createIndicator`

Expose `createIndicator` (or documented equivalent) on `ChartPro` so hosts need not use full `importWorkspace` just to add MA/BOLL. Preferable but secondary to R1–R3.

### R5 — Typings, UMD, Final API, tests/build

Fill **Final API**; green tests/build; update `docs/requests/README.md`.

## Out of scope

- Host countdown / toolbar (REQ-002)
- DataHub catalog contents

## Final API

> Shipped with REQ-002 / REQ-004. Suggested consume tag: **`v0.2.0`**.

### Behavior (no new options required)

- `setPeriod` / `setSymbol` always schedule a history reload via Solid effect.
- In-flight history fetches are **superseded** by a generation token (`SymbolPeriodReloadGate`); stale responses do not call `applyNewData` / `subscribe`.
- `loadMore` uses a **separate** generation; it never sets a shared `loading` flag that blocks period changes. A period/symbol change invalidates in-flight `loadMore`.
- `importWorkspace` calls `setSymbol` / `setPeriod` **only when values differ** (`symbolsEqual` / `periodsEqual`), then relies on the same reload path — no silent drop.

### Optional public API

```ts
interface ChartPro {
  /**
   * Create an indicator with Pro tooltip icons (visible/invisible/setting/close).
   * Prefer this over a full importWorkspace just to add MA/BOLL.
   */
  createIndicator(
    name: string,
    isStack?: boolean,
    paneOptions?: { id?: string }
  ): string | null
}
```

```js
chart.createIndicator('BOLL', true, { id: 'candle_pane' })
chart.overrideIndicator({
  name: 'BOLL',
  styles: { lines: [{ color: '#e91e63' }, { color: '#00bcd4' }, { color: '#8bc34a' }] }
}, 'candle_pane')
```

## Acceptance checklist

- [x] Rapid period switches in Pro period bar always load the **last** selected period’s history + stream
- [x] Period change during `loadMore` / spinner still applies
- [x] No silent drop of `setPeriod` while `loading === true`
- [ ] Tag published for candlex-klp pin bump
