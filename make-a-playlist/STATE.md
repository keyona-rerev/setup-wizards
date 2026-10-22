# make-a-playlist wizard state
product_repo: keyona-rerev/Make-a-playlist
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
notes: Audit: Express + Postgres API (server.js, deps express and pg only), static front end in public/, netlify.toml proxies /p /api /auth /healthz to a Railway host (hard-coded, client must replace). Default branch main. Env: DATABASE_URL (required), optional PORT, ADMIN_EMAILS, REPORT_EMAIL, NODE_ENV. No tags seen (VERIFY). Last commit 20ea0cc 2026-08-05.
