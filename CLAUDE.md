# Notes for Claude

## Git
- Work directly on `main`: commit and push there. No feature branches or PRs unless other contributors join.

## Deploy
- Netlify deploys `app/` from `main` to https://petittheftauto.netlify.app (no build step; see `netlify.toml`).
- When shipping changes to `app/`, bump `VERSION` in `app/sw.js` so players' caches refresh.
- New files in `app/` that the game needs offline go in the `SHELL` list in `app/sw.js`.
