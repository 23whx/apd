/**
 * Schema.org structured data (JSON-LD).
 *
 * Layout:
 * - Site-wide entities (WebSite, Organization, Person) are written statically in index.html so that
 *   crawlers which don't run JavaScript still see them. Pages reference them by @id only.
 * - Each page injects one @graph via useJsonLd(): its WebPage, a BreadcrumbList and the page's main entity.
 *   Entities are linked with @id instead of being repeated.
 */
import { useEffect } from 'react';

export const SITE_URL = 'https://acgn-personality-database.top';
export const SITE_NAME = 'ACGN Personality Database';

/** @id values of the site-wide entities defined in index.html */
export const SCHEMA_IDS = {
  website: `${SITE_URL}/#website`,
  organization: `${SITE_URL}/#organization`,
  author: `${SITE_URL}/#rollkey`,
} as const;

type JsonLdNode = Record<string, unknown>;
export interface JsonLdGraph {
  '@context': 'https://schema.org';
  '@graph': JsonLdNode[];
}

type Lang = 'en' | 'zh' | 'ja';

const IN_LANGUAGE: Record<Lang, string> = { en: 'en', zh: 'zh-CN', ja: 'ja' };

export const toLang = (raw: string | undefined | null): Lang => {
  const v = (raw || 'en').toLowerCase();
  if (v.startsWith('zh')) return 'zh';
  if (v.startsWith('ja')) return 'ja';
  return 'en';
};

const absoluteUrl = (pathOrUrl: string) => (/^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl}`);

const ref = (id: string) => ({ '@id': id });

const isEmpty = (value: unknown) =>
  value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

/** Recursively drop undefined / null / empty-string / empty-array values so the output stays clean. */
function compact<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => compact(v)).filter((v) => !isEmpty(v)) as T;
  }
  if (value && typeof value === 'object') {
    const out: JsonLdNode = {};
    for (const [key, child] of Object.entries(value)) {
      const cleaned = compact(child);
      if (!isEmpty(cleaned)) out[key] = cleaned;
    }
    return out as T;
  }
  return value;
}

const graph = (...nodes: (JsonLdNode | null | undefined)[]): JsonLdGraph => ({
  '@context': 'https://schema.org',
  '@graph': nodes.filter((n): n is JsonLdNode => !!n).map((n) => compact(n)),
});

/** Pick the display name for the current language, plus the remaining distinct names as alternates. */
function localizedNames(
  names: { cn?: string | null; en?: string | null; jp?: string | null },
  lang: Lang,
  extra: (string | null | undefined)[] = []
) {
  const order =
    lang === 'zh' ? [names.cn, names.en, names.jp] : lang === 'ja' ? [names.jp, names.en, names.cn] : [names.en, names.cn, names.jp];
  const all = [...order, ...extra].filter((n): n is string => !!n && n.trim() !== '');
  const unique = [...new Set(all)];
  return { name: unique[0] ?? 'Unknown', alternateName: unique.slice(1) };
}

/** Truncate plain text for description fields. */
const summarize = (text: string | null | undefined, max = 300) => {
  if (!text) return undefined;
  const plain = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> text
    .replace(/<[^>]+>/g, ' ') // inline HTML
    .replace(/[#*_`>~]/g, ' ') // markdown markers
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
};

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

interface Crumb {
  name: string;
  path: string;
}

