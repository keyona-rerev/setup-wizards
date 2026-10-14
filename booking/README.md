# ReRev Booking Page

A single-owner booking page (Calendly replacement). Clients pick a time and it lands on the owner's Google Calendar. A Google Sheet holds the settings and the booking log. An Apps Script web app checks free/busy live. One static file on the client's own Netlify is the page. No subscription.

Derived from the two-person booking engine. The second person is gone. EXTRA_CALENDARS is optional.

Setup wizard: https://rerev-booking-setup.netlify.app (the page file is served from its `files/index.html`).

Template Sheet ID: 1Q2fo4Uu9un-hMUqHCfnEhJsUvmhqodyp7y9fxx-XP1c
Scopes: spreadsheets, calendar, external request, send mail, container ui.
