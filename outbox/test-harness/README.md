# Outbox test harness

`run.js` runs the Outbox test suite (`Test.gs`, `runAllTests()`) on your computer, with no Google access.

## Run

    node run.js ./master            # all tests
    node run.js ./master T04,T08    # only some areas

`./master` is a folder holding every `.gs` and `.html` file of an Outbox project (including `Mail.gs` and `Test.gs`). Needs Node 16 or newer. Set `SIM_VERBOSE=1` to see Logger output.

## What is mocked

Sheets (in memory, with text/number/date coercion), Gmail (nothing is sent), Utilities, HtmlService, Cache, Properties, LockService, triggers, CardService. Mail.gs `TEST_MODE` also routes sends to a test_mail log.

## What it does not prove

- Real Gmail behavior: search syntax, thread matching, auto-reply headers, send-as aliases.
- Real Sheets quirks: type coercion, quotas, speed.
- Real LockService contention between two live executions.
- Add-on cards, web app deployment URLs, OAuth scopes, triggers actually firing.

A green simulator run is not a green Google run. After authorizing the script once, run `runAllTests()` in the Apps Script editor to confirm. The first real run may differ.
