# INSTALLS: which version does each client have?

Last checked: 2026-10-22 (job-wz-13).
The live list is the `installs` tab of the Task Agent Job Board sheet. This page explains how the list is made and shows what was found.

## How we find a version (method)

We do not ask clients. We read evidence. All checks are read-only.

1. Find the client. Look in the Job Board `projects` and `installs` tabs, Drive, Gmail (search only), Supabase project names, GitHub repos, Apps Script project names and Netlify sites.
2. Fingerprint the install. Use the `how_to_find` text in the product's `versions.json`. For Insight Forge, use the three checks below.
3. Match the evidence to the nearest version id in `/<slug>/versions.json`.
4. Write a version only when the evidence supports it. If we inferred it from dates, the sheet note says VERIFY.
5. If there is no evidence, leave the version blank. The note says what to check.

Rules: no passwords, keys or tokens in any file. No change to any client system. No email to a client.

## Insight Forge fingerprints

Product repo: `keyona-rerev/knowledge-loom-prismm` (versions in `setup-wizard/versions.json`).

- Check A (Supabase). List the migrations of the client's own project. Find the newest migration date.
- Check B (Supabase). Read the `automation_config` key `project_url` in the client's own project. Read only that one value.
  - If the key is missing, the database does not have the 2026-09-02 upgrade.
  - If the value points at the Prismm project and not the client's own project, the install needs the 2026-09-02 database upgrade.
- Check C (client repo). Read the newest commit and the workflow files. Check if `vite.config.ts` `base` and `src/App.tsx` `basename` still say `/knowledge-loom-prismm/`.

Never use `keyona-rerev/knowledge-loom-gen`. It is old and is not a client install.

Upgrade steps page for Insight Forge: https://insight-forge-setup-wizard.netlify.app/history.html

## Clients

### Prismm

| Product | Version found | Behind current? |
|---|---|---|
| Insight Forge (repo `keyona-rerev/knowledge-loom-prismm`, Supabase `bzykoqpjbzaojpbroelu`) | 2026-06-13 (VERIFY) | yes (database upgrade 2026-09-02 not applied) |
| Prismm Sequence Review (repo `keyona-rerev/prismm-sequence-review`) | 2026-07-17 (VERIFY, from commit dates) | no |
| OR Booking Engine (repo `keyona-rerev/template-fork-custom-prismm-booking-`) | unknown: check the Apps Script deployment descriptions and the repo newest commit | unknown |

Insight Forge evidence:
- Check A: the newest migration in the live project is 20260902230701 (draft_visuals_canvas_dimensions).
- The repo also has 20260902233000_route_cron_jobs_through_automation_config. The live project does not list it.
- Check B: `automation_config` has the keys `app_url` and `cron_fire_secret`. It has no `project_url`. So the 2026-09-02 upgrade is not applied.
- Check C: the newest commit is 2026-09-30. The workflows are `deploy-pages.yml` and `main.yml`. `base` and `basename` say `/knowledge-loom-prismm/`. This is correct for Prismm's own copy.
- The Gmail GitHub notices show the "Deploy to Supabase" workflow failed on every run found, up to 2026-09-04. This can explain why the migration is not applied.
- Prismm's own daily jobs call Prismm's own project, so nothing sends data to the wrong project. The database upgrade is still open.
- Upgrade steps: https://insight-forge-setup-wizard.netlify.app/history.html (version 2026-09-02).

### Founders Playground

| Product | Version found | Behind current? |
|---|---|---|
| Insight Forge (client repo `kzobre/knowledge-loom-fp`) | 2026-09-02 (VERIFY, from the repo) | unknown |

- The client repo is `kzobre/knowledge-loom-fp`. Its newest commit is 2026-09-02 (merge of the multi-tenant changes). Gmail shows the "Deploy to Supabase" run for that commit failed.
- The repo has the 20260902233000 migration file. The database may not have it.
- Check C: `vite.config.ts` `base` still says `/knowledge-loom-prismm/`. Check if the site works at its own address.
- `keyona-rerev/Founder-s-Playground-Content-App-` is a README-only repo (one commit, 2025-10-08). It is not the install.
- The client Supabase project is not in Keyona's Supabase account list. Checks A and B were not possible.
- Unknown: check the client's project (A and B below).

### Wills & Trusts LLC (Law Talk)

| Product | Version found | Behind current? |
|---|---|---|
| Insight Forge | unknown: check where the instance lives | unknown |

- Evidence: the Drive notes "Insight Forge Setup Review" (2026-08-14) say Keyona builds an automation instance for the Law Talk client. Username login: `lawtalk`.
- No repo was found in `keyona-rerev` or by search. No Supabase project was found in Keyona's account. The meeting said client accounts would use client email addresses, so the project may be in the client's own account.
- Unknown: check the client's GitHub and Supabase accounts, then run checks A, B and C.

### SisterGolf

| Product | Version found | Behind current? |
|---|---|---|
| Insight Forge | unknown: no instance found | unknown |
| Business Onboarding Intake | unknown: check the router table in Wayfinder | unknown |
| Outbox (SisterGolf copy) | unknown: check the Apps Script deployments | unknown |

- Insight Forge: the Drive notes of 2026-06-15 say Keyona plans to copy the app for Sister Golf. No repo or project was found. This may not be built yet.
- Business Onboarding Intake: Keyona's saved notes say SisterGolf is the first client. Not confirmed by a document.
- Outbox: an Apps Script project for SisterGolf exists. The Apps Script tool was down, so deployments were not read.

### Lanyard Health (Kay)

| Product | Version found | Behind current? |
|---|---|---|
| Lanyard Nurture System | unknown: check the Apps Script deployments | unknown |

- Evidence: Apps Script project "Lanyard Nurture System" and Netlify site `lanyard-nurture-setup-wizard`.

### BlackTech Capital

| Product | Version found | Behind current? |
|---|---|---|
| Two-Person Booking Link | unknown: check the Apps Script deployments | unknown |

- Evidence: Apps Script project "Copy of BTC Booking Engine (Keyona + Bryan)" and Netlify sites `btc-booking-page` and `btc-booking-link-setup-wizard`.

## Per-client checklist for anything unknown

Do these read-only checks. Do not change anything in a client system.

1. Insight Forge, Supabase (checks A and B). In the client's Supabase project, open Database, Migrations. Note the newest date. In the SQL Editor run `select value from public.automation_config where key = 'project_url';` and read only that value. No row means the 2026-09-02 upgrade is missing.
2. Insight Forge, repo (check C). Open the client repo. Read the newest commit date. Open `vite.config.ts` and `src/App.tsx`. Note if they still say `/knowledge-loom-prismm/`. Open `.github/workflows` and the last "Deploy to Supabase" run.
3. Apps Script products. Open the client's Apps Script project. Open Deploy, Manage deployments. Write down the newest deployment description and date. Match it to `/<slug>/versions.json`.
4. Repo products. Open the client's repo. Write down the newest commit date and the newest tag. Match them to `/<slug>/versions.json`.

Then update the `installs` row. If the version came from dates only, write VERIFY in the notes.
If a client is behind, open the product's `history.html` (for example `https://wizard-<slug>.netlify.app/history.html`) and follow the steps for the missing versions.
