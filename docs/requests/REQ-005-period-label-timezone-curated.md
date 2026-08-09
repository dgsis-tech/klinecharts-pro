# REQ-005 — Period label beside symbol + curated timezones (Candlex KLP D-31)

> **Status:** IMPLEMENTED — awaiting operator merge + annotated tag `v0.2.1`  
> **Requested by:** Candlex KLP Planner (docs-only PR; do **not** treat this PR as “docs complete”)  
> **Consumer:** [candlex-klp](https://github.com/dgsis-tech/candlex-klp) · decision **D-31** / backlog **KLP-029**  
> **Blocked consumer pin:** `v0.2.0`  
> **Suggested consume tag after merge:** `v0.2.1`  
> **Builds on:** REQ-004 (`showPeriods: false`, icon-only tools)

## Purpose

1. Show the **current timeframe** as a **read-only** label next to the instrument name on the PeriodBar (selection stays host-only / D-30).
2. Shrink the timezone modal to the three zones Candlex actually uses: **UTC**, **New York**, **Madrid**.

## Target chrome (binding)

On the Pro top bar, **visible** (unchanged from REQ-004 except the TF label):

| Element | Form |
| --- | --- |
| Drawing-bar menu | Icon only |
| **Instrument** | Name text |
| **Current TF** | **Read-only text** next to instrument (e.g. `· 5m` or `5m`) — **not** chips, **not** clickable for TF change |
| Indicators / Timezone / Setting | Icon only |
| Trailing accessory | Per REQ-002 |

**Must not return:** period/TF **picker chips** (`showPeriods` remains false for Candlex).

Timezone modal options for Candlex (exact IANA keys):

| Display label | IANA |
| --- | --- |
| UTC | `Etc/UTC` |
| New York | `America/New_York` |
| Madrid | `Europe/Madrid` |

Drop Honolulu, Juneau, LA, Chicago, Toronto, São Paulo, London, Berlin, and all Asia/Australia/Pacific entries from the **Candlex curated list**. Other consumers may keep the full list when not opting in.

## Requirements

### R1 — Read-only period label beside symbol

When enabled, render `period.text` (or equivalent stable display) beside the instrument name. Update on `setPeriod` / prop change. Do **not** call `onPeriodChange` from this label (not a control).

Suggested option (exact name in Final API):

```ts
periodBar?: {
  // …existing REQ-004 fields…
  showPeriodLabel?: boolean  // default false; Candlex → true
}
```

Visual example: `BTCUSDT` then `5m` (separator `·` or muted spacing OK).

### R2 — Curated timezone list

Allow the host to pass a curated list, **or** ship a Candlex-oriented default when an option is set, e.g.:

```ts
timezoneSelectOptions?: Array<{ key: string; text: string }>
// and/or
timezoneCurated?: boolean  // when true → only Etc/UTC, America/New_York, Europe/Madrid
```

Display texts for curated: **UTC**, **New York**, **Madrid** (locale-aware i18n OK if keys exist; otherwise fixed English labels for these three is acceptable for Candlex).

Add `America/New_York` and `Europe/Madrid` to `translateTimezone` / i18n as needed (they are **not** in the current full list — Berlin/London are, NY/Madrid are not).

### R3 — Constructor default timezone (Candlex)

Document that Candlex host should pass `timezone: 'Etc/UTC'` (or one of the three). Prefer **not** silently forcing Shanghai when curated mode is on and host omits timezone — either keep package default documented or default to `Etc/UTC` when `timezoneCurated === true`. Exact behavior in Final API.

### R4 — Workspace / setTimezone

If workspace restores a timezone **outside** the curated list while curated mode is on: map to nearest / fall back to `Etc/UTC` and document; do not crash the modal.

### R5 — Typings, UMD, tests/build, Final API, requests index

## Out of scope

- Host TF picker / favorites (candlex-klp)
- Changing DataHub bar timestamps (bars stay exchange/UTC-based; this is display TZ only)
- Re-enabling TF chips

## Final API

> Shipped on PR #8. Package **`0.2.1`**. Suggested consume tag: **`v0.2.1`**.

```ts
interface PeriodBarOptions {
  showPeriods?: boolean            // default false
  showScreenshot?: boolean         // default false
  showFullscreen?: boolean         // default false
  toolsIconOnly?: boolean          // default true
  showToolbarAccessory?: boolean   // default true
  showPeriodLabel?: boolean        // NEW — default false; Candlex → true
}

interface TimezoneOption {
  key: string   // IANA
  text: string  // display
}

interface ChartProOptions {
  periodBar?: PeriodBarOptions
  timezone?: string
  /** When true: modal = Etc/UTC, America/New_York, Europe/Madrid only. */
  timezoneCurated?: boolean
  /** Optional full override of modal options (wins over timezoneCurated). */
  timezoneSelectOptions?: TimezoneOption[]
  // …
}

/** Exported helpers */
const CURATED_TIMEZONE_KEYS: readonly ['Etc/UTC', 'America/New_York', 'Europe/Madrid']
const DEFAULT_CURATED_TIMEZONE = 'Etc/UTC'
function resolveTimezoneKey(key: string | undefined | null, opts?: {
  curated?: boolean
  allowedKeys?: string[]
}): string
```

### Defaults (R3)

| Mode | Host omits `timezone` | Host passes out-of-list key |
| --- | --- | --- |
| `timezoneCurated: true` (or non-empty `timezoneSelectOptions`) | **`Etc/UTC`** | **`Etc/UTC`** (no crash) |
| unrestricted (default) | `Asia/Shanghai` (legacy) | kept as-is |

`setTimezone` / `importWorkspace` use the same `resolveTimezoneKey` path.

```js
const chart = new klinechartspro.KLineChartPro({
  container: el,
  symbol,
  period: { multiplier: 5, timespan: 'minute', text: '5m' },
  timezone: 'Etc/UTC',
  timezoneCurated: true,
  periodBar: {
    showPeriods: false,
    showPeriodLabel: true,
    toolsIconOnly: true,
    showScreenshot: false,
    showFullscreen: false
  },
  datafeed
})
// Label shows "· 5m" beside instrument; updates on:
chart.setPeriod({ multiplier: 15, timespan: 'minute', text: '15m' })
// Modal only UTC / New York / Madrid; selecting NY → America/New_York
```

## Acceptance checklist

- [x] With `showPeriodLabel: true` and `showPeriods: false`, instrument shows current TF text; no TF chips
- [x] Label updates after `setPeriod` (bound to `period()` signal)
- [x] Timezone modal shows **only** UTC / New York / Madrid when curated
- [x] Selecting New York or Madrid applies `America/New_York` / `Europe/Madrid`
- [x] Out-of-list workspace TZ while curated → `Etc/UTC` (unit-tested)
- [x] Prefer `Etc/UTC` default when curated and host omits timezone (documented + unit-tested)
- [x] Typings + build + Final API + requests index updated
- [ ] Tag published for candlex-klp pin bump (`v0.2.1` — operator)
