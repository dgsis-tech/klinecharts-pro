# Upstream provenance — Candlex KLP product fork

| Field | Value |
| --- | --- |
| Product fork | [`github.com/dgsis-tech/klinecharts-pro`](https://github.com/dgsis-tech/klinecharts-pro) |
| Fork package version | **`0.2.1`** (`package.json`; SemVer from this release onward) |
| Upstream npm lineage | started from `@klinecharts/pro@0.1.1` |
| Upstream git | [`klinecharts/pro`](https://github.com/klinecharts/pro) (GitHub fork parent) |
| Chart core pin | **`klinecharts@9.8.12`** (Candlex D-12; do not move Pro onto 10.x in v0) |
| License | Apache-2.0 (see `LICENSE`) |
| Documented | 2026-08-09 |

This repository is the **canonical place to edit** the KLineChart Pro fork for Candlex KLP.
[`candlex-klp`](https://github.com/dgsis-tech/candlex-klp) only **consumes** a pinned git ref (tag/commit) via fetch+build or submodule — do not treat that host as the place to develop Pro sources.

## Versioning / consume tags

- Bump **`package.json` `version`** with each consumable release (SemVer):
  - **patch** `0.x.N+1` — fixes only
  - **minor** `0.(x+1).0` — additive public API / host-facing chrome (default for Candlex REQ trains)
  - **major** `1.0.0+` — breaking ChartPro / workspace contract
- Publish an annotated git tag that **matches** the package version: `v${version}` (e.g. `v0.2.0`).
- Historical pins `v0.1.1-candlex.0` … `v0.1.1-candlex.2` remain valid; **new** releases do not use the `-candlex.N` suffix.
- candlex-klp sets `third_party/CHART_PIN` / `CHART_REF` to that tag.

## Change control

- Propose changes with a **Pull Request**; the operator validates/merges in the **Dev Container** (see [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md), [`CONTRIBUTING.md`](CONTRIBUTING.md)).
- After merge, publish the matching **`v${version}`** tag when candlex-klp should consume the change; bump `CHART_PIN` there.
