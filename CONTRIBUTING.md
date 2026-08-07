# Contributing — Candlex KLP Pro fork

## Golden rules

1. **This repo is the only place to edit** Pro fork sources for Candlex KLP (decision D-13 in candlex-klp).
2. **candlex-klp never becomes the edit tree** — it only consumes a pinned ref (`third_party/CHART_PIN` + `make chart-build`).
3. **All non-trivial changes land via Pull Request.** The operator validates and merges inside the Dev Container (see [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)).
4. Keep **`klinecharts@9.8.12`** until Candlex explicitly revisits D-12 (no silent jump to v10).
5. Commits: Conventional Commits in **English**.

## PR checklist

- [ ] Built with `npm ci && npm run build` in the Dev Container
- [ ] `UPSTREAM.md` still accurate if pins/provenance changed
- [ ] No secrets in `.dev/.env` committed
- [ ] Notes for candlex-klp: whether a **new tag** is required and suggested name

## Tagging for consumers

After merge, if candlex-klp should pick up the change:

```bash
git tag -a v0.1.1-candlex.N -m "candlex consume pin"
git push origin v0.1.1-candlex.N
```

Then update candlex-klp `third_party/CHART_PIN` / `CHART_REF` in a separate candlex-klp PR or phase.
