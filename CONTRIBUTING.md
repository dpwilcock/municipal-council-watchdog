# Contributing to Municipal Council Watchdog

Thanks for wanting to help keep an eye on North Shore council meetings! 🏛️

This project is maintained by [Better North Shore](https://betternorthshore.ca) — a
volunteer civic advocacy group. We welcome bug reports, feature ideas and code
contributions from anyone, contributor agreement optional but appreciated.

## Ground rules

- **No secrets in the repo, ever.** All delivery config (Discord webhooks,
  email/SMTP) is read from environment variables at run time. If you need a new
  secret, add a new `COUNCIL_WATCHDOG_*` env var instead of hardcoding.
- **Don't break the scheduled runs.** This code runs weekly against live
  municipal sites (DNV, CNV, DWV). If your change alters scraper behaviour,
  say so in the PR description.
- **Keep the false-negative safety net.** A dead API or changed website must
  report loudly (`API_UNREACHABLE`, `NO_AGENDA_POSTED`) — never silently read
  as "no meeting".

## Reporting bugs

Open an issue using the bug report template. Include:

- Which municipality scraper failed (DNV / CNV / DWV)
- The exact output or error you saw
- Whether a meeting/agenda *was* actually expected (check the municipal site)

## Requesting features

Open an issue using the feature request template. The most useful requests
name the real scenario: e.g. "watch public hearings too", "add keyword X".

## Submitting code

1. Fork the repo and create a branch: `git checkout -b my-change`
2. Make your change. Run the tests:
   ```bash
   npm test
   ```
3. If you touched a scraper, run it against the live site to confirm behaviour:
   ```bash
   node src/index.js --municipality=DNV
   ```
   (That's fine — it's read-only against public data.)
4. Commit with a clear message, push, and open a pull request against `main`.

The maintainers review PRs as volunteer time allows — usually within a couple
of weeks. Small, focused PRs get reviewed fastest.

## Project layout

```
src/
  index.js        CLI entry point
  core.js         orchestration (scrape → analyze → digest → deliver)
  config.js       env-var configuration
  analyzer.js     keyword scanning
  digest.js       briefing formatting
  notify.js       Discord + email delivery
  scrapers/
    dnv.js        District of North Vancouver (Simplicity API)
    cnv.js        City of North Vancouver (PDF URL pattern)
    dwv.js        West Vancouver (headless browser, Cloudflare)
tests/            node:test unit tests
```

## Questions

Open a discussion or ask in an issue — happy to point you at the right spot.