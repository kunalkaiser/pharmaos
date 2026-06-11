@AGENTS.md

## Deploying the frontend (Railway)

The production frontend is the **`evidaraos-frontend`** service in the Railway
**`evidaraos`** project. It is **NOT git-auto-deploy** (no connected repo source),
so **merging to `main` does not deploy anything** — you must push a build with
`railway up`.

Deploy from a **clean checkout of `origin/main`**, never the local working tree
(it may carry uncommitted work that would ship unintentionally):

```bash
git worktree add --detach /tmp/pharmaos-deploy origin/main
cd /tmp/pharmaos-deploy
railway link -p evidaraos
railway up --service evidaraos-frontend --ci -y      # builds + deploys; exits on completion
cd - && git -C <repo> worktree remove /tmp/pharmaos-deploy --force
```

Then verify: frontend `/` returns 200 and an end-to-end route works, e.g.
`POST /api/internal/evidence-engine/protocol` (auth: `Authorization: Bearer
$EVIDARA_INTERNAL_ACCESS_TOKEN`).

Note: the evidence engine backend (`evidence-os`) is separate and **does**
auto-deploy on merge to its `main` via GitHub Actions — only this frontend needs
the manual `railway up`.
