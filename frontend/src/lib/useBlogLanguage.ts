import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { languageReady } from './geoLanguage';

export type BlogLang = 'zh' | 'en' | 'ja';

export const normalizeBlogLang = (raw: string | undefined | null): BlogLang => {
  const v = (raw || 'en').toLowerCase();
  if (v.startsWith('zh')) return 'zh';
  if (v.startsWith('ja')) return 'ja';
  return 'en';
};

/**
 * Language rules for /:lang/blog routes:
 * - /:lang/... — the URL is the source of truth; the UI language follows it (shared links and crawlers get
 *   exactly the language they asked for).
 * - /blog... (no prefix) — once the initial language is settled (saved choice → geo → English),
 *   redirect to the matching /:lang/blog... URL.
 * - Switching language in the Navbar rewrites the URL prefix itself, which then flows back through here.
 */
export function useBlogLanguage(): BlogLang {
  const { lang: langParam } = useParams<{ lang?: string }>();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const urlLang = langParam ? normalizeBlogLang(langParam) : null;

  // URL → UI language
  useEffect(() => {
    if (urlLang && normalizeBlogLang(i18n.language) !== urlLang) {
      i18n.changeLanguage(urlLang);
    }
    // Only react to URL changes; reacting to i18n changes would let the UI language override the URL again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlLang]);

  // Unprefixed /blog... → /:lang/blog...
  useEffect(() => {
    if (urlLang) return;
    let cancelled = false;
    languageReady.then(() => {
      if (cancelled) return;
      const lang = normalizeBlogLang(i18n.language);
      navigate(`/${lang}${location.pathname}${location.search}${location.hash}`, { replace: true });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlLang, location.pathname]);

  return urlLang ?? normalizeBlogLang(i18n.language);
}
