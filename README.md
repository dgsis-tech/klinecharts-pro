# klinecharts-pro (Candlex KLP product fork)

Product fork of [KLineChart Pro](https://github.com/klinecharts/pro) for **Candlex KLP**.

- **Edit Pro sources here**, not inside [`candlex-klp`](https://github.com/dgsis-tech/candlex-klp).
- Pins: lineage of `@klinecharts/pro@0.1.1` + **`klinecharts@9.8.12`** — see [`UPSTREAM.md`](UPSTREAM.md).
- Consumers pin a tag/commit (e.g. `v0.1.1-candlex.0`) and run their own `make chart-build`.

## Build

```bash
npm ci
npm run build
```

Artifacts: `dist/klinecharts-pro.js`, `dist/klinecharts-pro.umd.js`, `dist/klinecharts-pro.css`, typings.

## License

Apache License 2.0 — see [`LICENSE`](LICENSE).
