# GAPS

Items that block or limit the setup wizard suite. One line per item. Each line starts with a type.
Last updated 2026-10-22 (live session, jobs job-wz-01 to job-wz-13).

## needs_repo
Apps Script only. The GitHub MCP cannot create repos, so no README link is possible. Create a repo (or tell me which one holds the code) for each.
- needs_repo: task-agent (Job Board sheet, watcher/mailer, Dashboard template). No wizard built yet (see blocked).
- needs_repo: post-meeting-engine (Post-Meeting Intelligence Engine). No wizard built yet.
- needs_repo: piper (Reply Detection and Railway Sync). The Railway side repo is also unknown. No wizard built yet.
- needs_repo: inbox-nudger. No wizard built yet.
- needs_repo: sxsw-checkin-emailer. No wizard built yet.
- needs_repo: engagement-loop. No wizard built yet.
- needs_repo: content-engine. No wizard built yet.
- needs_repo: network-crm (structure only). No wizard built yet.
- needs_repo: email-temperature-analyzer. No wizard built yet.
- needs_repo: netlify-deploy-bridge. No wizard built yet.
- needs_repo: relationship-intelligence-system. No wizard built yet.
- needs_repo: cold-outreach-pwa (PWA for Cold Outreach). No wizard built yet.
- needs_repo: invoice-field-updater. No wizard built yet.
- needs_repo: two-person-booking. Wizard is live (older format) but the Apps Script project 'Two-Person Booking Engine (Both Free)' has no repo, so the README link cannot be added.
- needs_repo: gas-sheets-mcp backend Apps Script web app (actions listSpreadsheets, appendRows, and so on). It is not in keyona-rerev/gas-sheets-mcp, and there is no template copy link for clients. Wizard steps 3 and 4 say "follow ReRev Labs notes".
- needs_repo: btc-outreach-mcp backend Apps Script (McpActions.gs and doPost). There is no template project link for clients yet. Wizard step 5 tells clients to open a template link from ReRev Labs.
- needs_repo: gas-tasks-mcp and google-tasks-mcp Apps Script bridge (Tasksapi). Each client needs a template copy link. Send it with the wizard.
- needs_repo: rerev-comms-review and btc-comms-review. The repos are public and hold real campaign and contact data. Clients need a cleaned template repo. None exists.

## blocked
- blocked: GAS Developer MCP returned "Server not initialized" (HTTP 400) for the whole live session, and also after a refresh and 3 later tries. Scripts could not be read, so no wizard was built for the 13 Apps Script products in rows 08, 09 and 10 (listed under needs_repo). I did not guess Script Properties or triggers. Re-run those rows when the GAS MCP session works again. Only inbox-nudger has a started STATE.md in keyona-rerev/setup-wizards.
- blocked: job-wz-08 (task-agent, post-meeting-engine, piper, inbox-nudger) not done: GAS MCP down.
- blocked: job-wz-09 (sxsw-checkin-emailer, engagement-loop, content-engine, network-crm, email-temperature-analyzer) not done: GAS MCP down, no repos.
- blocked: job-wz-10 (netlify-deploy-bridge, relationship-intelligence-system, cold-outreach-pwa, invoice-field-updater) not done: GAS MCP down, no repos. Only two-person-booking was registered.
- blocked: the custom Google Sheets MCP also returned "Server not initialized". History lines and installs rows were written through the separate Google Sheets connector instead. Job rows 02 to 11 were NOT set to done where a product is missing; see the final report.
- blocked: Tool Registry in Wayfinder Supabase (project ueosmjwumqqyswmnbyji) has no tool table (tables: projects, tech_stack_items, github_repos and others). The gap check used the Drive sheet "Keyona's Tool Registry" (sheet id 1ol8Yvpe454T4yHpEgy8PFjOAJvfyUDrKesgD_wM7m4o, last modified 2026-07-04, 33 rows). It may be older than the live registry. The Apps Script copy could not be read (GAS MCP down).
- blocked: Apps Script deployments for client installs (Outbox, Lanyard Nurture, BTC booking, OR booking) not read, so client versions for those are unknown.
- blocked: Insight Forge fingerprint of the Founders Playground client: the Supabase project of kzobre/knowledge-loom-fp is not in Keyona's account, so only repo evidence was used.
- blocked: GitHub "Deploy to Supabase" workflow fails in keyona-rerev/knowledge-loom-prismm and kzobre/knowledge-loom-fp. The 2026-09-02 migration is not applied in the Prismm live database.

