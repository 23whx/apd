import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function stripTrailingSlash(url) {
  return url.replace(/\/+$/, '');
}

function toDateOnly(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry({ loc, alternates = [], lastmod, changefreq, priority }) {
  const altLines = alternates
    .map(
      (a) =>
        `    <xhtml:link rel="alternate" hreflang="${xmlEscape(a.hreflang)}" href="${xmlEscape(
          a.href
        )}" />`
    )
    .join('\n');

  return [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    altLines ? altLines : null,
    lastmod ? `    <lastmod>${xmlEscape(lastmod)}</lastmod>` : null,
    changefreq ? `    <changefreq>${xmlEscape(changefreq)}</changefreq>` : null,
    priority ? `    <priority>${xmlEscape(priority)}</priority>` : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

async function fetchAllPublishedBlogTranslations({ supabaseUrl, anonKey }) {
  // Fetch from PostgREST view: blog_post_translations_with_author
  // We only need minimal fields.
  const endpoint = `${stripTrailingSlash(
    supabaseUrl
  )}/rest/v1/blog_post_translations_with_author?select=post_id,lang,slug,published_at,updated_at&published=eq.true&order=published_at.desc.nullslast`;

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: 'application/json',
  };

  const pageSize = 1000;
  let from = 0;
  const all = [];

  while (true) {
    const res = await fetch(endpoint, {
      headers: {
        ...headers,
        Range: `${from}-${from + pageSize - 1}`,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Sitemap fetch failed: ${res.status} ${res.statusText} ${text}`.trim());
    }

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;

    all.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

async function main() {
  const siteUrl = stripTrailingSlash(
    process.env.SITE_URL ||
      process.env.VITE_SITE_URL ||
      'https://acgn-personality-database.top'
  );

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY_PUBLIC;

  const nowDate = new Date().toISOString().slice(0, 10);

  const staticUrls = [
    // Core pages
    { path: '/', changefreq: 'daily', priority: '1.0' },
    { path: '/works', changefreq: 'daily', priority: '0.9' },
    { path: '/characters', changefreq: 'daily', priority: '0.9' },
    { path: '/submit', changefreq: 'weekly', priority: '0.7' },
    { path: '/about', changefreq: 'monthly', priority: '0.5' },
    { path: '/privacy', changefreq: 'monthly', priority: '0.3' },
    { path: '/terms', changefreq: 'monthly', priority: '0.3' },
    // Blog index routes
    { path: '/blog', changefreq: 'daily', priority: '0.9' },
    { path: '/en/blog', changefreq: 'daily', priority: '0.9' },
    { path: '/zh/blog', changefreq: 'daily', priority: '0.9' },
    { path: '/ja/blog', changefreq: 'daily', priority: '0.9' },
  ];

  const entries = [];

  // Static entries with simple alternates (same URL for all langs except blog indexes)
  for (const u of staticUrls) {
    const loc = `${siteUrl}${u.path}`;
    let alternates = [];

    // For blog indexes, alternates are language-specific.
    if (u.path === '/blog') {
      alternates = [
        { hreflang: 'en', href: `${siteUrl}/en/blog` },
        { hreflang: 'zh', href: `${siteUrl}/zh/blog` },
        { hreflang: 'ja', href: `${siteUrl}/ja/blog` },
        { hreflang: 'x-default', href: `${siteUrl}/blog` },
      ];
    } else if (u.path === '/en/blog' || u.path === '/zh/blog' || u.path === '/ja/blog') {
      alternates = [
        { hreflang: 'en', href: `${siteUrl}/en/blog` },
        { hreflang: 'zh', href: `${siteUrl}/zh/blog` },
        { hreflang: 'ja', href: `${siteUrl}/ja/blog` },
        { hreflang: 'x-default', href: `${siteUrl}/blog` },
      ];
    } else {
      // For non-blog static pages, language is runtime-detected, URL stays the same.
      alternates = [
        { hreflang: 'en', href: loc },
        { hreflang: 'zh', href: loc },
        { hreflang: 'ja', href: loc },
        { hreflang: 'x-default', href: loc },
      ];
    }

    entries.push(
      urlEntry({
        loc,
        alternates,
        lastmod: nowDate,
        changefreq: u.changefreq,
        priority: u.priority,
      })
    );
  }

  // Blog posts (dynamic) — only if env is available
  if (supabaseUrl && anonKey) {
    const rows = await fetchAllPublishedBlogTranslations({ supabaseUrl, anonKey });

    // Group by post_id to build hreflang alternates
    const byPost = new Map();
    for (const r of rows) {
      const postId = r.post_id;
      if (!postId || !r.lang || !r.slug) continue;
      const existing = byPost.get(postId) || { post_id: postId, langs: {}, lastmod: null };
      existing.langs[r.lang] = r.slug;
      const lm = toDateOnly(r.updated_at) || toDateOnly(r.published_at);
      if (lm && (!existing.lastmod || lm > existing.lastmod)) existing.lastmod = lm;
      byPost.set(postId, existing);
    }

    for (const post of byPost.values()) {
      const langs = post.langs || {};
      const alt = [];
      for (const [lang, slug] of Object.entries(langs)) {
        alt.push({ hreflang: lang, href: `${siteUrl}/${lang}/blog/${slug}` });
      }

      // x-default: prefer English if exists, else zh, else first
      const defaultHref =
        (langs.en && `${siteUrl}/en/blog/${langs.en}`) ||
        (langs.zh && `${siteUrl}/zh/blog/${langs.zh}`) ||
        (Object.keys(langs)[0] ? `${siteUrl}/${Object.keys(langs)[0]}/blog/${langs[Object.keys(langs)[0]]}` : null);
      if (defaultHref) alt.push({ hreflang: 'x-default', href: defaultHref });

      // Emit a <url> for each available language
      for (const [lang, slug] of Object.entries(langs)) {
        entries.push(
          urlEntry({
            loc: `${siteUrl}/${lang}/blog/${slug}`,
            alternates: alt,
            lastmod: post.lastmod || nowDate,
            changefreq: 'weekly',
            priority: '0.8',
          })
        );
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n\n` +
    entries.join('\n\n') +
    `\n\n</urlset>\n`;

  const outPath = path.resolve(__dirname, '..', 'public', 'sitemap.xml');
  await fs.writeFile(outPath, xml, 'utf8');
  console.log(`[sitemap] Generated ${entries.length} url entries -> ${outPath}`);
}

main().catch((err) => {
  console.error('[sitemap] Generation failed:', err);
  // Fail-safe: do not break build if network is flaky; keep existing sitemap.xml
  process.exitCode = 0;
});

