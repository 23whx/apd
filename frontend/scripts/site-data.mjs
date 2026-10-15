// Shared build-time data access for generate-sitemap.mjs and prerender.mjs.
// Reads public data through Supabase's REST API with the anon key (the same access the browser has).

export const SITE_URL = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://acgn-personality-database.top').replace(
  /\/+$/,
  ''
);

export function supabaseConfig() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY_PUBLIC;
  return url && anonKey ? { url: url.replace(/\/+$/, ''), anonKey } : null;
}

/** Fetch every row of a PostgREST resource, paging past the server's per-request row cap. */
export async function fetchAll(config, resource, query) {
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const res = await fetch(`${config.url}/rest/v1/${resource}?${query}`, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        Range: `${from}-${from + pageSize - 1}`,
        'Range-Unit': 'items',
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${resource}: ${res.status} ${res.statusText} ${text}`.trim());
    }
    const page = await res.json();
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

/** Like fetchAll, but resolves to null (with a warning) instead of failing, for optional data. */
export async function fetchOptional(config, resource, query) {
  try {
    return await fetchAll(config, resource, query);
  } catch (err) {
    console.warn(`[site-data] ${resource} unavailable: ${err.message}`);
    return null;
  }
}

export const toDateOnly = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

export const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

/** Load everything the sitemap and prerender need. Each part is null when it can't be fetched. */
export async function loadSiteData() {
  const config = supabaseConfig();
  if (!config) {
    console.warn('[site-data] Supabase env not set; only static pages will be generated.');
    return { works: null, characters: null, summaries: null, blog: null };
  }
  const [works, characters, summaries, blog] = await Promise.all([
    fetchOptional(config, 'works', 'select=id,name_cn,name_en,name_jp,alias,type,poster_url,summary_md,created_at&order=created_at.desc'),
    fetchOptional(config, 'characters', 'select=id,work_id,name_cn,name_en,name_jp,avatar_url,summary_md,created_at&order=created_at.desc'),
    // Requires supabase/migrations/20261015_character_personality_summary.sql
    fetchOptional(config, 'character_personality_summary', 'select=character_id,vote_count,top_mbti,top_enneagram,top_subtype,top_tritype'),
    fetchOptional(
      config,
      'blog_post_translations_with_author',
      'select=post_id,lang,slug,title,excerpt,cover_image,published_at,updated_at&published=eq.true&order=published_at.desc.nullslast'
    ),
  ]);
  return { works, characters, summaries, blog };
}