## superseded
- superseded: keyona-rerev/knowledge-loom-gen is superseded by the Insight Forge wizard (https://insight-forge-setup-wizard.netlify.app). Legacy, no client install wizard, not linked anywhere.
- superseded: founders-playground-content-app (keyona-rerev/Founder-s-Playground-Content-App-, README only) is folded into the insight-forge entry in products.json. The real client repo is kzobre/knowledge-loom-fp.
- superseded: keyona-rerev/youtube-transcript-mcp is non-canonical (unmodified Cloudflare Workers fork, 1 tool). The youtube wizard uses keyona-rerev/youtube-mcp-server.
- superseded: google-tasks-mcp and gas-tasks-mcp are one product (repo keyona-rerev/gas-tasks-mcp). Two wizards exist. The README links https://wizard-gas-tasks-mcp.netlify.app. Choose one; delete the other Netlify site (wizard-google-tasks-mcp, site 7cb7dfbb-aad0-450a-bfa1-64655fa9fb47) if you keep the first.
- superseded: or-booking-engine wizard overlaps the older wizard custom-booking-link-setup-wizard.netlify.app. Decide which to keep.
- superseded: keyona-rerev/i-have-adhd is a fork of ayghri/i-have-adhd (upstream has newer commits). Confirm clients install from the fork.
- superseded: keyona-rerev/claude-skillz is a fork of NTCoding/claude-skillz with no license file. Check terms before you give it to clients.
- superseded: stakeholder-hub is a static BlackTech Capital fund-deck and marketing site (Vite/React), not a stakeholder CRM. The name does not match. Confirm the product identity.

## secret found (values not recorded; rotate and move to private config)
- secret found: keyona-rerev/prismm-sequence-review (README.md, WORKFLOW.md, index.html): dashboard gate phrase in plain text in a public repo.
- secret found: keyona-rerev/rerev-comms-review (README.md, index.html): hardcoded site password in a public repo.
- secret found: keyona-rerev/btc-comms-review (index.html): hardcoded site password in a public repo.
- secret found: keyona-rerev/super-connector-app (config.js, HANDOFF.md): API access code hardcoded in a public repo and a public browser file. Rotate SC_API_KEY.
- secret found: keyona-rerev/wayfinder (assets/config.js): Supabase anon key and Keyona's project name; the schema gives the anon role full access. Also scripts/migrate_tool_registry.py holds Tool Registry rows.
- secret found: a Drive document titled "Katherine Password for Insight Forge Login" holds a plain-text password. Delete it and rotate the password.
- secret found: no authentication on the /mcp endpoint of open-loops-mcp, gas-tasks-mcp, gas-dev-mcp and super-connector-mcp (anyone with the URL can use the tools). Wizards tell clients to keep the URL private. Add a bearer check in the product code.
- secret found: repo keyona-rerev/gas-dev-mcp commits node_modules despite .gitignore (gas-tasks-mcp may too; VERIFY).

## unregistered tools (Tool Registry rows with no row in products.json)
Source: Drive sheet "Keyona's Tool Registry" (see blocked). Registered tools that have a wizard: T001, T002, T003, T004, T008, T014, T016, T026, T028, T029, T033 (T026 mapping to proposals-server is VERIFY). These 21 registered rows have no row in products.json:
- unregistered tool: T005 LinkedIn Content Engine (prismm-renderer covers only the renderer part).
- unregistered tool: T006 BTC Compliance Manager.
- unregistered tool: T007 ReRev Initiatives Database.
- unregistered tool: T009 Our Little Adventures.
- unregistered tool: T010 Prismm ToFu Command.
- unregistered tool: T011 Prismm MoFu Command.
- unregistered tool: T012 Prismm Relationship Manager.
- unregistered tool: T013 Year of 1000 Rejections Workshop.
- unregistered tool: T015 Keyona's Tool Registry.
- unregistered tool: T017 Content Idea Capture System.
- unregistered tool: T018 Post-Meeting Intelligence Engine (row job-wz-08, blocked).
- unregistered tool: T019 Prismm ABM Matrix.
- unregistered tool: Prismm ICP Master List (row has no ID).
- unregistered tool: T020 TikTok Transcription Worker (Railway cron; the tiktok wizard is the TikTok MCP, VERIFY if they are the same).
- unregistered tool: T022 Phoebe Agent.
- unregistered tool: T023 Network CRM Dashboard (row job-wz-09, blocked).
- unregistered tool: T025 BTC Webinar Outreach Tracker (planned).
- unregistered tool: T027 Fathom Follow-Up System (Constance).
- unregistered tool: T030 Scholarship Reality.
- unregistered tool: T031 Competitive Benchmarker.
- unregistered tool: T032 Recruiting Timeline Checker.
- unregistered tool: wizards exist for products that are not in the registry snapshot: youtube, open-loops-mcp, btc-outreach-mcp, prismm-outreach-mcp, super-connector-mcp, wayfinder, stakeholder-hub, capacity-cart, rerev-tapestry-tool, linkedin-warm-intro-finder, make-a-playlist, html-publisher, prismm-renderer, business-onboarding-intake, claude-skillz, i-have-adhd, btc-comms-review, rerev-comms-review, gas-sheets-mcp backend, tiktok. Add them to the registry.

## clients to identify
- clients to identify: Wills & Trusts LLC (Law Talk): Insight Forge instance location not found (no repo, no Supabase project). Check the client's own GitHub and Supabase.
- clients to identify: Founders Playground: the Supabase project behind kzobre/knowledge-loom-fp is not reachable. Version 2026-09-02 is inferred from the repo (VERIFY).
- clients to identify: SisterGolf: Insight Forge copy (planned, not found); Business Onboarding Intake and Outbox installs have no version evidence.
- clients to identify: Lanyard Health (Kay) Lanyard Nurture System and BlackTech Capital Two-Person Booking Link: versions unknown (GAS MCP down). Check the Apps Script Deployments page.
- clients to identify: 2 GitHub forks of founder-fork-html-publisher are not identified.
- clients to identify: no client installs were found for gas-dev-mcp, gas-sheets-mcp, gas-tasks-mcp, google-tasks-mcp, github-mcp, tiktok, youtube, open-loops-mcp, prismm-outreach-mcp, btc-outreach-mcp, prismm-renderer, proposals-server, super-connector, super-connector-mcp, capacity-cart, eligibility-screen, online-report-card, mofu-analyzer, make-a-playlist, wayfinder, stakeholder-hub, claude-skillz, i-have-adhd, linkedin-warm-intro-finder, rerev-comms-review. See /INSTALLS.md.
