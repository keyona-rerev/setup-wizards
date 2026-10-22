# prismm-renderer wizard state
product_repo: keyona-rerev/prismm-renderer
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
notes: audit: Express + Puppeteer service, POST /render (x-api-key header, env RENDER_API_KEY), GET /health, PORT env. Dockerfile on ghcr.io/puppeteer/puppeteer:22; package.json puppeteer ^21 (VERIFY mismatch). No README. Default branch main. Newest commit ad8b616 2026-07-05.
