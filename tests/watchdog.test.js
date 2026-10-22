const test = require('node:test');
const assert = require('node:assert');

const { analyzeText } = require('../src/analyzer');
const { buildDigest } = require('../src/digest');
const { formatLocalDate } = require('../src/dates');
const { configure } = require('../src/config');
const { nextMonday, previousMonday } = require('../src/scrapers/cnv');

test('analyzeText finds matching keywords with context', () => {
  const text = 'The zoning application for 123 Main St was received.\nParking requirements are unchanged.';
  const hits = analyzeText(text, ['Zoning', 'Parking', 'Housing']);
  const keywords = hits.map((h) => h.keyword);
  assert.ok(keywords.includes('Zoning'));
  assert.ok(keywords.includes('Parking'));
  assert.ok(!keywords.includes('Housing'));
  assert.ok(hits.find((h) => h.keyword === 'Zoning').snippets.length > 0);
});

test('whole-word matching still catches rezoning via the Rezoning keyword', () => {
  const hits = analyzeText('The rezoning application was received.', ['Rezoning', 'Zoning']);
  assert.deepStrictEqual(hits.map((h) => h.keyword), ['Rezoning']);
});

test('analyzeText returns empty hits when nothing matches', () => {
  const hits = analyzeText('Nothing here at all.', ['Housing', 'Zoning']);
  assert.strictEqual(hits.length, 0);
});

test('word boundaries: Transit does not match transition', () => {
  const hits = analyzeText('The transition period ended.', ['Transit']);
  assert.strictEqual(hits.length, 0);
});

test('word boundaries: Transit still matches real transit mentions', () => {
  const hits = analyzeText('Transit improvements were approved.', ['Transit']);
  assert.strictEqual(hits.length, 1);
  assert.strictEqual(hits[0].keyword, 'Transit');
});

test('special characters in keywords cannot crash or mismatch', () => {
  const hits = analyzeText('The C++ library was discussed at council.', ['C++']);
  assert.strictEqual(hits.length, 1);
  assert.ok(hits[0].snippets[0].includes('C++'));
});

test('buildDigest includes source and meeting info', () => {
  const digest = buildDigest({
    municipality: 'DNV',
    meetingTitle: 'Regular Meeting',
    meetingDate: '2026-10-05',
    sourceUrl: 'https://example.com/agenda.pdf',
    hits: [{ keyword: 'Zoning', snippets: ['...rezoning...'] }],
    generatedAt: new Date('2026-10-21T00:00:00Z'),
  });
  assert.match(digest.subject, /DNV/);
  assert.match(digest.body, /https:\/\/example\.com\/agenda\.pdf/);
  assert.match(digest.body, /\*\*Zoning\*\*/);
});

test('date bug: Oct 5 meeting prints 05-Oct-2026 even in Pacific time', () => {
  // new Date('2026-10-05') is UTC midnight -> 04-Oct in PDT. formatLocalDate
  // must treat the string as a local calendar date.
  assert.strictEqual(formatLocalDate('2026-10-05'), '05-Oct-2026');
});

test('configure({dataDir}) preserves keywords and delivery settings', () => {
  const prev = { ...process.env };
  process.env.COUNCIL_WATCHDOG_DISCORD_WEBHOOK_URL = 'https://discord.example/webhook';
  process.env.COUNCIL_WATCHDOG_EMAIL_TO = 'a@b.c';
  process.env.COUNCIL_WATCHDOG_KEYWORDS = 'Housing,Bike';

  try {
    const cfg = configure({ dataDir: '/tmp/council-watchdog-test' });
    assert.strictEqual(cfg.dataDir, '/tmp/council-watchdog-test');
    assert.deepStrictEqual(cfg.keywords, ['Housing', 'Bike']);
    assert.ok(cfg.delivery.discordWebhookUrl);
    assert.ok(cfg.delivery.email);
  } finally {
    process.env = prev;
  }
});

test('cnv Monday helpers return Mondays', () => {
  // 2026-10-21 is a Wednesday
  const nm = nextMonday(new Date('2026-10-21T12:00:00Z'));
  assert.strictEqual(nm.getDay(), 1);
  const pm = previousMonday(new Date('2026-10-21T12:00:00Z'));
  assert.strictEqual(pm.getDay(), 1);
});