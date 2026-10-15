// Build-time prerender of page metadata and crawlable content.
//
// Every route is served from the same index.html, so crawlers that don't execute JavaScript (Bing, most AI
// search crawlers, social link previews) — and Google's first crawl pass — would otherwise see the home
// page's <title> and description on every URL. This script writes dist/<route>/index.html for each public
// page, with that page's title, description, canonical, Open Graph tags and a plain-HTML summary with links
// inside #root. React replaces #root on load, so users get the normal app.
//
// Wording mirrors the English variants in src/lib/seo.ts; keep the two in sync.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MBTI_TYPES, SITE_URL, loadSiteData } from './site-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');
const SUFFIX = ' | APD';
const HTML_LANG = { en: 'en', zh: 'zh-CN', ja: 'ja' };

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const clamp = (text, max = 158) => {
  const plain = String(text ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_`>~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
};

/** "Light Yagami (夜神月)" — English first, plus one alternate script (mirrors displayName in seo.ts). */
const displayName = (en, cn, jp) => {
  const unique = [...new Set([en, cn, jp].filter((n) => n && String(n).trim()).map((n) => String(n).trim()))];
  if (unique.length === 0) return 'Unknown';
  return unique.length > 1 ? `${unique[0]} (${unique[1]})` : unique[0];
};

function setMeta(html, attr, key, value) {
  const re = new RegExp(`<meta\\s+${attr}="${key.replace(/[.:]/g, '\\$&')}"\\s+content="[^"]*"\\s*/?>`);
  const tag = `<meta ${attr}="${key}" content="${esc(value)}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

function render(template, page) {
  const title = `${page.title}${SUFFIX}`;
  const url = `${SITE_URL}${page.path}`;
  let html = template
    .replace(/<html lang="[^"]*">/, `<html lang="${HTML_LANG[page.lang ?? 'en']}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = setMeta(html, 'name', 'description', page.description);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', page.description);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:type', page.ogType ?? 'website');
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', page.description);
  if (page.image) {
    html = setMeta(html, 'property', 'og:image', page.image);
    html = setMeta(html, 'property', 'og:image:secure_url', page.image);
    html = setMeta(html, 'name', 'twitter:image', page.image);
    // The default image's size tags don't describe this image
    html = html.replace(/\s*<meta property="og:image:(width|height|type)" content="[^"]*" \/>/g, '');
  }
  if (page.noindex) {
    html = setMeta(html, 'name', 'robots', 'noindex, follow');
  } else {
    html = html.replace('</head>', `    <link rel="canonical" href="${esc(url)}" />\n  </head>`);
  }
  if (page.body) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root"><main class="max-w-7xl mx-auto px-4 py-12 text-white">${page.body}</main></div>`
    );
  }
  return html;
}

