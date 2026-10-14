# ReRev Pipeline for Gmail

A deal pipeline inside the client's own Gmail (Streak replacement). The client puts a stage label such as Pipeline/Lead on a thread. A Google Sheet keeps the Deals tab and a Board tab. Labels and the Sheet stay in step both ways. A 5 minute trigger syncs. One email each morning lists deals that need a follow-up. No web app, no hosting, no subscription.

Setup wizard: https://rerev-pipeline-setup.netlify.app

Template Sheet ID: 1MQ4Weg4CTR9dwxJ5VPTDivzbNY3e1-6DhF5-xqqkwyw
Scripts (bound to the template Sheet): Config, Sync, Digest, Setup. Scopes: spreadsheets, gmail.modify, send mail, script triggers, container ui.
Not a Gmail add-on. An add-on sidebar can be a later version.
