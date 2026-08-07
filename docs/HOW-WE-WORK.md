# HOW WE WORK — klinecharts-pro (Candlex fork)

Companion product: [candlex-klp](https://github.com/dgsis-tech/candlex-klp).

## Roles (cross-repo)

| Who | This fork repo | candlex-klp |
| --- | --- | --- |
| **Planner** (candlex-klp chat) | May **request** changes via PR description / issue; does not merge here | Owns `docs/` phases |
| **Executor / agent** | Opens **PRs** with code/docs; does not treat `main` as direct write target for features | Implements host phases |
| **Operator** | Reviews PRs **in this Dev Container**, merges, tags consume pins | Approves phase cards; bumps `CHART_REF` |

## Environment

Use [`.dev/`](.dev/) + [`.devcontainer/`](.devcontainer/) — see [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md). Goal: clone → Cursor Dev Container → work, **without installing Node on the host**.

## Do not forget

- Edit Pro **here**; consume from candlex-klp.
- PR → validate in container → merge → tag → bump pin in candlex-klp.
- Pins in [`UPSTREAM.md`](UPSTREAM.md).
