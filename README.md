# klinecharts-pro (Candlex KLP product fork)

Product fork of [KLineChart Pro](https://github.com/klinecharts/pro) for **Candlex KLP**.

| | |
| --- | --- |
| **Edit Pro sources** | **This repository** |
| **Consume pin** | [`candlex-klp`](https://github.com/dgsis-tech/candlex-klp) via `make chart-build` |
| **Pins** | `@klinecharts/pro@0.1.1` lineage + **`klinecharts@9.8.12`** — [`UPSTREAM.md`](UPSTREAM.md) |
| **Process** | PRs only → operator validates in Dev Container — [`CONTRIBUTING.md`](CONTRIBUTING.md) · [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) · [`docs/HOW-WE-WORK.md`](docs/HOW-WE-WORK.md) |

## Dev Container (recommended)

No host Node/npm install required.

```bash
cp .dev/.env.example .dev/.env   # GIT_* / GITHUB_TOKEN / optional SSH keys in .dev/secrets/
bash .dev/init-host.sh           # creates Docker network go-dev + image klp-chart-dev:latest
# Cursor: Open in Container / Rebuild Container
```

Inside the container:

```bash
npm ci          # also run automatically on first postStart if node_modules missing
npm run build
```

**Never commit `.dev/.env`.**

## Build (any environment with Node 20+)

```bash
npm ci
npm run build
```

Artifacts: `dist/klinecharts-pro.js`, `dist/klinecharts-pro.umd.js`, `dist/klinecharts-pro.css`, typings.

## License

Apache License 2.0 — see [`LICENSE`](LICENSE).
