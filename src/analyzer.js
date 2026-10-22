/**
 * Keyword analysis: scan agenda text for housing / transportation / climate
 * topics and return matching snippets with context.
 */

function analyzeText(text, keywords) {
  const hits = [];
  const lines = text.split('\n');

  keywords.forEach((keyword) => {
    const regex = new RegExp(`.{0,50}${keyword}.{0,50}`, 'gi');
    const matches = text.match(regex);
    if (matches && matches.length) {
      const unique = [...new Set(matches.map((m) => m.trim()))];
      hits.push({ keyword, snippets: unique.slice(0, 3) });
    }
  });

  return hits;
}

module.exports = { analyzeText };