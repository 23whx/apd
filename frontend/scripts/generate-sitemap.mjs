// Generates public/sitemap.xml before the build.
// Covers static pages, MBTI type hubs, every work and character page, and every published blog translation.
// Only URLs that return real, indexable content are listed (no redirects, no login-only or noindex pages).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MBTI_TYPES, SITE_URL, loadSiteData, toDateOnly } from './site-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_LANGS = ['en', 'zh', 'ja'];

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Sitemap URLs must be percent-encoded (e.g. Chinese blog slugs); encodeURI leaves already-valid URLs alone
const encodeUrl = (u) => encodeURI(decodeURI(u));

function urlEntry({ loc: rawLoc, alternates: rawAlternates = [], lastmod, changefreq, priority }) {
  const loc = encodeUrl(rawLoc);
  const alternates = rawAlternates.map((a) => ({ ...a, href: encodeUrl(a.href) }));
  return [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    ...alternates.map(
      (a) => `    <xhtml:link rel="alternate" hreflang="${xmlEscape(a.hreflang)}" href="${xmlEscape(a.href)}" />`
    ),
    lastmod ? `    <lastmod>${xmlEscape(lastmod)}</lastmod>` : null,
    changefreq ? `    <changefreq>${xmlEscape(changefreq)}</changefreq>` : null,
    priority ? `    <priority>${xmlEscape(priority)}</priority>` : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const { works, characters, summaries, blog } = await loadSiteData();
  const entries = [];

  // Static pages. These serve one URL for every language, so they carry no hreflang alternates.
  for (const [p, changefreq, priority] of [
    ['/', 'daily', '1.0'],
    ['/works', 'daily', '0.9'],
    ['/characters', 'daily', '0.9'],
    ['/mbti', 'weekly', '0.9'],
    ['/about', 'monthly', '0.4'],
    ['/privacy', 'yearly', '0.2'],
    ['/terms', 'yearly', '0.2'],
  ]) {
    entries.push(urlEntry({ loc: `${SITE_URL}${p}`, lastmod: today, changefreq, priority }));
  }

  // MBTI type hubs; once vote summaries are available, empty hubs (noindex) are left out
  const hubCounts = new Map();
  for (const s of summaries ?? []) if (s.top_mbti) hubCounts.set(s.top_mbti, (hubCounts.get(s.top_mbti) ?? 0) + 1);
  for (const type of MBTI_TYPES) {
    if (summaries && !hubCounts.get(type)) continue;
    entries.push(urlEntry({ loc: `${SITE_URL}/mbti/${type.toLowerCase()}`, lastmod: today, changefreq: 'weekly', priority: '0.8' }));
  }

  // Blog indexes: one URL per language, linked to each other
  const blogIndexAlternates = [
    ...BLOG_LANGS.map((l) => ({ hreflang: l, href: `${SITE_URL}/${l}/blog` })),
    { hreflang: 'x-default', href: `${SITE_URL}/en/blog` },
  ];
  for (const l of BLOG_LANGS) {
    entries.push(
      urlEntry({ loc: `${SITE_URL}/${l}/blog`, alternates: blogIndexAlternates, lastmod: today, changefreq: 'daily', priority: '0.8' })
    );
  }

  // Works and characters
  for (const w of works ?? []) {
    entries.push(urlEntry({ loc: `${SITE_URL}/works/${w.id}`, lastmod: toDateOnly(w.created_at) ?? today, changefreq: 'weekly', priority: '0.8' }));
  }
  const votedIds = new Set((summaries ?? []).filter((s) => s.vote_count > 0).map((s) => s.character_id));
  for (const c of characters ?? []) {
    entries.push(
      urlEntry({
        loc: `${SITE_URL}/characters/${c.id}`,
        lastmod: toDateOnly(c.created_at) ?? today,
        changefreq: 'weekly',
        // Characters with votes have the richest pages
        priority: votedIds.has(c.id) ? '0.8' : '0.6',
      })
    );
  }

  // Blog posts: each translation is its own URL, linked via hreflang
  const byPost = new Map();
  for (const r of blog ?? []) {
    if (!r.post_id || !r.lang || !r.slug) continue;
    const post = byPost.get(r.post_id) ?? { langs: {}, lastmod: null };
    post.langs[r.lang] = r.slug;
    const lm = toDateOnly(r.updated_at) || toDateOnly(r.published_at);
    if (lm && (!post.lastmod || lm > post.lastmod)) post.lastmod = lm;
    byPost.set(r.post_id, post);
  }
  for (const post of byPost.values()) {
    const langs = Object.entries(post.langs);
    const alternates = langs.map(([l, slug]) => ({ hreflang: l, href: `${SITE_URL}/${l}/blog/${slug}` }));
    const def = post.langs.en ? ['en', post.langs.en] : post.langs.zh ? ['zh', post.langs.zh] : langs[0];
    if (langs.length > 1 && def) alternates.push({ hreflang: 'x-default', href: `${SITE_URL}/${def[0]}/blog/${def[1]}` });
    for (const [l, slug] of langs) {
      entries.push(
        urlEntry({
          loc: `${SITE_URL}/${l}/blog/${slug}`,
          alternates: langs.length > 1 ? alternates : [],
          lastmod: post.lastmod ?? today,
          changefreq: 'monthly',
          priority: '0.7',
        })
      );
    }
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n\n` +
    entries.join('\n\n') +
    `\n\n</urlset>\n`;

  const outPath = path.resolve(__dirname, '..', 'public', 'sitemap.xml');
  await fs.writeFile(outPath, xml, 'utf8');
  console.log(
    `[sitemap] ${entries.length} URLs (works: ${works?.length ?? 'n/a'}, characters: ${characters?.length ?? 'n/a'}, blog translations: ${blog?.length ?? 'n/a'}) -> ${outPath}`
  );
}

main().catch((err) => {
  console.error('[sitemap] Generation failed:', err);
  // Don't break the build on a flaky network; the previous sitemap.xml stays in place
  process.exitCode = 0;
});
