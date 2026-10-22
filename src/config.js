/**
 * Configuration, all from environment variables so nothing sensitive or
 * machine-specific lives in the repository.
 *
 *   COUNCIL_WATCHDOG_KEYWORDS   comma-separated topic keywords
 *                               (default: housing/transport keywords)
 *   COUNCIL_WATCHDOG_DATA_DIR   where downloaded PDFs are stored
 *                               (default: ./data/council-minutes)
 *   COUNCIL_WATCHDOG_DISCORD_WEBHOOK_URL   Discord webhook for digests
 *   COUNCIL_WATCHDOG_EMAIL_TO / _CC        email recipients (semicolon-sep)
 *   COUNCIL_WATCHDOG_EMAIL_FROM            sender address
 *   COUNCIL_WATCHDOG_SMTP_HOST / _PORT / _USER / _PASS   SMTP credentials
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_KEYWORDS = [
  'Housing', 'Transportation', 'Transit', 'Zoning', 'Bike', 'Cycling',
  'Density', 'OCP', 'Rezoning', 'Parking', 'Budget', 'Bylaw', 'Climate',
  'Active Transportation', 'Missing Middle', 'Multiplex', 'Bus Lane',
];

function csv(key, fallback) {
  const raw = process.env[key];
  if (!raw) return fallback;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function configure(overrides = {}) {
  const dataDir =
    overrides.dataDir ||
    process.env.COUNCIL_WATCHDOG_DATA_DIR ||
    path.join(process.cwd(), 'data', 'council-minutes');

  const delivery = {
    discordWebhookUrl: process.env.COUNCIL_WATCHDOG_DISCORD_WEBHOOK_URL || null,
    email: process.env.COUNCIL_WATCHDOG_EMAIL_TO
      ? {
          to: process.env.COUNCIL_WATCHDOG_EMAIL_TO,
          cc: process.env.COUNCIL_WATCHDOG_EMAIL_CC || '',
          from: process.env.COUNCIL_WATCHDOG_EMAIL_FROM || '',
          smtp: {
            host: process.env.COUNCIL_WATCHDOG_SMTP_HOST || '',
            port: Number(process.env.COUNCIL_WATCHDOG_SMTP_PORT || 587),
            user: process.env.COUNCIL_WATCHDOG_SMTP_USER || '',
            pass: process.env.COUNCIL_WATCHDOG_SMTP_PASS || '',
          },
        }
      : null,
  };

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  return {
    keywords: overrides.keywords || csv('COUNCIL_WATCHDOG_KEYWORDS', DEFAULT_KEYWORDS),
    dataDir,
    delivery,
  };
}

module.exports = { configure, DEFAULT_KEYWORDS };