#!/usr/bin/env node
// Publish a blog article straight into Supabase from the command line, without logging in as an admin.
//
// Uses the Supabase *service role* key, read from frontend/.env.publish.local (git-ignored) or the
// environment. That key bypasses row-level security: keep it on this machine only, never in frontend code.
//
// Usage:
//   node scripts/publish-article.mjs <spec.json> [--dry-run] [--draft] [--update]
//   node scripts/publish-article.mjs --list-tags        # existing tags, to keep tag spelling consistent
//   node scripts/publish-article.mjs --check            # verify credentials and author
//
// spec.json (paths are relative to the spec file):
// {
//   "slug": "intj-anime-characters",
//   "category": "mbti",
//   "tags": ["INTJ", "动漫角色"],
//   "cover": "cover.png" | "https://…" | null,      // null → default cover
//   "publish": true,                                  // false or --draft → saved as draft
//   "translations": {
//     "zh": { "title": "…", "excerpt": "…", "content": "article.zh.md" }
//   }
// }
// Local images/videos referenced from the Markdown (![alt](img/a.png), <img src="…">, <video src="…">)
// are uploaded to the blog-media bucket and their links rewritten.
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, '..');

const CATEGORIES = ['mbti', 'enneagram-types', 'enneagram-wings', 'enneagram-instincts', 'tritype', 'yixue', 'tech', 'other'];
const LANGS = ['zh', 'en', 'ja'];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

// ---------------------------------------------------------------------------------------------------------

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || line.trim().startsWith('#')) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function config() {
  loadEnvFile(path.join(FRONTEND, '.env.publish.local'));
  loadEnvFile(path.join(FRONTEND, '.env.local'));
  loadEnvFile(path.join(FRONTEND, '.env'));
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    fail(
      'Missing credentials. Create frontend/.env.publish.local with:\n' +
        '  SUPABASE_URL=https://<project>.supabase.co\n' +
        '  SUPABASE_SERVICE_ROLE_KEY=<service_role key from Supabase → Project Settings → API>'
    );
  }
  return {
    url: url.replace(/\/+$/, ''),
    serviceKey,
    siteUrl: (process.env.SITE_URL || 'https://acgn-personality-database.top').replace(/\/+$/, ''),
    defaultCover: process.env.BLOG_DEFAULT_COVER || null,
    authorId: process.env.PUBLISH_AUTHOR_ID || null,
    deployHook: process.env.VERCEL_DEPLOY_HOOK_URL || null,
  };
}

async function resolveAuthor(supabase, cfg) {
  if (cfg.authorId) return cfg.authorId;
  const { data, error } = await supabase
    .from('users')
    .select('id, username, role')
    .eq('role', 'admin')
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) fail(`Could not look up an admin author: ${error.message}`);
  if (!data?.length) fail('No admin user found. Set PUBLISH_AUTHOR_ID in frontend/.env.publish.local.');
  return data[0].id;
}

// ---------------------------------------------------------------------------------------------------------

const isRemote = (src) => /^(https?:|data:|blob:|\/)/i.test(src);