const link = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`;
const list = (items) => (items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '');

async function main() {
  let template;
  try {
    template = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');
  } catch {
    console.warn('[prerender] dist/index.html not found; run vite build first. Skipping.');
    return;
  }

  const { works, characters, summaries, blog } = await loadSiteData();
  const pages = [];

  const summaryById = new Map((summaries ?? []).map((s) => [s.character_id, s]));
  const workById = new Map((works ?? []).map((w) => [w.id, w]));
  const charsByWork = new Map();
  for (const c of characters ?? []) {
    const list_ = charsByWork.get(c.work_id) ?? [];
    list_.push(c);
    charsByWork.set(c.work_id, list_);
  }
  const charName = (c) => displayName(c.name_en, c.name_cn, c.name_jp);
  const workName = (w) => displayName(w.name_en, w.name_cn, w.name_jp);

  // Static pages
  pages.push(
    {
      path: '/works',
      title: 'Anime, Manga & Game Works – Character Personality Types',
      description: 'Browse anime, manga, games and novels and see the community-voted MBTI, Enneagram and Yi Jing types of their characters.',
      body: works
        ? `<h1>Anime, manga, game and novel works</h1>${list(works.map((w) => link(`/works/${w.id}`, workName(w))))}`
        : null,
    },
    {
      path: '/characters',
      title: 'Anime & Game Characters MBTI Database',
      description: 'Community-voted MBTI, Enneagram, instinctual variant, tritype and Yi Jing hexagram types for anime, manga, game and novel characters.',
      body: characters
        ? `<h1>Characters</h1>${list(characters.slice(0, 500).map((c) => link(`/characters/${c.id}`, charName(c))))}`
        : null,
    },
    {
      path: '/mbti',
      title: 'MBTI Anime & Game Characters by Type',
      description: 'Browse anime, manga, game and novel characters by their community-voted MBTI type: INTJ, INTP, ENTJ, ENTP, INFJ, INFP, ENFJ, ENFP and more.',
      body: `<h1>Characters by MBTI type</h1>${list(MBTI_TYPES.map((t) => link(`/mbti/${t.toLowerCase()}`, `${t} characters`)))}`,
    },
    { path: '/about', title: 'About APD', description: 'About the ACGN Personality Database: an open, community-driven project for analysing the personalities of anime, manga, game and novel characters.' },
    { path: '/privacy', title: 'Privacy Policy', description: 'Privacy policy of the ACGN Personality Database.' },
    { path: '/terms', title: 'Terms of Service', description: 'Terms of service of the ACGN Personality Database.' }
  );

  // MBTI hubs (only when the summary view is available)
  if (summaries && characters) {
    const charById = new Map(characters.map((c) => [c.id, c]));
    for (const type of MBTI_TYPES) {
      const rows = summaries
        .filter((s) => s.top_mbti === type && charById.has(s.character_id))
        .sort((a, b) => b.vote_count - a.vote_count);
      const names = rows.map((r) => charName(charById.get(r.character_id)));
      const ex = names.slice(0, 3).join(', ');
      pages.push({
        // An empty hub is thin content: keep it out of the index until it has characters
        noindex: rows.length === 0,
        path: `/mbti/${type.toLowerCase()}`,
        title: `${type} Anime & Game Characters (${rows.length})`,
        description: `${rows.length} anime, manga, game and novel characters the community typed as ${type}${ex ? `, including ${ex}` : ''}. See each character's Enneagram, instinctual variant and Yi Jing hexagram.`,
        body: `<h1>${type} characters</h1>${list(rows.map((r, i) => link(`/characters/${r.character_id}`, names[i])))}`,
      });
    }
  }

  // Works
  for (const w of works ?? []) {
    const name = workName(w);
    const chars = charsByWork.get(w.id) ?? [];
    const summary = w.summary_md ? ` ${clamp(w.summary_md, 120)}` : '';
    pages.push({
      path: `/works/${w.id}`,
      title: `${name} Characters MBTI & Personality Types`,
      description: clamp(`MBTI, Enneagram and Yi Jing personality types for ${chars.length} ${name} characters, voted by the community.${summary}`),
      image: w.poster_url || null,
      body:
        `<h1>${esc(name)} characters: MBTI &amp; personality types</h1>` +
        (w.summary_md ? `<p>${esc(clamp(w.summary_md, 500))}</p>` : '') +
        list(
          chars.map((c) => {
            const s = summaryById.get(c.id);
            return link(`/characters/${c.id}`, charName(c)) + (s?.top_mbti ? ` — ${esc(s.top_mbti)}` : '');
          })
        ),
    });
  }

  // Characters
  for (const c of characters ?? []) {
    const name = charName(c);
    const w = workById.get(c.work_id);
    const wName = w ? workName(w) : null;
    const s = summaryById.get(c.id) ?? {};
    const types = [s.top_mbti, s.top_enneagram, s.top_subtype].filter(Boolean).join(' · ');
    const description = clamp(
      `${name}${wName ? ` from ${wName}` : ''} personality type${types ? `: ${types}` : ''}${s.vote_count ? `, based on ${s.vote_count} community votes` : ''}. See the MBTI, Enneagram, instinctual variant, tritype and Yi Jing hexagram results and join the discussion.`
    );
    pages.push({
      path: `/characters/${c.id}`,
      title: `${name} MBTI Personality Type${s.top_mbti ? `: ${s.top_mbti}` : ''}${wName ? ` | ${wName}` : ''}`,
      description,
      image: c.avatar_url || null,
      ogType: 'profile',
      body:
        `<h1>${esc(name)} MBTI personality type</h1>` +
        `<p>${esc(description)}</p>` +
        (w ? `<p>${link(`/works/${w.id}`, `${wName} characters`)}</p>` : '') +
        (s.top_mbti ? `<p>${link(`/mbti/${s.top_mbti.toLowerCase()}`, `More ${s.top_mbti} characters`)}</p>` : ''),
    });
  }

  // Blog
  const blogByLang = { en: [], zh: [], ja: [] };
  for (const p of blog ?? []) {
    if (!blogByLang[p.lang] || !p.slug) continue;
    blogByLang[p.lang].push(p);
    pages.push({
      path: `/${p.lang}/blog/${p.slug}`,
      title: p.title,
      description: clamp(p.excerpt || p.title),
      image: p.cover_image || null,
      lang: p.lang,
      ogType: 'article',
      body: `<article><h1>${esc(p.title)}</h1>${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ''}</article>`,
    });
  }
  const BLOG_INDEX = {
    en: ['Blog: MBTI, Enneagram & Character Personality Analysis', 'Articles on MBTI, the Enneagram, tritypes, Yi Jing and personality analysis of anime, manga and game characters.'],
    zh: ['博客：MBTI、九型人格与角色人格分析', '关于 MBTI、九型人格、三元组、易学，以及动漫游戏角色人格分析的文章。'],
    ja: ['ブログ：MBTI・エニアグラム・キャラクター性格分析', 'MBTI、エニアグラム、トライタイプ、易学、アニメ・ゲームキャラクターの性格分析に関する記事。'],
  };
  for (const [l, [title, description]] of Object.entries(BLOG_INDEX)) {
    pages.push({
      path: `/${l}/blog`,
      title,
      description,
      lang: l,
      body: `<h1>${esc(title)}</h1>${list(blogByLang[l].map((p) => link(`/${l}/blog/${p.slug}`, p.title)))}`,
    });
  }

  let written = 0;
  for (const page of pages) {
    // Route paths are ids/slugs from our own database; still refuse anything that could escape dist/
    if (!/^\/[\p{L}\p{N}/_.~%-]*$/u.test(page.path) || page.path.includes('..')) {
      console.warn(`[prerender] skipped unsafe path: ${page.path}`);
      continue;
    }
    const out = path.join(DIST, page.path, 'index.html');
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, render(template, page), 'utf8');
    written++;
  }
  console.log(`[prerender] wrote ${written} pages`);
}

main().catch((err) => {
  console.error('[prerender] failed:', err);
  // Prerendering is an enhancement: the SPA fallback still serves every route if it fails
  process.exitCode = 0;
});
