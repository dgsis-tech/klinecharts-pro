# REQ-004 — Period bar: no TF chips; icon-only tools (Candlex KLP D-30)

> **Status:** OPEN — docs request; implement in this Dev Container before treating PR as done  
> **Requested by:** Candlex KLP Planner (docs-only PR; do **not** treat this PR as “docs complete”)  
> **Consumer:** [candlex-klp](https://github.com/dgsis-tech/candlex-klp) · decision **D-30** / backlog **KLP-027**  
> **Blocked consumer pin:** `v0.1.1-candlex.2`  
> **Suggested consume tag after merge:** same train as REQ-002/003 (`v0.1.1-candlex.3`+)  
> **Overlaps:** REQ-002 (hide screenshot/fullscreen) — implement together or satisfy R2 here and mark REQ-002 R1 done

## Purpose

Candlex KLP selects timeframes **only in host chrome**. The Pro top bar (`PeriodBar`) must stop showing TF/period chips and drop text labels on tool buttons.

## Target chrome (binding)

On the Pro top bar, **visible**:

| Element | Form |
| --- | --- |
| Drawing-bar menu (hamburger) | Icon only (already) |
| **Instrument** | **Name text** (shortName / name / ticker) — logo optional |
| **Indicators** | **Icon only** — no `i18n('indicator')` span |
| **Timezone** | **Icon only** — no timezone text label |
| **Setting** | **Icon only** — no setting text label |
| Trailing accessory slot | Per REQ-002 (countdown mount) if that PR lands |

**Must not be visible:**

- Period / timeframe chips (`periods.map` → `item period`)
- Screenshot control
- Fullscreen control

Keep accessible names (`aria-label` / `title`) on icon-only tools.

## Requirements

### R1 — Hide period chips

Do not render Pro period buttons. Host still passes `period` / may call `setPeriod`; datafeed reload unchanged. Empty `periods` or a dedicated option (e.g. `periodBarShowPeriods: false`, default **false for Candlex** or always hide when `periods.length === 0`) is fine — document in Final API.

### R2 — Hide screenshot + fullscreen

Same as REQ-002 R1: do not render those tools (prefer not mounting vs CSS-only hide).

### R3 — Icon-only indicator / timezone / setting

Remove visible text spans next to those three tool icons. Icons remain clickable; modals unchanged.

### R4 — Instrument name stays text

Do **not** icon-only the symbol row; keep the name label.

### R5 — Host options (preferred)

Expose stable constructor / ChartPro options so Candlex can opt in without forking behavior for other consumers if needed, e.g.:

```ts
periodBar?: {
  showPeriods?: boolean      // default false for Candlex build, or document Candlex default
  showScreenshot?: boolean   // false
  showFullscreen?: boolean   // false
  toolsIconOnly?: boolean    // true → no text on indicator/timezone/setting
}
```

Exact names in Final API.

### R6 — Typings, UMD, tests/build, Final API, requests index

## Out of scope

- Host TF chrome / favorites (candlex-klp)
- Countdown math (host)
- REQ-003 loading race (separate)

## Final API

_(Implementer fills.)_

## Acceptance checklist

- [ ] No TF chips on PeriodBar
- [ ] No screenshot / fullscreen
- [ ] Indicator, timezone, setting = icons only (+ a11y names)
- [ ] Instrument name still visible as text
- [ ] Host can set period via API without UI chips
- [ ] Tag published for candlex-klp pin bump
