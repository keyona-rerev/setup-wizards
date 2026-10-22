# Wizard template

This folder holds the files every product wizard is built from.

| File | What it is |
|---|---|
| `template.html` | The wizard page (v3). Copy it EXACTLY to `/<slug>/index.html`. |
| `history.html` | The version-history page. Copy it EXACTLY to `/<slug>/history.html`. |
| `steps.example.json` | Example of the `steps.json` format. |
| `versions.example.json` | Example of the `versions.json` format. |

Live preview of the template: http://setup-wizards-test.netlify.app (Netlify site id d0e2b0a5-1492-435d-bdb1-4e0e3a05f703).

Which version does my client have? See [`/INSTALLS.md`](../INSTALLS.md).

## Folder for each product

```
/<slug>/steps.json
/<slug>/versions.json
/<slug>/index.html      (exact copy of template.html)
/<slug>/history.html    (exact copy of history.html)
/<slug>/STATE.md        (progress checklist, used to resume)
```

## steps.json format

```
{
  "title": "...",
  "intro": "...",
  "variables": [ { "key", "label", "help", "placeholder", "pattern", "pattern_error", "default", "optional", "derive" } ],
  "steps": [ { "title", "instructions", "collect": ["key"], "copy": [ { "label", "text" } ], "checkbox_label", "verify_hint" } ]
}
```

- Use `{{key}}` in `instructions`, `copy` text and `verify_hint` to insert a saved value.
- `collect` lists the fields the step asks for. The step cannot be marked done until they are valid.
- `derive` builds a value from other values, for example `https://{{supabase_project_ref}}.supabase.co`.
- `optional: true` lets the client skip a value.

## Variable rules

1. The client enters each value ONCE. The wizard holds it and fills it into every later step.
2. Collect a value in the earliest step that needs it. Every step that uses a value comes after the step that collects it.
3. Variables hold PUBLIC values only: names, URLs, project refs, repo names, region, timezone.
4. NEVER define a variable for a password, API key, token, secret or service-role key. No variable name contains `key`, `secret`, `token` or `password`. The template also refuses values that look like keys (`sk-`, `eyJ`, `ghp_`, `github_pat_`, `xox`, `AKIA`, `AIza`, `SG.`, `re_`, or over 200 characters).
5. Add a `pattern` for every URL, ref or repo name.
6. Give a copy block for every `.env` line, config line and command, so the client pastes and does not retype.
7. Do not put Keyona's own values in any default. Use placeholders.
8. Before deploy, check: every `{{key}}` used is in `variables`, every variable is collected before first use, and the step count matches.

## versions.json format and version rules

```
{
  "product": "...",
  "current": "YYYY-MM-DD",
  "how_to_find": "How a client finds which version they have",
  "versions": [
    { "id": "YYYY-MM-DD", "date": "YYYY-MM-DD", "title": "...", "summary": "...",
      "upgrade_type": "none | redeploy | database | settings",
      "changes": [ { "kind": "Added | Changed | Fixed", "text": "..." } ],
      "upgrade_steps": [ { "title": "...", "text": "...", "copy": "..." } ] }
  ]
}
```

- Newest version first.
- Write ONLY real history. Build entries from repo commit dates, migration dates, tags and deployment names.
- Mark each entry you inferred from dates with the word VERIFY in its summary.
- If no real history exists, write ONE baseline entry dated the wizard release date, `upgrade_type` `none`, title `Version at first wizard release`.
- Never invent versions, dates or changes.
- Do not copy code into `versions.json`. Point to the git tag or the Apps Script deployment number.

## Release rule

When a product ships a change:

1. Add an entry to `versions.json` and bump `current`.
2. For Apps Script, create a NEW web deployment and put the version id in the deployment description.
3. For repos, create a git tag with the same id.
4. Redeploy the wizard so `history.html` shows it.

## Deploy recipe

1. Netlify MCP `netlify-project-services-updater`, operation `create-new-project`, name `wizard-<slug>`.
2. Netlify MCP `netlify-deploy-services-updater`, operation `deploy-site`, with that site id. It returns an `npx` command.
3. Run that command with Bash from the folder that holds `index.html`, `history.html`, `steps.json` and `versions.json`.

Never deploy with site id `undefined`. Always create the site first.
