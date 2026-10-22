# wayfinder wizard state
product_repo: keyona-rerev/wayfinder
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
notes: Audit: static index.html on GitHub Pages, Supabase schema in supabase/schema.sql, assets/config.js holds Supabase URL and anon key (secret found in keyona-rerev/wayfinder/assets/config.js, value not recorded). Do NOT run scripts/migrate_tool_registry.py (holds Keyona's registry rows). Default branch main. No tags. README has no wizard link yet.
