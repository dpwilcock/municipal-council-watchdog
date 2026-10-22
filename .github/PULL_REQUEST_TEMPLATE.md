## Summary

What does this PR do, and why? One or two sentences is perfect.

## Type of change

- [ ] Bug fix (scraper, analyzer, or delivery)
- [ ] New feature (new municipality, new keyword, new channel, etc.)
- [ ] Documentation / tests
- [ ] Dependencies / tooling

## How was it tested?

- [ ] `npm test` passes
- [ ] Ran `node src/index.js --municipality=<DNV|CNV|DWV>` against the live site
- [ ] Not applicable (docs/tooling only)

If you ran a scraper, note the output you saw (e.g. `NO_AGENDA_POSTED`,
`MEETING_TITLE: ...`) — that helps reviewers confirm expected behaviour.

## Does this change scraper behaviour?

- [ ] No
- [ ] Yes — describe what changes and confirm the false-negative safety net is
  intact (a dead API must report loudly, never as "no meeting")

## Checklist

- [ ] No secrets, internal paths, or personal data added to the repo
- [ ] README/CONTRIBUTING updated if user-facing behaviour changed
- [ ] Code follows the existing style (small modules, env-var config)