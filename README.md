# 🏛️ Council Watchdog

Automated municipal council agenda monitoring for **Better North Shore**.

The watchdog tracks regular council meetings on the North Shore, downloads the
agenda package, scans it for housing, transportation and climate items, and
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
🏛️ Council Watchdog: DNV — Regular Meeting October 5, 2026

Automated BNS Civic Vigilance Briefing
Municipality: DNV
Meeting: Regular Meeting October 5, 2026
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
4. Build the digest and optionally deliver it (Discord webhook / email).

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