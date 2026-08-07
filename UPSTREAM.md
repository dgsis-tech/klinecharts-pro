# Upstream provenance — Candlex KLP product fork

| Field | Value |
| --- | --- |
| Product fork | [`github.com/dgsis-tech/klinecharts-pro`](https://github.com/dgsis-tech/klinecharts-pro) |
| Upstream npm | `@klinecharts/pro@0.1.1` |
| Upstream git | [`klinecharts/pro`](https://github.com/klinecharts/pro) (GitHub fork parent) |
| Chart core pin | **`klinecharts@9.8.12`** (Candlex D-12; do not move Pro onto 10.x in v0) |
| License | Apache-2.0 (see `LICENSE`) |
| Documented | 2026-08-07 |

This repository is the **canonical place to edit** the KLineChart Pro fork for Candlex KLP.
[`candlex-klp`](https://github.com/dgsis-tech/candlex-klp) only **consumes** a pinned git ref (tag/commit) via fetch+build or submodule — do not treat that host as the place to develop Pro sources.

## Change control

- Propose changes with a **Pull Request**; the operator validates/merges in the **Dev Container** (see [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md), [`CONTRIBUTING.md`](CONTRIBUTING.md)).
- After merge, publish a **new tag** when candlex-klp should consume the change; bump `CHART_REF` there.
