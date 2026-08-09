# Development — Candlex KLP product fork

English technical notes. Operator chat for Candlex KLP remains Spanish in that product repo.

## What this repo is

Canonical **KLineChart Pro product fork** for [Candlex KLP](https://github.com/dgsis-tech/candlex-klp).

| Do here | Do in candlex-klp |
| --- | --- |
| Edit Pro / Solid UI / chart package sources | Consume a **pinned git tag/commit** |
| `npm ci` / `npm run build` | `make chart-build` (fetches this pin) |
| Integration changes for export/import hooks (later) | Auth, DataHub datafeed, Postgres chart state |

Pins: see [`../UPSTREAM.md`](../UPSTREAM.md) (fork SemVer in `package.json`; D-12: `klinecharts@9.8.12`).

## Dev Container (no host Node install)

Same idea as candlex-klp’s go-dev kit: clone → open in Cursor → container has Node 20, npm, zsh, git, `gh`.

```bash
cp .dev/.env.example .dev/.env   # fill GIT_* / GITHUB_TOKEN / optional SSH
bash .dev/init-host.sh           # host: network go-dev + image klp-chart-dev:latest
# Open / Rebuild Dev Container in Cursor
```

`postStartCommand` runs `.dev/setup-dev.sh` (zsh, git, optional SSH/`gh`, first `npm ci` if needed).

**Never commit `.dev/.env`.**

### Build / verify inside the container

```bash
npm ci
npm run build
```

Artifacts under `dist/` (`klinecharts-pro.umd.js`, CSS, typings).

## Change control (mandatory)

1. **Do not push straight to `main`** for product changes (except rare operator hotfixes).
2. **Candlex KLP Planner** opens a **docs request PR** under [`docs/requests/`](requests/) describing the binding API/behavior (no Pro source implementation from the product host chat).
3. **This Dev Container** checks out that PR, implements the code, updates the request’s “Final API” section, runs `npm test` / `npm run build`, and pushes onto the **same PR branch**.
4. The operator **reviews, builds, and merges in this Dev Container** before candlex-klp bumps `CHART_REF` / tag.
5. After merge, bump/publish SemVer: set `package.json` version in the PR, then annotated tag **`v${version}`** (e.g. `v0.2.0`). Document the new pin in candlex-klp `third_party/CHART_PIN`.

See also [`CONTRIBUTING.md`](../CONTRIBUTING.md) and [`docs/requests/README.md`](requests/README.md).

## Workspace export / import (Candlex KLP persistence)

Public API on `KLineChartPro` (also on the Solid chart ref):

| Method | Role |
| --- | --- |
| `exportWorkspace()` | JSON: indicators (+ optional per-instance `styles`) + overlays + theme/locale/timezone/drawingBarVisible/styles/symbol/period. **No OHLC.** |
| `importWorkspace(ws)` | Restore from that JSON (`schemaVersion` = `1`, additive `WorkspaceIndicator.styles`). Idempotent best-effort; overlays that cannot rehydrate are skipped. |
| `subscribeWorkspaceChange(cb)` | Fires after indicator/overlay/settings mutations (for host auto-save). Returns unsubscribe. |
| `overrideIndicator(override, paneId?)` | Per-instance indicator override (`calcParams` / `visible` / `styles`). Forwards to klinecharts; notifies workspace listeners. |
| `getIndicatorByPaneId(paneId?, name?)` | Read live indicator(s) for host sync/debug. |
| `createOverlay(overlay, paneId?)` | Create overlay and **track** id for workspace export. Returns id or `null`. |
| `overrideOverlay({ id, … })` | Update overlay points/styles/extendData by id. |
| `removeOverlay(id)` | Remove overlay and drop from workspace tracking. |

Helpers exported: `WORKSPACE_SCHEMA_VERSION`, `normalizeWorkspace`, `emptyWorkspace`, types `ChartWorkspace`, `IndicatorOverride`, `OverlayCreateInput`, …

**MA / BOLL styles:** pass `styles.lines[i].color` and `.size` (MA: up to 5 lines; BOLL: `lines[0]=UP`, `lines[1]=MID`, `lines[2]=DN`).

**Rays (phase-10):** template name `horizontalRayLine` with two points `{ timestamp, value }` at the same price (second point to the right sets ray direction). Stroke via `styles.line.color` / `styles.line.size`.

Full signatures + host smoke: [`REQ-001` Final API](requests/REQ-001-ma-boll-styles-and-ray-api.md#final-api). Suggested consume tag: `v0.1.1-candlex.2`.

### Period bar chrome + reload (REQ-002 / REQ-003 / REQ-004)

Constructor option `periodBar` (Candlex defaults):

| Option | Default | Role |
| --- | --- | --- |
| `showPeriods` | `false` | Hide TF chips (host owns TF UI) |
| `showScreenshot` / `showFullscreen` | `false` | Do not mount those tools |
| `toolsIconOnly` | `true` | Indicator / timezone / setting as icons + `aria-label` |
| `showToolbarAccessory` | `true` | Trailing host mount |

`getToolbarAccessoryContainer()` → `HTMLElement | null` for countdown DOM.  
`createIndicator(name, isStack?, paneOptions?)` → pane id (avoids full `importWorkspace` for MA/BOLL).  
`setPeriod` / `setSymbol` never silently drop while history/`loadMore` is in flight (generation gate).

Suggested consume tag for this train: **`v0.2.0`** (package `0.2.0`). Specs: [REQ-002](requests/REQ-002-toolbar-accessory-hide-screenshot-fullscreen.md), [REQ-003](requests/REQ-003-reliable-symbol-period-reload.md), [REQ-004](requests/REQ-004-period-bar-icons-no-tf.md).

Limitations:

- Overlay inventory is tracked from Pro UI create paths **and** host `createOverlay` / `removeOverlay` (klinecharts has no public “list all overlays”).
- Function fields and non-JSON styles are not persisted.
- Round-trip of complex custom overlays depends on registered overlay templates.

```bash
npm test    # workspace + reload-gate unit tests
npm run build
```

## Relation to Candlex phases

| Candlex phase | Fork involvement |
| --- | --- |
| phase-3 | Bootstrap fork + pin; candlex-klp mount + stub feed |
| phase-4 | DataHub datafeed (mostly host; fork may need datafeed adapter hooks) |
| phase-5 | Persistence hooks (export/import indicators/overlays) — shipped as `v0.1.1-candlex.1` |
| phase-9.1 | **IMPLEMENTED** [REQ-001](requests/REQ-001-ma-boll-styles-and-ray-api.md) — tag `v0.1.1-candlex.2` |
| phase-18.1 / D-29 | **IMPLEMENTED** [REQ-002](requests/REQ-002-toolbar-accessory-hide-screenshot-fullscreen.md) — toolbar accessory |
| phase-19 | **IMPLEMENTED** [REQ-003](requests/REQ-003-reliable-symbol-period-reload.md) — symbol/period reload race |
| D-30 / KLP-027 | **IMPLEMENTED** [REQ-004](requests/REQ-004-period-bar-icons-no-tf.md) — no TF chips, icon-only tools |
| → consume | Package **`0.2.0`** · suggested tag **`v0.2.0`** (operator merges) |

Full product method: candlex-klp [`docs/HOW-WE-WORK.md`](https://github.com/dgsis-tech/candlex-klp/blob/main/docs/HOW-WE-WORK.md).
