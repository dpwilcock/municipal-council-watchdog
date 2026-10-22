/**
 * City of North Vancouver (CNV) agenda scraper.
 *
 * CNV publishes PGX agenda packages at a predictable URL pattern; we try the
 * upcoming Monday (and the previous Monday as a fallback) across several
 * filename variants.
 */

const fs = require('fs');
const path = require('path');
const { httpGet, downloadAndExtractText } = require('./common');
const { parseLocalDate, ymd } = require('../dates');

function nextMonday(from = new Date()) {
  const d = new Date(from);
  const day = d.getDay();
  const diff = day === 1 ? 7 : (1 + 7 - day) % 7;
  if (diff > 0) d.setDate(d.getDate() + diff);
  return d;
}

function previousMonday(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function filenameVariants(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const monthName = date.toLocaleString('default', { month: 'long' });
  return [
    `${year}-${month}-${day}-Regular-Agenda-Package-for-${monthName}-${date.getDate()}-${year}.pdf`,
    `${year}-${month}-${day}-Agenda-for-Regular-Council-Meeting-${monthName}-${date.getDate()}-${year}.pdf`,
    `${year}-${month}-${day}-Regular-Council-Meeting-Agenda-Package.pdf`,
  ];
}

async function exists(url) {
  try {
    const resp = await httpGet(url, 15000);
    resp.resume();
    return resp.statusCode === 200;
  } catch {
    return false;
  }
}

async function fetchLatestAgenda({ date, config } = {}) {
  const targetDate = parseLocalDate(date || nextMonday());
  const attempts = [
    { label: 'upcoming', d: targetDate },
    { label: 'previous', d: previousMonday(new Date()) },
  ];

  const outDir = config?.dataDir || path.join(process.cwd(), 'data', 'council-minutes');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const { label, d } of attempts) {
    if (label === 'upcoming' && d.getDay() !== 1) continue;
    const year = d.getFullYear();
    const base = `https://www.cnv.org/-/media/City-of-North-Vancouver/Documents/Council-Meeting-Agenda/${year}/`;

    for (const filename of filenameVariants(d)) {
      const url = base + filename;
      try {
        if (!(await exists(url))) continue;
        const dateStr = ymd(d);
        const outPath = path.join(outDir, `CNV_${dateStr}_Agenda.pdf`);
        const text = await downloadAndExtractText(url, outPath);
        return {
          municipality: 'CNV',
          meetingTitle: 'Regular Council Meeting',
          meetingDate: dateStr,
          sourceUrl: url,
          pdfPath: outPath,
          text,
        };
      } catch {
        // try next variant
      }
    }
  }

  throw new Error('NO_FUTURE_MEETING_SCHEDULED: no CNV agenda found for upcoming or previous Monday.');
}

module.exports = { fetchLatestAgenda, nextMonday, previousMonday };