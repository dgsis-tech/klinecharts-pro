# HOW WE WORK — klinecharts-pro (Candlex fork)

Companion product: [candlex-klp](https://github.com/dgsis-tech/candlex-klp).

## Roles (cross-repo)

| Who | This fork repo | candlex-klp |
| --- | --- | --- |
| **Planner** (candlex-klp chat) | Opens a **docs request PR** under [`docs/requests/`](requests/) with the detailed binding spec; does **not** implement Pro sources; does not merge here | Owns `docs/` phases; may push only request docs to this fork |
| **Executor / agent** (this Dev Container) | Checks out the request PR, **implements** code + fills “Final API”, pushes onto the same branch | Implements host phases after a consume tag exists |
| **Operator** | Reviews/builds in **this Dev Container**, merges, publishes consume tags | Approves phase cards; bumps `CHART_REF` / `CHART_PIN` |

## Request → implement → tag

```text
Candlex KLP Planner
  → opens PR on dgsis-tech/klinecharts-pro adding docs/requests/REQ-*.md
This Dev Container
  → fetch PR branch → implement against the request → tests/build
  → push implementation commits onto the same PR
Operator
  → merge → tag (e.g. v0.1.1-candlex.N)
candlex-klp Executor
  → bump third_party/CHART_PIN + make chart-build
```

Open requests: [`docs/requests/README.md`](requests/README.md).

## Environment

Use [`.dev/`](.dev/) + [`.devcontainer/`](.devcontainer/) — see [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md). Goal: clone → Cursor Dev Container → work, **without installing Node on the host**.

## Do not forget

- Edit Pro **here**; consume from candlex-klp.
- Planner request PR → implement in container → merge → tag → bump pin in candlex-klp.
- Pins in [`UPSTREAM.md`](UPSTREAM.md).
