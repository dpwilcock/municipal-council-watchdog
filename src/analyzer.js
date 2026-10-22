/**
 * Keyword analysis: scan agenda text for housing / transportation / climate
 * topics and return matching snippets with context.
 *
 * Keywords are escaped and matched as whole words (bounded by non-word
 * characters), so "Transit" does not match "transition", and a keyword with
 * regex-special characters (e.g. "C++") cannot crash the pattern.
 */

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function boundedPattern(keyword) {
  return `(?<![A-Za-z0-9_])${escapeRegex(keyword)}(?![A-Za-z0-9_])`;
}

function analyzeText(text, keywords) {
  const hits = [];

  keywords.forEach((keyword) => {
    const re = new RegExp(boundedPattern(keyword), 'gi');
    if (!text.match(re)) return;

    const snippets = [];
    const seen = new Set();
    for (const m of text.matchAll(new RegExp(boundedPattern(keyword), 'gi'))) {
      const start = Math.max(0, m.index - 50);
      const end = Math.min(text.length, m.index + m[0].length + 50);
      const snip = text.slice(start, end).replace(/\s+/g, ' ').trim();
      if (!seen.has(snip)) {
        seen.add(snip);
        snippets.push(snip);
      }
      if (snippets.length >= 3) break;
    }

    hits.push({ keyword, snippets });
  });

  return hits;
}

module.exports = { analyzeText };