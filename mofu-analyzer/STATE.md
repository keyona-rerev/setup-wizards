# mofu-analyzer wizard state
product_repo: keyona-rerev/mofu-content-analyzer
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
notes: audit read repo tree, README, netlify.toml, package.json, analyze-background.js, analyze-status.js. Env vars found: ANTHROPIC_API_KEY, RESEND_API_KEY, RESEND_FROM, LEAD_NOTIFY_EMAIL. Hardcoded REPORT_BASE_URL (Keyona site) and default notify email in analyze-background.js: client must edit.
