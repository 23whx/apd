// Post-build guard for Google AdSense.
// vercel.json rewrites unknown paths to index.html, so a missing dist/ads.txt would still be served with
// HTTP 200 (as HTML) and AdSense would report "ads.txt not found / invalid". Fail the build instead.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLISHER_ID = 'pub-4880646654838411';
const ADS_TXT_LINE = `google.com, ${PUBLISHER_ID}, DIRECT, f08c47fec0942fa0`;
const ADSENSE_SCRIPT = `pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${PUBLISHER_ID}`;

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const errors = [];

async function read(file) {
  try {
    return await fs.readFile(path.join(distDir, file), 'utf8');
  } catch {
    return null;
  }
}

const adsTxt = await read('ads.txt');
if (adsTxt === null) {
  errors.push('dist/ads.txt is missing (it should come from public/ads.txt).');
} else {
  if (adsTxt.charCodeAt(0) === 0xfeff) errors.push('ads.txt starts with a UTF-8 BOM; save it without BOM.');
  if (/<html/i.test(adsTxt)) errors.push('ads.txt contains HTML.');
  const lines = adsTxt.split(/\r?\n/).map((l) => l.trim());
  if (!lines.includes(ADS_TXT_LINE)) errors.push(`ads.txt must contain the line:\n    ${ADS_TXT_LINE}`);
}

const indexHtml = await read('index.html');
if (indexHtml === null) {
  errors.push('dist/index.html is missing.');
} else {
  const head = indexHtml.split(/<\/head>/i)[0];
  const tags = head.match(/<script[^>]*adsbygoogle\.js[^>]*>/gi) ?? [];
  if (tags.length !== 1) {
    errors.push(`Expected exactly one AdSense <script> in <head>, found ${tags.length}.`);
  } else {
    const tag = tags[0];
    if (!tag.includes(ADSENSE_SCRIPT)) errors.push(`AdSense script must load ${ADSENSE_SCRIPT}`);
    if (!/\basync\b/.test(tag)) errors.push('AdSense script must be async.');
    if (!/crossorigin="anonymous"/.test(tag)) errors.push('AdSense script must have crossorigin="anonymous".');
  }
}

if (errors.length) {
  console.error('\n[verify-ads] AdSense check failed:\n' + errors.map((e) => `  - ${e}`).join('\n') + '\n');
  process.exit(1);
}
console.log('[verify-ads] ads.txt and AdSense <head> script OK');
