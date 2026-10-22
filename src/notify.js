/**
 * Delivery: Discord webhook + SMTP email (both optional, env-configured).
 */

const https = require('https');
const http = require('http');

async function post(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request(
      u,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => (res.statusCode >= 400 ? reject(new Error(`HTTP ${res.statusCode}: ${data}`)) : resolve(data)));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function notifyDiscord(webhookUrl, digest) {
  const message = `**${digest.subject}**\n\n${digest.body}`;
  await post(webhookUrl, { content: message });
  return true;
}

async function notifyEmail(emailConfig, digest) {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port || 587,
    secure: emailConfig.smtp.port === 465,
    auth: emailConfig.smtp.user ? { user: emailConfig.smtp.user, pass: emailConfig.smtp.pass } : undefined,
  });
  await transporter.sendMail({
    from: emailConfig.from || emailConfig.smtp.user,
    to: emailConfig.to,
    cc: emailConfig.cc || undefined,
    subject: digest.subject,
    text: digest.body,
  });
  return true;
}

module.exports = { notifyDiscord, notifyEmail };