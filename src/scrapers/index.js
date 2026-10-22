/**
 * Scraper registry.
 */

const dnv = require('./dnv');
const cnv = require('./cnv');
const dwv = require('./dwv');

module.exports = {
  DNV: dnv,
  CNV: cnv,
  DWV: dwv,
};