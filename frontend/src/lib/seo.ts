/**
 * Page-level SEO metadata: <title>, meta description, canonical, Open Graph / Twitter tags, <html lang>
 * and robots. Every route renders from the same index.html, so without this every page would share the
 * home page's title and description.
 *
 * Title/description wording here is mirrored (English variant) by scripts/prerender.mjs, which writes the
 * same tags into static HTML at build time for crawlers that don't run JavaScript. Keep the two in sync.
 */
import { useEffect } from 'react';
import { SITE_URL } from './schema';

export type SeoLang = 'en' | 'zh' | 'ja';

export const toSeoLang = (raw: string | undefined | null): SeoLang => {
  const v = (raw || 'en').toLowerCase();
  if (v.startsWith('zh')) return 'zh';
  if (v.startsWith('ja')) return 'ja';
  return 'en';
};

const HTML_LANG: Record<SeoLang, string> = { en: 'en', zh: 'zh-CN', ja: 'ja' };
const SITE_SUFFIX = ' | APD';

export interface SeoOptions {
  /** Full title without the site suffix; " | APD" is appended. */
  title?: string | null;
  description?: string | null;
  /** Site path ("/characters/123"); sets canonical and og:url. */
  path?: string | null;
  image?: string | null;
  lang?: SeoLang;
  /** Keep the page out of search results (account, submit and auth pages). */
  noindex?: boolean;
  ogType?: 'website' | 'article' | 'profile';
}

type Snapshot = { title: string; metas: Map<string, string | null>; lang: string };

const META_KEYS: [attr: 'name' | 'property', key: string][] = [
  ['name', 'description'],
  ['name', 'robots'],
  ['property', 'og:title'],
  ['property', 'og:description'],
  ['property', 'og:url'],
  ['property', 'og:type'],
  ['property', 'og:image'],
  ['property', 'og:image:secure_url'],
  ['name', 'twitter:title'],
  ['name', 'twitter:description'],
  ['name', 'twitter:image'],
];

const findMeta = (attr: string, key: string) =>
  document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);

