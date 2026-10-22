/**
 * Shared PDF helpers: download a PDF from a URL and extract its text.
 * Downloads happen in-process (no shell), so URLs are never interpreted by a
 * shell — safe even for untrusted/website-supplied links.
 */

const fs = require('fs');
const https = require('https');
const http = require('http');
const pdfParse = require('pdf-parse');

function httpGet(url, timeoutMs = 30000, cookieHeader = null) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const headers = {};
    if (cookieHeader) headers.Cookie = cookieHeader;

    const req = lib.get(url, { timeout: timeoutMs, headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(httpGet(res.headers.location, timeoutMs, cookieHeader));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      resolve(res);
    });
    req.on('timeout', () => { req.destroy(new Error('Request timed out')); });
    req.on('error', reject);
  });
}

async function downloadFile(url, dest, timeoutMs = 30000, cookieHeader = null) {
  const response = await httpGet(url, timeoutMs, cookieHeader);
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    response.pipe(file);
    file.on('finish', () => file.close(resolve));
    file.on('error', reject);
    response.on('error', reject);
  });
  return dest;
}

async function downloadAndExtractText(url, dest, timeoutMs = 30000, cookieHeader = null) {
  await downloadFile(url, dest, timeoutMs, cookieHeader);
  const dataBuffer = fs.readFileSync(dest);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

module.exports = { httpGet, downloadFile, downloadAndExtractText };