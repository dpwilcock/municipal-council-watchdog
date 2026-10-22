---
name: Bug report
about: Something in the watchdog isn't working
title: "[BUG] "
labels: bug
assignees: ''
---

**Municipality affected**
- [ ] DNV (District of North Vancouver)
- [ ] CNV (City of North Vancouver)
- [ ] DWV (West Vancouver)
- [ ] Other / not scraper-specific

**What happened**
Describe the failure. Paste the exact output/error, e.g. `NO_AGENDA_POSTED`,
`API_UNREACHABLE`, a stack trace, or a missing keyword in the digest.

**What was expected**
What should have happened instead?

**Was a meeting/agenda actually expected?**
Check the municipal website (e.g. dnv.org agenda page) — was there a meeting
or agenda that the watchdog missed? This matters because the watchdog is
deliberately conservative: it reports "no meeting" only when its sources
confirm none exists.

**Environment (please complete)**
- Node version: e.g. 22.x
- OS: e.g. macOS / Linux / Windows
- Command run: e.g. `node src/index.js --municipality=DNV`

**Additional context**
Anything else that might help (date/time of failure, logs, screenshots).