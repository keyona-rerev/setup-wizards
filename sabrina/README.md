# Sabrina setup wizard

Setup wizard for the Sabrina chief-of-staff agent (Job Board Sheet + Apps Script + Gmail add-on + Dashboard + Cowork).

- `index.html` is the v3 wizard page. Do not edit it per product.
- `steps.json` holds the steps, values and the installation test. Edit this file only.
- `history.html` is the optional version history page.

Written from the live Task Agent script on 2026-10-20 (13 files).

## Deploy

Serve this folder as a static site (Netlify). `index.html` loads `steps.json` from the same folder.

## Known gaps

- The identifiers in `Code.gs` (CFG) and the lanes in `Lanes.gs` are still in the code. The wizard gives copy blocks for them. Move them to Script Properties and the legend tab, then shorten steps 7 and 8.
- The template links (Job Board, Apps Script, Client Update doc) are entered by the installer. Replace them with fixed links once the templates are final.

Install guide: https://sabrina-install.netlify.app/guide.html
