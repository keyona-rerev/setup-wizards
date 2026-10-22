# setup-wizards

One setup wizard for each ReRev Labs product. A client opens the wizard, enters each value once, and follows the steps on their own accounts.

## Start here

| File | What it is |
|---|---|
| [`products.json`](products.json) | Registry of every product wizard: slug, repo, live URL, Netlify site id, README link status. |
| [`_template/`](_template/) | The wizard page, the version-history page, and format examples. Read `_template/README.md` first. |
| [`GAPS.md`](GAPS.md) | Products that are blocked, need a repo, or are not covered. |
| [`INSTALLS.md`](INSTALLS.md) | Which version each client has, and how to check. |
| `/<slug>/` | One folder per product: `steps.json`, `versions.json`, `index.html`, `history.html`, `STATE.md`. |

## Rules in short

- A wizard never asks for a password, key, token or secret. Clients enter those only in their own accounts.
- Every wizard keeps each value the client types once and fills it into later steps.
- Every wizard has a version history page. Write only real history.
- Every product README gets a `Setup wizard` section with the live link.

Full rules: [`_template/README.md`](_template/README.md).
