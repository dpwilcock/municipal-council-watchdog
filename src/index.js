#!/usr/bin/env node

/**
 * council-watchdog — Municipal council agenda watchdog for Better North Shore.
 *
 * Tracks regular council meetings for the District of North Vancouver (DNV),
 * City of North Vancouver (CNV) and West Vancouver (DWV), downloads the
 * agenda package, scans it for housing / transportation / climate topics and
 * emits a briefing digest (stdout by default, or Discord/email when
 * configured).
 *
 * Usage:
 *   node src/index.js --municipality=DNV [--notify] [--date=YYYY-MM-DD]
 */

const { runWatchdog } = require('./core');

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};
const has = (name) => args.includes(`--${name}`);

const municipality = (flag('municipality') || 'DNV').toUpperCase();
const date = flag('date');
const notify = has('notify');

runWatchdog({ municipality, date, notify })
  .then((result) => {
    if (result && result.digest) {
      process.stdout.write(result.digest);
    }
    process.exit(result && result.exitCode ? result.exitCode : 0);
  })
  .catch((err) => {
    console.error(`council-watchdog failed: ${err.message}`);
    process.exit(1);
  });