function setMeta(attr: 'name' | 'property', key: string, value: string | null) {
  let el = findMeta(attr, key);
  if (value === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function snapshot(): Snapshot {
  const metas = new Map<string, string | null>();
  for (const [attr, key] of META_KEYS) metas.set(`${attr}|${key}`, findMeta(attr, key)?.getAttribute('content') ?? null);
  return { title: document.title, metas, lang: document.documentElement.lang };
}

function restore(s: Snapshot) {
  document.title = s.title;
  document.documentElement.lang = s.lang;
  for (const [compound, value] of s.metas) {
    const [attr, key] = compound.split('|') as ['name' | 'property', string];
    setMeta(attr, key, value);
  }
}

/** Truncate plain text for meta descriptions (Google shows roughly 150–160 characters). */
export const clampDescription = (text: string, max = 158) => {
  const plain = text.replace(/\s+/g, ' ').trim();
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
};

export function useSeo(opts: SeoOptions) {
  const { title, description, path, image, lang, noindex, ogType } = opts;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    // Wait until the page knows what it is (title present, or explicitly noindex)
    if (!title && !noindex) return;

    const before = snapshot();
    const fullTitle = title ? `${title}${SITE_SUFFIX}` : null;
    const url = path ? `${SITE_URL}${path}` : null;
    const desc = description ? clampDescription(description) : null;
    const img = image ? (/^https?:\/\//.test(image) ? image : `${SITE_URL}${image}`) : null;

    if (fullTitle) {
      document.title = fullTitle;
      setMeta('property', 'og:title', fullTitle);
      setMeta('name', 'twitter:title', fullTitle);
    }
    if (desc) {
      setMeta('name', 'description', desc);
      setMeta('property', 'og:description', desc);
      setMeta('name', 'twitter:description', desc);
    }
    if (url) setMeta('property', 'og:url', url);
    if (ogType) setMeta('property', 'og:type', ogType);
    if (img) {
      setMeta('property', 'og:image', img);
      setMeta('property', 'og:image:secure_url', img);
      setMeta('name', 'twitter:image', img);
    }
    if (lang) document.documentElement.lang = HTML_LANG[lang];
    setMeta('name', 'robots', noindex ? 'noindex, follow' : before.metas.get('name|robots') ?? null);

    return () => restore(before);
  }, [title, description, path, image, lang, noindex, ogType]);

  // Canonical is handled separately so noindex pages don't declare one
  useCanonicalInternal(noindex ? null : path ?? null);
}

function useCanonicalInternal(path: string | null) {
  const href = path ? `${SITE_URL}${path}` : null;
  useEffect(() => {
    if (!href || typeof document === 'undefined') return;
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = href;
    const current = link;
    return () => current.remove();
  }, [href]);
}

// ---------------------------------------------------------------------------
// Title / description wording, per page type
// ---------------------------------------------------------------------------

/** "Light Yagami (夜神月)": localized name first, plus one alternate in another script so a single URL
 *  can match searches in English, Chinese and Japanese. */
export function displayName(
  names: { cn?: string | null; en?: string | null; jp?: string | null },
  lang: SeoLang
): string {
  const order =
    lang === 'zh' ? [names.cn, names.en, names.jp] : lang === 'ja' ? [names.jp, names.en, names.cn] : [names.en, names.cn, names.jp];
  const unique = [...new Set(order.filter((n): n is string => !!n && n.trim() !== '').map((n) => n.trim()))];
  if (unique.length === 0) return 'Unknown';
  return unique.length > 1 ? `${unique[0]} (${unique[1]})` : unique[0];
}

export function characterSeo(opts: {
  name: string;
  workName?: string;
  top: { mbti?: string; enneagram?: string; subtype?: string; tritype?: string };
  voteCount: number;
  lang: SeoLang;
}) {
  const { name, workName, top, voteCount, lang } = opts;
  const types = [top.mbti, top.enneagram, top.subtype].filter(Boolean).join(' · ');
  const work = workName ? ` | ${workName}` : '';
  if (lang === 'zh') {
    return {
      title: `${name} MBTI 人格类型${top.mbti ? `：${top.mbti}` : ''}${work}`,
      description: `${name}${workName ? `（${workName}）` : ''}的人格类型${types ? `：${types}` : ''}${voteCount ? `，基于 ${voteCount} 位网友投票` : ''}。查看 MBTI、九型人格、副型、三元组与易经卦象的投票结果并参与讨论。`,
    };
  }
  if (lang === 'ja') {
    return {
      title: `${name} MBTI 性格タイプ${top.mbti ? `：${top.mbti}` : ''}${work}`,
      description: `${name}${workName ? `（${workName}）` : ''}の性格タイプ${types ? `：${types}` : ''}${voteCount ? `（${voteCount} 票）` : ''}。MBTI・エニアグラム・本能的サブタイプ・トライタイプ・易経の投票結果を見て議論しよう。`,
    };
  }
  return {
    title: `${name} MBTI Personality Type${top.mbti ? `: ${top.mbti}` : ''}${work}`,
    description: `${name}${workName ? ` from ${workName}` : ''} personality type${types ? `: ${types}` : ''}${voteCount ? `, based on ${voteCount} community votes` : ''}. See the MBTI, Enneagram, instinctual variant, tritype and Yi Jing hexagram results and join the discussion.`,
  };
}

export function workSeo(opts: { name: string; characterCount: number; lang: SeoLang; summary?: string | null }) {
  const { name, characterCount, lang, summary } = opts;
  const extra = summary ? ` ${summary}` : '';
  if (lang === 'zh') {
    return {
      title: `${name} 角色 MBTI 人格类型大全`,
      description: `${name} 的 ${characterCount} 位角色的 MBTI、九型人格与易经卦象投票结果。${extra}`,
    };
  }
  if (lang === 'ja') {
    return {
      title: `${name} キャラクター MBTI 性格タイプ一覧`,
      description: `${name} のキャラクター ${characterCount} 人の MBTI・エニアグラム・易経タイプの投票結果。${extra}`,
    };
  }
  return {
    title: `${name} Characters MBTI & Personality Types`,
    description: `MBTI, Enneagram and Yi Jing personality types for ${characterCount} ${name} characters, voted by the community.${extra}`,
  };
}

export function mbtiHubSeo(type: string, count: number, examples: string[], lang: SeoLang) {
  const ex = examples.slice(0, 3).join(', ');
  if (lang === 'zh') {
    return {
      title: `${type} 动漫游戏角色大全 · ${count} 位 ${type} 角色`,
      description: `网友投票为 ${type} 的动漫、漫画、游戏和小说角色${ex ? `，如 ${ex}` : ''}。查看每个角色的九型人格、副型和易经卦象。`,
    };
  }
  if (lang === 'ja') {
    return {
      title: `${type} のアニメ・ゲームキャラクター一覧（${count} 人）`,
      description: `${type} と投票されたアニメ・漫画・ゲーム・小説のキャラクター${ex ? `（${ex} など）` : ''}。エニアグラムや易経タイプも確認できます。`,
    };
  }
  return {
    title: `${type} Anime & Game Characters (${count})`,
    description: `${count} anime, manga, game and novel characters the community typed as ${type}${ex ? `, including ${ex}` : ''}. See each character's Enneagram, instinctual variant and Yi Jing hexagram.`,
  };
}