function breadcrumbNode(pageUrl: string, crumbs: Crumb[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

function webPageNode(opts: {
  type?: string;
  url: string;
  name: string;
  description?: string;
  lang: Lang;
  mainEntityId?: string;
  image?: string;
  extra?: JsonLdNode;
}): JsonLdNode {
  return {
    '@type': opts.type ?? 'WebPage',
    '@id': `${opts.url}#webpage`,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    inLanguage: IN_LANGUAGE[opts.lang],
    isPartOf: ref(SCHEMA_IDS.website),
    breadcrumb: ref(`${opts.url}#breadcrumb`),
    mainEntity: opts.mainEntityId ? ref(opts.mainEntityId) : undefined,
    primaryImageOfPage: opts.image ? { '@type': 'ImageObject', url: absoluteUrl(opts.image) } : undefined,
    ...opts.extra,
  };
}

const HOME_CRUMB: Record<Lang, string> = { en: 'Home', zh: '首页', ja: 'ホーム' };
const WORKS_CRUMB: Record<Lang, string> = { en: 'Works', zh: '作品', ja: '作品' };
const CHARACTERS_CRUMB: Record<Lang, string> = { en: 'Characters', zh: '角色', ja: 'キャラクター' };
const BLOG_CRUMB: Record<Lang, string> = { en: 'Blog', zh: '博客', ja: 'ブログ' };

// ---------------------------------------------------------------------------
// Works
// ---------------------------------------------------------------------------

/** Map APD work types to the closest schema.org CreativeWork subtype. */
const WORK_TYPE_SCHEMA: Record<string, string> = {
  anime: 'TVSeries',
  manga: 'ComicSeries',
  game: 'VideoGame',
  novel: 'Book',
};

const workTypesToSchema = (types: string[] | string | null | undefined) => {
  const list = (Array.isArray(types) ? types : types ? [types] : []).map((t) => WORK_TYPE_SCHEMA[t]).filter(Boolean);
  const unique = [...new Set(list)];
  if (unique.length === 0) return 'CreativeWork';
  return unique.length === 1 ? unique[0] : unique;
};

const workUrl = (id: string) => `${SITE_URL}/works/${id}`;
const characterUrl = (id: string) => `${SITE_URL}/characters/${id}`;

interface SchemaWork {
  id: string;
  name_cn?: string | null;
  name_en?: string | null;
  name_jp?: string | null;
  alias?: string[] | null;
  type?: string[] | string | null;
  poster_url?: string | null;
  summary_md?: string | null;
}

interface SchemaCharacter {
  id: string;
  name_cn?: string | null;
  name_en?: string | null;
  name_jp?: string | null;
  avatar_url?: string | null;
  summary_md?: string | null;
  source_link?: string | null;
}

export function buildWorkPageSchema(work: SchemaWork, characters: SchemaCharacter[], rawLang: string): JsonLdGraph {
  const lang = toLang(rawLang);
  const url = workUrl(work.id);
  const workId = `${url}#work`;
  const { name, alternateName } = localizedNames(
    { cn: work.name_cn, en: work.name_en, jp: work.name_jp },
    lang,
    Array.isArray(work.alias) ? work.alias : []
  );
  const genres = Array.isArray(work.type) ? work.type : work.type ? [work.type] : [];

  return graph(
    webPageNode({
      url,
      name: `${name} - ${SITE_NAME}`,
      description: summarize(work.summary_md) ?? `Character personality types (MBTI, Enneagram) for ${name}.`,
      lang,
      mainEntityId: workId,
      image: work.poster_url ?? undefined,
    }),
    breadcrumbNode(url, [
      { name: HOME_CRUMB[lang], path: '/' },
      { name: WORKS_CRUMB[lang], path: '/works' },
      { name, path: `/works/${work.id}` },
    ]),
    {
      '@type': workTypesToSchema(work.type),
      '@id': workId,
      name,
      alternateName,
      url,
      image: work.poster_url,
      description: summarize(work.summary_md),
      genre: genres,
      character: characters.map((c) => ({
        '@type': 'Person',
        '@id': `${characterUrl(c.id)}#character`,
        name: localizedNames({ cn: c.name_cn, en: c.name_en, jp: c.name_jp }, lang).name,
        url: characterUrl(c.id),
      })),
    }
  );
}

export function buildWorksListSchema(works: SchemaWork[], rawLang: string): JsonLdGraph {
  const lang = toLang(rawLang);
  const url = `${SITE_URL}/works`;
  return graph(
    webPageNode({
      type: 'CollectionPage',
      url,
      name: `${WORKS_CRUMB[lang]} - ${SITE_NAME}`,
      description: 'Anime, manga, game and novel works with community-voted character personality types.',
      lang,
      mainEntityId: `${url}#itemlist`,
    }),
    breadcrumbNode(url, [
      { name: HOME_CRUMB[lang], path: '/' },
      { name: WORKS_CRUMB[lang], path: '/works' },
    ]),
    {
      '@type': 'ItemList',
      '@id': `${url}#itemlist`,
      numberOfItems: works.length,
      itemListElement: works.slice(0, 50).map((w, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: workUrl(w.id),
        name: localizedNames({ cn: w.name_cn, en: w.name_en, jp: w.name_jp }, lang).name,
      })),
    }
  );
}

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

export interface TopTypes {
  mbti?: string;
  enneagram?: string;
  subtype?: string;
  tritype?: string;
  yi_hexagram?: string;
}

export function buildCharacterPageSchema(
  character: SchemaCharacter & { work_id: string },
  work: SchemaWork | null | undefined,
  topTypes: TopTypes,
  totalVotes: number,
  rawLang: string
): JsonLdGraph {
  const lang = toLang(rawLang);
  const url = characterUrl(character.id);
  const characterId = `${url}#character`;
  const { name, alternateName } = localizedNames(
    { cn: character.name_cn, en: character.name_en, jp: character.name_jp },
    lang
  );
  const workName = work ? localizedNames({ cn: work.name_cn, en: work.name_en, jp: work.name_jp }, lang).name : undefined;

  const typeSummary = [topTypes.mbti, topTypes.enneagram, topTypes.subtype, topTypes.tritype && `Tritype ${topTypes.tritype}`]
    .filter(Boolean)
    .join(' · ');
  const description =
    summarize(character.summary_md) ??
    `${name}${workName ? ` (${workName})` : ''} personality type${typeSummary ? `: ${typeSummary}` : ''}. Community votes on MBTI, Enneagram, instincts, tritype and Yi Jing hexagrams.`;

  return graph(
    webPageNode({
      url,
      name: `${name}${typeSummary ? ` - ${typeSummary}` : ''} | ${SITE_NAME}`,
      description,
      lang,
      mainEntityId: characterId,
      image: character.avatar_url ?? undefined,
      extra:
        totalVotes > 0
          ? {
              interactionStatistic: {
                '@type': 'InteractionCounter',
                interactionType: { '@type': 'VoteAction' },
                userInteractionCount: totalVotes,
              },
            }
          : undefined,
    }),
    breadcrumbNode(url, [
      { name: HOME_CRUMB[lang], path: '/' },
      ...(work && workName
        ? [{ name: workName, path: `/works/${work.id}` }]
        : [{ name: CHARACTERS_CRUMB[lang], path: '/characters' }]),
      { name, path: `/characters/${character.id}` },
    ]),
    {
      // schema.org models fictional characters as Person (see CreativeWork.character);
      // additionalType makes the "fictional" part explicit via Wikidata's "fictional character" class.
      '@type': 'Person',
      '@id': characterId,
      additionalType: 'https://www.wikidata.org/wiki/Q95074',
      name,
      alternateName,
      url,
      image: character.avatar_url,
      description,
      sameAs: character.source_link ? [character.source_link] : undefined,
      // The work node lives on its own page, so describe it inline (same @id) instead of a bare reference
      subjectOf: work
        ? {
            '@type': workTypesToSchema(work.type),
            '@id': `${workUrl(work.id)}#work`,
            name: workName,
            url: workUrl(work.id),
          }
        : undefined,
    }
  );
}

export function buildCharactersListSchema(
  characters: (SchemaCharacter & { works?: { name_cn?: string | null; name_en?: string | null } | null })[],
  rawLang: string
): JsonLdGraph {
  const lang = toLang(rawLang);
  const url = `${SITE_URL}/characters`;
  return graph(
    webPageNode({
      type: 'CollectionPage',
      url,
      name: `${CHARACTERS_CRUMB[lang]} - ${SITE_NAME}`,
      description: 'ACGN characters with community-voted MBTI, Enneagram, instinct, tritype and Yi Jing personality types.',
      lang,
      mainEntityId: `${url}#itemlist`,
    }),
    breadcrumbNode(url, [
      { name: HOME_CRUMB[lang], path: '/' },
      { name: CHARACTERS_CRUMB[lang], path: '/characters' },
    ]),
    {
      '@type': 'ItemList',
      '@id': `${url}#itemlist`,
      numberOfItems: characters.length,
      itemListElement: characters.slice(0, 50).map((c, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: characterUrl(c.id),
        name: localizedNames({ cn: c.name_cn, en: c.name_en, jp: c.name_jp }, lang).name,
      })),
    }
  );
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

interface SchemaBlogPost {
  slug: string;
  lang: string;
  title: string;
  excerpt?: string | null;
  cover_image?: string | null;
  category?: string | null;
  tags?: string[] | null;
  published_at?: string | null;
  updated_at?: string | null;
  author_username?: string | null;
  article_type?: string | null;
  external_url?: string | null;
}

const blogPostUrl = (lang: Lang, slug: string) => `${SITE_URL}/${lang}/blog/${slug}`;

export function buildBlogPostSchema(post: SchemaBlogPost, rawPageLang: string): JsonLdGraph {
  const pageLang = toLang(rawPageLang);
  const contentLang = toLang(post.lang);
  const url = blogPostUrl(pageLang, post.slug);
  const postId = `${url}#article`;
  const image = post.cover_image ? absoluteUrl(post.cover_image) : `${SITE_URL}/og-image.png`;
  const keywords = (post.tags ?? []).flatMap((t) => t.split(/[，,]/)).map((t) => t.trim()).filter(Boolean);
  const isExternal = post.article_type === 'external' && !!post.external_url;

  return graph(
    webPageNode({
      url,
      name: post.title,
      description: summarize(post.excerpt, 200),
      lang: contentLang,
      mainEntityId: postId,
      image,
    }),
    breadcrumbNode(url, [
      { name: HOME_CRUMB[pageLang], path: '/' },
      { name: BLOG_CRUMB[pageLang], path: `/${pageLang}/blog` },
      { name: post.title, path: `/${pageLang}/blog/${post.slug}` },
    ]),
    {
      '@type': 'BlogPosting',
      '@id': postId,
      headline: post.title.slice(0, 110),
      description: summarize(post.excerpt, 200),
      image: [image],
      datePublished: post.published_at,
      dateModified: post.updated_at ?? post.published_at,
      inLanguage: IN_LANGUAGE[contentLang],
      articleSection: post.category,
      keywords,
      url,
      mainEntityOfPage: ref(`${url}#webpage`),
      isPartOf: {
        '@type': 'Blog',
        '@id': `${SITE_URL}/${pageLang}/blog#blog`,
        name: `APD ${BLOG_CRUMB[pageLang]}`,
        url: `${SITE_URL}/${pageLang}/blog`,
      },
      // Posts are written by the site owner; fall back to the username shown on the page otherwise.
      author:
        !post.author_username || post.author_username.toLowerCase() === 'rollkey'
          ? ref(SCHEMA_IDS.author)
          : { '@type': 'Person', name: post.author_username },
      publisher: ref(SCHEMA_IDS.organization),
      isBasedOn: isExternal ? post.external_url : undefined,
    }
  );
}

export function buildBlogListSchema(posts: SchemaBlogPost[], rawLang: string): JsonLdGraph {
  const lang = toLang(rawLang);
  const url = `${SITE_URL}/${lang}/blog`;
  const blogId = `${url}#blog`;
  const description: Record<Lang, string> = {
    en: 'Articles on MBTI, Enneagram, tritype, Yi Jing and ACGN character analysis.',
    zh: 'MBTI、九型人格、三元组、易学与 ACGN 角色人格分析文章。',
    ja: 'MBTI、エニアグラム、トライタイプ、易学、ACGNキャラクター分析の記事。',
  };

  return graph(
    webPageNode({
      type: 'CollectionPage',
      url,
      name: `${BLOG_CRUMB[lang]} - ${SITE_NAME}`,
      description: description[lang],
      lang,
      mainEntityId: blogId,
    }),
    breadcrumbNode(url, [
      { name: HOME_CRUMB[lang], path: '/' },
      { name: BLOG_CRUMB[lang], path: `/${lang}/blog` },
    ]),
    {
      '@type': 'Blog',
      '@id': blogId,
      name: `APD ${BLOG_CRUMB[lang]}`,
      description: description[lang],
      url,
      inLanguage: IN_LANGUAGE[lang],
      publisher: ref(SCHEMA_IDS.organization),
      blogPost: posts.slice(0, 30).map((p) => ({
        '@type': 'BlogPosting',
        '@id': `${blogPostUrl(lang, p.slug)}#article`,
        headline: p.title.slice(0, 110),
        url: blogPostUrl(lang, p.slug),
        datePublished: p.published_at ?? undefined,
        image: p.cover_image ? absoluteUrl(p.cover_image) : undefined,
      })),
    }
  );
}

// ---------------------------------------------------------------------------
// Injection
// ---------------------------------------------------------------------------

/** JSON for a <script type="application/ld+json"> body, with "<" escaped so content can't close the tag. */
export const serializeJsonLd = (data: JsonLdGraph) => JSON.stringify(data).replace(/</g, '\\u003c');

/**
 * Inject a page-level JSON-LD graph into <head> while the page is mounted.
 * Pass null while data is loading. The script content is set via textContent (never parsed as HTML),
 * and "<" is escaped as well so user-submitted names can't break out of the script element.
 */
export function useJsonLd(data: JsonLdGraph | null) {
  const json = data ? serializeJsonLd(data) : null;

  useEffect(() => {
    if (!json || typeof document === 'undefined') return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.pageSchema = 'true';
    script.textContent = json;
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [json]);
}

// ---------------------------------------------------------------------------
// MBTI type hubs
// ---------------------------------------------------------------------------

const MBTI_CRUMB: Record<Lang, string> = { en: 'MBTI types', zh: 'MBTI 类型', ja: 'MBTI タイプ' };

export function buildMbtiHubSchema(
  type: string,
  characters: { character_id: string; name_cn?: string | null; name_en?: string | null; name_jp?: string | null }[],
  title: string,
  description: string,
  rawLang: string
): JsonLdGraph {
  const lang = toLang(rawLang);
  const path = `/mbti/${type.toLowerCase()}`;
  const url = `${SITE_URL}${path}`;
  return graph(
    webPageNode({ type: 'CollectionPage', url, name: title, description, lang, mainEntityId: `${url}#itemlist` }),
    breadcrumbNode(url, [
      { name: HOME_CRUMB[lang], path: '/' },
      { name: MBTI_CRUMB[lang], path: '/mbti' },
      { name: type, path },
    ]),
    {
      '@type': 'ItemList',
      '@id': `${url}#itemlist`,
      name: title,
      numberOfItems: characters.length,
      itemListElement: characters.slice(0, 100).map((c, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: characterUrl(c.character_id),
        name: localizedNames({ cn: c.name_cn, en: c.name_en, jp: c.name_jp }, lang).name,
      })),
    }
  );
}

export function buildMbtiIndexSchema(types: string[], title: string, description: string, rawLang: string): JsonLdGraph {
  const lang = toLang(rawLang);
  const url = `${SITE_URL}/mbti`;
  return graph(
    webPageNode({ type: 'CollectionPage', url, name: title, description, lang, mainEntityId: `${url}#itemlist` }),
    breadcrumbNode(url, [
      { name: HOME_CRUMB[lang], path: '/' },
      { name: MBTI_CRUMB[lang], path: '/mbti' },
    ]),
    {
      '@type': 'ItemList',
      '@id': `${url}#itemlist`,
      numberOfItems: types.length,
      itemListElement: types.map((t, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${url}/${t.toLowerCase()}`,
        name: t,
      })),
    }
  );
}
