/**
 * Date helpers that treat YYYY-MM-DD as a local calendar date.
 *
 * `new Date('2026-10-05')` parses as UTC midnight, which renders as the
 * previous day in Pacific time. These helpers keep dates local so a meeting
 * on Oct 5 prints as 05-Oct-2026 everywhere.
 */

function parseLocalDate(value) {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

function formatLocalDate(value) {
  const d = parseLocalDate(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('default', { month: 'short' });
  return `${day}-${month}-${d.getFullYear()}`;
}

function ymd(value) {
  const d = parseLocalDate(value);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

module.exports = { parseLocalDate, formatLocalDate, ymd };