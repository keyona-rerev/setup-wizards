# mofu-analyzer wizard state
product_repo: keyona-rerev/mofu-content-analyzer
- [x] 1 audit done
- [x] 2 steps.json written and validated
- [x] 3 versions.json written and validated
- [x] 4 local build folder ready
- [x] 5 Netlify site created (site id: 742acd6e-e762-4930-89cd-9954d4890a5a)
- [x] 6 deployed (url: https://wizard-mofu-analyzer.netlify.app)
- [x] 7 live check passed
- [x] 8 files pushed to setup-wizards (index/history blob sha match)
- [x] 9 product README link confirmed (commit 80921c308a0dd5a95900021ce17817e4ccbcef68)
- [x] 10 history lines logged
notes: Product repo hardcodes REPORT_BASE_URL (Keyona's site) and a default lead-notify address in netlify/functions/analyze-background.js; wizard tells client to change both. Env vars: ANTHROPIC_API_KEY, RESEND_API_KEY, RESEND_FROM, LEAD_NOTIFY_EMAIL.
