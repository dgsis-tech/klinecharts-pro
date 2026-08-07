# Development — Candlex KLP product fork

English technical notes. Operator chat for Candlex KLP remains Spanish in that product repo.

## What this repo is

Canonical **KLineChart Pro product fork** for [Candlex KLP](https://github.com/dgsis-tech/candlex-klp).

| Do here | Do in candlex-klp |
| --- | --- |
| Edit Pro / Solid UI / chart package sources | Consume a **pinned git tag/commit** |
| `npm ci` / `npm run build` | `make chart-build` (fetches this pin) |
| Integration changes for export/import hooks (later) | Auth, DataHub datafeed, Postgres chart state |

Pins: see [`../UPSTREAM.md`](../UPSTREAM.md) (D-12: `@klinecharts/pro@0.1.1` lineage + `klinecharts@9.8.12`).

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
2. Agents / planners **open a Pull Request** against this repo with the proposed diff.
3. The operator **reviews, builds, and merges in this Dev Container environment** so integration is validated here before candlex-klp bumps `CHART_REF` / tag.
4. After merge, cut or move a **consumable tag** when candlex-klp should pick up the change (e.g. `v0.1.1-candlex.1`). Document the new pin in candlex-klp `third_party/CHART_PIN`.

See also [`CONTRIBUTING.md`](../CONTRIBUTING.md).

## Workspace export / import (Candlex KLP persistence)

Public API on `KLineChartPro` (also on the Solid chart ref):

| Method | Role |
| --- | --- |
| `exportWorkspace()` | JSON: indicators + overlays + theme/locale/timezone/drawingBarVisible/styles/symbol/period. **No OHLC.** |
| `importWorkspace(ws)` | Restore from that JSON (`schemaVersion` = `1`). Idempotent best-effort; overlays that cannot rehydrate are skipped. |
| `subscribeWorkspaceChange(cb)` | Fires after indicator/overlay/settings mutations (for host auto-save). Returns unsubscribe. |

Helpers exported: `WORKSPACE_SCHEMA_VERSION`, `normalizeWorkspace`, `emptyWorkspace`, types `ChartWorkspace`, …

Limitations:

- Overlay inventory is tracked from Pro UI create/remove paths (klinecharts has no public “list all overlays”).
- Function fields and non-JSON styles are not persisted.
- Round-trip of complex custom overlays depends on registered overlay templates.

```bash
npm test    # workspace normalize/round-trip unit tests
npm run build
```

## Relation to Candlex phases

| Candlex phase | Fork involvement |
| --- | --- |
| phase-3 | Bootstrap fork + pin; candlex-klp mount + stub feed |
| phase-4 | DataHub datafeed (mostly host; fork may need datafeed adapter hooks) |
| phase-5 | Persistence hooks (export/import indicators/overlays) — **primary fork work** |

Full product method: candlex-klp [`docs/HOW-WE-WORK.md`](https://github.com/dgsis-tech/candlex-klp/blob/main/docs/HOW-WE-WORK.md).
