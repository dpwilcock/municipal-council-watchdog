/**
 * Central orchestration: pick the municipality scraper, run the keyword
 * analysis, build a digest and (optionally) deliver it.
 */

const scrapers = require('./scrapers');
const { analyzeText } = require('./analyzer');
const { buildDigest } = require('./digest');
const { configure } = require('./config');

async function runWatchdog({ municipality, date, notify = false }) {
  const config = configure();
  const muni = String(municipality).toUpperCase();

  if (!scrapers[muni]) {
    throw new Error(
      `Unknown municipality "${muni}". Supported: ${Object.keys(scrapers).join(', ')}`
    );
  }

  // 1. Fetch the latest agenda PDF for the municipality
  const agenda = await scrapers[muni].fetchLatestAgenda({ date, config });
  if (!agenda) {
    throw new Error(`No agenda found for ${muni}`);
  }

  // 2. Scan the agenda text for topics
  const hits = analyzeText(agenda.text, config.keywords);

  // 3. Build the briefing digest
  const digest = buildDigest({
    municipality: agenda.municipality,
    meetingTitle: agenda.meetingTitle,
    meetingDate: agenda.meetingDate,
    sourceUrl: agenda.sourceUrl,
    hits,
    generatedAt: new Date(),
  });

  // 4. Deliver (stdout always; Discord/email only when requested + configured)
  if (notify && config.delivery) {
    const { notifyDiscord, notifyEmail } = require('./notify');
    if (config.delivery.discordWebhookUrl) {
      await notifyDiscord(config.delivery.discordWebhookUrl, digest);
    }
    if (config.delivery.email) {
      await notifyEmail(config.delivery.email, digest);
    }
  }

  return { digest: digest.body, exitCode: 0 };
}

module.exports = { runWatchdog };