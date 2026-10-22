/**
 * West Vancouver (DWV) agenda scraper.
 *
 * DWV's site sits behind Cloudflare; we use puppeteer-extra with the stealth
 * plugin to load the upcoming regular council meeting page, find the agenda
 * PDF link, and download it reusing the page's session.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { downloadAndExtractText } = require('./common');

function nextMonday(from = new Date()) {
  const d = new Date(from);
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

async function fetchLatestAgenda({ date, config } = {}) {
  const targetDate = date ? new Date(date) : nextMonday();
  const yy = targetDate.getFullYear().toString().slice(-2);
  const mmm = targetDate.toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const dd = targetDate.getDate().toString().padStart(2, '0');
  const urlSuffix = `${yy}${mmm}${dd}`;
  const meetingUrl = `https://westvancouver.ca/mayor-council/regular-council-meeting/${urlSuffix}`;

  // Lazy-load puppeteer so DWV (the only municipality needing it) pays the cost
  const puppeteer = require('puppeteer-extra');
  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  puppeteer.use(StealthPlugin());

  const outDir = config?.dataDir || path.join(process.cwd(), 'data', 'council-minutes');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `DWV_${targetDate.toISOString().split('T')[0]}_Agenda.pdf`);

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

    // Download with the page's session to get past Cloudflare
    const cookies = await page.cookies();
    const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const ua = await browser.userAgent();
    execSync(`curl -sL -A "${ua}" -b "${cookieStr}" -o "${outPath}" "${agendaLink}"`);

    const text = fs.existsSync(outPath) ? await require('pdf-parse')(fs.readFileSync(outPath)).then((d) => d.text) : '';
    if (!text) throw new Error('Failed to extract text from DWV agenda PDF.');

    return {
      municipality: 'DWV',
      meetingTitle: 'Regular Council Meeting',
      meetingDate: targetDate.toISOString().split('T')[0],
      sourceUrl: agendaLink,
      pdfPath: outPath,
      text,
    };
  } finally {
    await browser.close();
  }
}

module.exports = { fetchLatestAgenda, nextMonday };