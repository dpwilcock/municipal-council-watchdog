/**
 * West Vancouver (DWV) agenda scraper.
 *
 * DWV's site sits behind Cloudflare; we use puppeteer-extra with the stealth
 * plugin to load the upcoming regular council meeting page, find the agenda
 * PDF link, and download it reusing the page's session. The PDF is downloaded
 * in-process with Node's http(s) — never piped through a shell — so a
 * malformed link cannot become a command-injection vector.
 */

const fs = require('fs');
const path = require('path');
const { downloadAndExtractText } = require('./common');
const { parseLocalDate, ymd } = require('../dates');

function nextMonday(from = new Date()) {
  const d = new Date(from);
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

async function fetchLatestAgenda({ date, config } = {}) {
  const targetDate = parseLocalDate(date || nextMonday());
  const yy = targetDate.getFullYear().toString().slice(-2);
  const mmm = targetDate.toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const urlSuffix = `${yy}${mmm}${dd}`;
  const meetingUrl = `https://westvancouver.ca/mayor-council/regular-council-meeting/${urlSuffix}`;

  // Lazy-load puppeteer so DWV (the only municipality needing it) pays the cost
  const puppeteer = require('puppeteer-extra');
  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  puppeteer.use(StealthPlugin());

  const outDir = config?.dataDir || path.join(process.cwd(), 'data', 'council-minutes');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `DWV_${ymd(targetDate)}_Agenda.pdf`);

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const response = await page.goto(meetingUrl, { waitUntil: 'networkidle2' });
    if (response.status() === 404) {
      throw new Error('NO_FUTURE_MEETING_SCHEDULED');
    }
    const links = await page.$$eval('a', (as) =>
      as.map((a) => ({ href: a.href, text: a.textContent.trim() }))
    );
    const agendaLink = links.find(
      (l) => l.text.toLowerCase().includes('agenda') && l.href.endsWith('.pdf')
    )?.href;

    if (!agendaLink) {
      throw new Error('NO_FUTURE_MEETING_SCHEDULED: meeting page has no PDF agenda link.');
    }

    // Download with the page's session to get past Cloudflare. Using the
    // session cookie avoids re-triggering the challenge.
    const cookies = await page.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const text = await downloadAndExtractText(agendaLink, outPath, 30000, cookieHeader);

    return {
      municipality: 'DWV',
      meetingTitle: 'Regular Council Meeting',
      meetingDate: ymd(targetDate),
      sourceUrl: agendaLink,
      pdfPath: outPath,
      text,
    };
  } finally {
    await browser.close();
  }
}

module.exports = { fetchLatestAgenda, nextMonday };