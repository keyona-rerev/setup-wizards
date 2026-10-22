# gas-dev-mcp wizard state
product_repo: keyona-rerev/gas-dev-mcp (default branch master, no README, no tags/releases visible)
- [x] 1 audit done
- [ ] 2 steps.json written and validated
- [ ] 3 versions.json written and validated
- [ ] 4 local build folder ready
- [ ] 5 Netlify site created (site id: ...)
- [ ] 6 deployed (url: ...)
- [ ] 7 live check passed
- [ ] 8 files pushed to setup-wizards (index/history blob sha match)
- [ ] 9 product README link confirmed (or needs_repo)
- [ ] 10 history lines logged
notes: Audit facts: index.mjs v2.2.0 (Streamable HTTP, /mcp and /health), env GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, PORT; get-token.mjs one-time OAuth on localhost:3456; scopes script.projects, script.deployments, drive.readonly. Gaps: /mcp has no auth; node_modules committed; no README.
