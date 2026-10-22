# 🏛️ Municipal Council Watchdog

Automated municipal council agenda monitoring for my municipal advocacy organization in BC.  (www.BetterNorthShore.ca)

The watchdog tracks regular council meetings at the three municipalities we watch and aim to contribute to.
It downloads the agenda package, scans it for housing, transportation and climate items, (our 3 priorities) and
produces a briefing digest — so the BNS team can see at a glance what council
is about to decide.

## Supported municipalities

| Code | Municipality | Source |
|------|--------------|--------|
| `DNV` | District of North Vancouver | Simplicity public API (simplicity-api.dnv.org) |
| `CNV` | City of North Vancouver | Published agenda PDF URL pattern |
| `DWV` | West Vancouver | Council meeting page (Cloudflare-protected, headless browser) |

## Quick start

```bash
npm install
node src/index.js --municipality=DNV
```

You can also run with `--date=YYYY-MM-DD` to target a specific meeting date,
and `--notify` to enable delivery (see below).

The command prints a briefing digest like:

```
🏛️ Council Watchdog: DNV — Regular Meeting

Automated BNS Municipal Digest Briefing
Municipality: DNV
Meeting: Regular Meeting
Meeting Date: 05-Oct-2026
Source: https://simplicity-api.dnv.org/...

### 🟡 Items of Interest (Housing & Transportation)
**Zoning** detected:
  - "...rezoning application 22-1234..."
```

## How it works

1. Pick a scraper for the municipality.
2. Download the latest agenda package PDF (with health checks — a failed
   downstream API is reported as such, never as a false "no meeting").
3. Extract text and scan for topic keywords.
4. Build the digest and optionally deliver it - to a Discord chat-server (webhook) and email

## Add your municipality

This project is designed to be forked and adapted. Every municipality exposes
its council agenda differently, so each one gets its own scraper — that's the
pattern:

1. **Create `src/scrapers/<code>.js`** exporting a `fetchLatestAgenda({ date,
   config })` that returns `{ municipality, meetingTitle, meetingDate,
   sourceUrl, pdfPath, text }`.
2. **Register it** in `src/scrapers/index.js` under its municipality code
   (e.g. `SURREY: surrey`).
3. **Reuse the shared PDF helpers** (`src/scrapers/common.js`): download +
   text-extract in one call, with redirect handling and timeouts built in.
4. **Test it**: `npm test`, plus a live run against your municipality's site
   (`node src/index.js --municipality=YOURCODE`).
5. **Add your row** to the Supported municipalities table and open a pull
   request.

Two rules from the BNS maintainership: **no secrets in the repo** (all
config via `COUNCIL_WATCHDOG_*` env vars) and **never silently report "no
meeting"** when your source has actually failed — a dead scraper should fail
loudly so humans notice.

Looking for inspiration? See what other municipalities are doing in
[existing PRs](https://github.com/dpwilcock/municipal-council-watchdog/pulls)
and [issues](https://github.com/dpwilcock/municipal-council-watchdog/issues).

## Configuration (all environment variables)

| Variable | Purpose |
|----------|---------|
| `COUNCIL_WATCHDOG_KEYWORDS` | Comma-separated topic keywords to scan for |
| `COUNCIL_WATCHDOG_DATA_DIR` | Where agenda PDFs are stored (default `./data/council-minutes`) |
| `COUNCIL_WATCHDOG_DISCORD_WEBHOOK_URL` | Discord webhook for digests (with `--notify`) |
| `COUNCIL_WATCHDOG_EMAIL_TO` | Email recipient(s), `;`-separated (with `--notify`) |
| `COUNCIL_WATCHDOG_EMAIL_CC` | Carbon-copy recipient(s) |
| `COUNCIL_WATCHDOG_EMAIL_FROM` | Sender address |
| `COUNCIL_WATCHDOG_SMTP_HOST` / `_PORT` / `_USER` / `_PASS` | SMTP credentials |

No secrets live in this repository — delivery configuration is read from the
environment at run time.

## Tests

```bash
npm test
```

## Project status

Operational since 2025 as part of the BNS automation stack (see
betterNorthShore.ca for the org). Scheduled runs execute on the maintainer's
machines; this repository is the public, shareable home of the code.

## License

MIT — see [LICENSE](LICENSE).
