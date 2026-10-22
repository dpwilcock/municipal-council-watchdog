/**
 * District of North Vancouver (DNV) agenda scraper.
 *
 * Uses the Simplicity public API (simplicity-api.dnv.org) that replaced the
 * old app.dnv.org endpoint, with health-check + past-meeting sanity checks so
 * a broken API is reported as API_UNREACHABLE rather than a false
 * "no meeting" signal.
 */

const fs = require('fs');
const path = require('path');
const { downloadAndExtractText } = require('./common');
const { parseLocalDate, ymd } = require('../dates');

const API_BASE = 'https://simplicity-api.dnv.org';
const SEARCH_URL =
  `${API_BASE}/public/event/search/advanced?from=FROM&to=TO` +
  `&model_filters[0][type]=model.council-meeting-v3` +
  `&model_filters[0][category][]=Regular%20meeting&model_filters[0][category][]=Council%20workshop` +
  `&model_filters[0][category][]=Public%20hearing&model_filters[0][category][]=Special%20meeting` +
  `&model_filters[0][category][]=Public%20meeting&model_filters[0][category][]=Closed%20special%20meeting` +
  `&include[0]=meeting&include[1]=model&page=1&pageSize=20&sort=start_at&sortdir=asc`;

function formatUtc(d) {
  return d.toISOString().split('T')[0];
}

async function getJson(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} from ${url}`);
  return resp.json();
}

async function apiHealthCheck() {
  try {
    const result = await getJson(`${API_BASE}/public/website/domain/www.dnv.org`);
    return Boolean(result && result.guid);
  } catch {
    return false;
  }
}

async function pastMeetingsExist() {
  const to = formatUtc(new Date());
  const from = formatUtc(new Date(Date.now() - 90 * 86400000));
  try {
    const result = await getJson(
      `${API_BASE}/public/event/search/advanced?from=${from}&to=${to}` +
        `&model_filters[0][type]=model.council-meeting-v3&include[0]=meeting&page=1&pageSize=5&sort=start_at&sortdir=desc`
    );
    return (result.pagination?.total ?? 0) > 0;
  } catch {
    return false;
  }
}

async function fetchLatestAgenda({ date, config } = {}) {
  const apiAlive = await apiHealthCheck();
  if (!apiAlive) {
    throw new Error('API_UNREACHABLE: Simplicity API health check failed.');
  }

  const fromDate = ymd(parseLocalDate(date || new Date()));
  const toDate = formatUtc(new Date(Date.now() + 60 * 86400000));
  const searchUrl = SEARCH_URL.replace('FROM', fromDate).replace('TO', toDate);

  let searchResult;
  try {
    searchResult = await getJson(searchUrl);
  } catch (e) {
    throw new Error(`API_UNREACHABLE: event search failed: ${e.message}`);
  }

  if (!searchResult.results || searchResult.results.length === 0) {
    const hasPast = await pastMeetingsExist();
    if (!hasPast) {
      throw new Error('API_UNREACHABLE: no future and no past meetings found.');
    }
    throw new Error('NO_FUTURE_MEETING_SCHEDULED');
  }

  // Find the first meeting that has council documents (prefer agenda-with-reports)
  let targetMeeting = null;
  let agendaDoc = null;

  for (const meeting of searchResult.results) {
    const docIds =
      meeting.model?.fields?.find((f) => f.name === 'council_documents')
        ?.values?.map((v) => v.value) || [];

    for (const docId of docIds) {
      try {
        const resp = await fetch(`${API_BASE}/public/media/documents/${docId}`);
        const doc = await resp.json();
        if (doc.data?.council_doc_type === 'agenda-with-reports') {
          targetMeeting = meeting;
          agendaDoc = doc;
          break;
        }
        if (!agendaDoc && doc.data?.council_doc_type === 'agenda') {
          targetMeeting = meeting;
          agendaDoc = doc;
        }
      } catch {
        // try next doc
      }
    }
    if (agendaDoc?.data?.council_doc_type === 'agenda-with-reports') break;
  }

  if (!targetMeeting || !agendaDoc) {
    // Meeting scheduled but no agenda posted yet
    const first = searchResult.results[0];
    throw new Error(
      `NO_AGENDA_POSTED: ${first.event?.title || 'meeting'} on ${first.start_at?.split('T')[0] || 'unknown date'}`
    );
  }

  const pdfUrl = agendaDoc.storage_url || agendaDoc.url;
  const meetingDate = targetMeeting.start_at.split('T')[0];
  const docType =
    agendaDoc.data?.council_doc_type === 'agenda-with-reports'
      ? 'Agenda_with_reports'
      : 'Agenda';

  const outDir = config?.dataDir || path.join(process.cwd(), 'data', 'council-minutes');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `DNV_${meetingDate}_${docType}.pdf`);

  const text = await downloadAndExtractText(pdfUrl, outPath);

  return {
    municipality: 'DNV',
    meetingTitle: targetMeeting.event?.title || 'Regular Council Meeting',
    meetingDate,
    sourceUrl: pdfUrl,
    pdfPath: outPath,
    text,
  };
}

module.exports = { fetchLatestAgenda, apiHealthCheck };