const test = require('node:test');
const assert = require('node:assert');

const { analyzeText } = require('../src/analyzer');
const { buildDigest } = require('../src/digest');
const { nextMonday, previousMonday } = require('../src/scrapers/cnv');

test('analyzeText finds matching keywords with context', () => {
  const text = 'The rezoning application for 123 Main St was received.\nParking requirements are unchanged.';
  const hits = analyzeText(text, ['Zoning', 'Parking', 'Housing']);
  const keywords = hits.map((h) => h.keyword);
  assert.ok(keywords.includes('Zoning'));
  assert.ok(keywords.includes('Parking'));
  assert.ok(!keywords.includes('Housing'));
  assert.ok(hits.find((h) => h.keyword === 'Zoning').snippets.length > 0);
});

test('analyzeText returns empty hits when nothing matches', () => {
  const hits = analyzeText('Nothing here at all.', ['Housing', 'Zoning']);
  assert.strictEqual(hits.length, 0);
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

test('cnv Monday helpers return Mondays', () => {
  // 2026-10-21 is a Wednesday
  const nm = nextMonday(new Date('2026-10-21T12:00:00Z'));
  assert.strictEqual(nm.getDay(), 1);
  const pm = previousMonday(new Date('2026-10-21T12:00:00Z'));
  assert.strictEqual(pm.getDay(), 1);
});