const MD_IMAGE = /(!\[[^\]]*\]\(\s*<?)([^)\s>]+)(>?(?:\s+"[^"]*")?\s*\))/g;
const HTML_SRC = /(<(?:img|video|source)\b[^>]*?\ssrc\s*=\s*["'])([^"']+)(["'])/gi;

/** Every local media path referenced by a Markdown document. */
function findLocalMedia(markdown) {
  const refs = new Set();
  for (const m of markdown.matchAll(MD_IMAGE)) refs.add(m[2]);
  for (const m of markdown.matchAll(HTML_SRC)) refs.add(m[2]);
  return [...refs].filter((r) => !isRemote(r));
}

/** Replace local media references (only inside image syntax / src attributes) using map(ref) -> url. */
function rewriteMedia(markdown, map) {
  const swap = (_m, before, ref, after) => `${before}${map(ref) ?? ref}${after}`;
  return markdown.replace(MD_IMAGE, swap).replace(HTML_SRC, swap);
}

function validateSpec(spec) {
  const errors = [];
  if (!spec.slug || !SLUG_PATTERN.test(spec.slug)) errors.push(`slug "${spec.slug}" must be lowercase letters, digits and hyphens`);
  if (!CATEGORIES.includes(spec.category)) errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  if (!Array.isArray(spec.tags) || spec.tags.length > 10) errors.push('tags must be an array of at most 10 strings');
  const langs = Object.keys(spec.translations || {});
  if (langs.length === 0) errors.push('translations must contain at least one language');
  for (const lang of langs) {
    if (!LANGS.includes(lang)) errors.push(`unsupported language "${lang}" (use ${LANGS.join(', ')})`);
    const t = spec.translations[lang];
    if (!t?.title?.trim()) errors.push(`${lang}: title is required`);
    if (!t?.content) errors.push(`${lang}: content (Markdown file path) is required`);
  }
  if (errors.length) fail(`Invalid spec:\n  - ${errors.join('\n  - ')}`);
}

async function uploadFile(supabase, absPath, folder) {
  const buf = await fs.readFile(absPath);
  const ext = path.extname(absPath).toLowerCase();
  const contentType = MIME[ext];
  if (!contentType) throw new Error(`Unsupported media type: ${absPath}`);
  // Same naming as the web editor: content hash, so identical files are stored once
  const name = `${crypto.createHash('sha256').update(buf).digest('hex')}${ext === '.jpeg' ? '.jpg' : ext}`;
  const storagePath = `${folder}/${name}`;
  const { error } = await supabase.storage.from('blog-media').upload(storagePath, buf, { contentType, cacheControl: '3600', upsert: false });
  if (error && !/already exists|duplicate/i.test(error.message || '') && String(error.statusCode) !== '409') throw error;
  return { storagePath, url: supabase.storage.from('blog-media').getPublicUrl(storagePath).data.publicUrl };
}

// ---------------------------------------------------------------------------------------------------------

async function listTags(supabase) {
  const { data, error } = await supabase.from('blog_posts').select('tags, category');
  if (error) fail(error.message);
  const counts = new Map();
  for (const row of data || []) for (const t of row.tags || []) counts.set(t, (counts.get(t) || 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  console.log(JSON.stringify({ tags: sorted.map(([tag, count]) => ({ tag, count })), categories: CATEGORIES }, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const specArg = args.find((a) => !a.startsWith('--'));
  const cfg = config();
  const supabase = createClient(cfg.url, cfg.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  if (flags.has('--list-tags')) return listTags(supabase);
  if (flags.has('--check')) {
    const author = await resolveAuthor(supabase, cfg);
    const { count, error } = await supabase.from('blog_posts').select('id', { count: 'exact', head: true });
    if (error) fail(error.message);
    console.log(`✔ Connected. ${count} posts in blog_posts. Author: ${author}`);
    return;
  }
  if (!specArg) fail('Usage: node scripts/publish-article.mjs <spec.json> [--dry-run] [--draft] [--update]');

  const specPath = path.resolve(specArg);
  const baseDir = path.dirname(specPath);
  const spec = JSON.parse(await fs.readFile(specPath, 'utf8'));
  validateSpec(spec);
  const publish = flags.has('--draft') ? false : spec.publish !== false;
  const dryRun = flags.has('--dry-run');
  const update = flags.has('--update');

  // Read content and collect local media
  const langs = Object.keys(spec.translations);
  const contents = {};
  const media = new Map(); // ref text -> absolute path (per language file dir)
  for (const lang of langs) {
    const file = path.resolve(baseDir, spec.translations[lang].content);
    if (!existsSync(file)) fail(`${lang}: content file not found: ${file}`);
    contents[lang] = (await fs.readFile(file, 'utf8')).trim();
    for (const ref of findLocalMedia(contents[lang])) {
      const abs = path.resolve(path.dirname(file), decodeURI(ref));
      if (!existsSync(abs)) fail(`${lang}: image not found: ${ref} (looked at ${abs})`);
      media.set(`${lang}|${ref}`, abs);
    }
  }
  let coverLocal = null;
  if (spec.cover && !isRemote(spec.cover)) {
    coverLocal = path.resolve(baseDir, spec.cover);
    if (!existsSync(coverLocal)) fail(`cover not found: ${coverLocal}`);
  }
  const defaultCover = cfg.defaultCover || `${cfg.siteUrl}/blog-cover-default.png`;

  // Slug conflicts
  const { data: existing, error: existingError } = await supabase
    .from('blog_posts')
    .select('id, published, published_at')
    .eq('slug', spec.slug)
    .maybeSingle();
  if (existingError) fail(existingError.message);
  if (existing && !update) fail(`slug "${spec.slug}" is already used. Choose another slug, or pass --update to overwrite that post.`);
  if (!existing && update) fail(`--update given but no post has slug "${spec.slug}".`);

  const authorId = await resolveAuthor(supabase, cfg);
  const masterLang = langs.includes('zh') ? 'zh' : langs[0];

  const summary = {
    action: existing ? 'update' : 'create',
    status: publish ? 'published' : 'draft',
    slug: spec.slug,
    category: spec.category,
    tags: spec.tags,
    cover: coverLocal ? `upload ${coverLocal}` : spec.cover || `default (${defaultCover})`,
    languages: Object.fromEntries(
      langs.map((l) => [l, { title: spec.translations[l].title, excerpt: spec.translations[l].excerpt || '', chars: contents[l].length }])
    ),
    mediaToUpload: [...new Set(media.values())],
    urls: langs.map((l) => `${cfg.siteUrl}/${l}/blog/${spec.slug}`),
  };
  console.log(JSON.stringify(summary, null, 2));
  if (dryRun) {
    console.log('\n(dry run: nothing was written)');
    return;
  }

  // Write: create the post as a draft first so media can be stored under its id
  let postId = existing?.id;
  const uploadedPaths = [];
  const created = !existing;
  try {
    if (!postId) {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([
          {
            title: spec.translations[masterLang].title.trim(),
            slug: spec.slug,
            content_md: contents[masterLang],
            category: spec.category,
            tags: spec.tags,
            published: false,
            author_id: authorId,
            default_lang: 'zh',
            article_type: 'original',
          },
        ])
        .select('id')
        .single();
      if (error) throw error;
      postId = data.id;
    }

    const folder = `posts/${postId}`;
    const urlFor = new Map();
    for (const abs of new Set(media.values())) {
      const { storagePath, url } = await uploadFile(supabase, abs, folder);
      uploadedPaths.push(storagePath);
      urlFor.set(abs, url);
      console.log(`  ↑ ${path.basename(abs)}`);
    }
    for (const lang of langs) {
      contents[lang] = rewriteMedia(contents[lang], (ref) => {
        const abs = media.get(`${lang}|${ref}`);
        return abs ? urlFor.get(abs) : undefined;
      });
    }
    let coverUrl = spec.cover && isRemote(spec.cover) ? spec.cover : defaultCover;
    if (coverLocal) {
      const { storagePath, url } = await uploadFile(supabase, coverLocal, folder);
      uploadedPaths.push(storagePath);
      coverUrl = url;
    }

    const rows = langs.map((lang) => ({
      post_id: postId,
      lang,
      slug: spec.slug,
      title: spec.translations[lang].title.trim(),
      excerpt: spec.translations[lang].excerpt?.trim() || null,
      content_md: contents[lang],
    }));
    const { error: tError } = await supabase.from('blog_post_translations').upsert(rows, { onConflict: 'post_id,lang' });
    if (tError) throw tError;

    const master = spec.translations[masterLang];
    const { error: mError } = await supabase
      .from('blog_posts')
      .update({
        title: master.title.trim(),
        content_md: contents[masterLang],
        excerpt: master.excerpt?.trim() || null,
        cover_image: coverUrl,
        category: spec.category,
        tags: spec.tags,
        published: publish,
        // Keep the original date when updating an already-published post
        published_at: publish ? existing?.published_at || new Date().toISOString() : null,
      })
      .eq('id', postId);
    if (mError) throw mError;
  } catch (err) {
    // Don't leave a half-created post or orphaned files behind
    if (created && postId) await supabase.from('blog_posts').delete().eq('id', postId);
    if (created && uploadedPaths.length) await supabase.storage.from('blog-media').remove(uploadedPaths);
    fail(`Publishing failed: ${err.message || err}`);
  }

  if (publish && cfg.deployHook) {
    // Rebuild so the new article gets prerendered HTML and a sitemap entry
    const res = await fetch(cfg.deployHook, { method: 'POST' }).catch(() => null);
    console.log(res?.ok ? '  ↻ Vercel rebuild triggered' : '  ! Vercel deploy hook failed (the article is live; sitemap updates on next deploy)');
  }

  console.log(`\n✔ ${existing ? 'Updated' : 'Created'} (${publish ? 'published' : 'draft'}): ${postId}`);
  for (const l of langs) console.log(`  ${cfg.siteUrl}/${l}/blog/${spec.slug}`);
}

main().catch((err) => fail(err.message || String(err)));
