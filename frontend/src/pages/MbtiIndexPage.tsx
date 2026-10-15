import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { MBTI_TYPES } from '../lib/types';
import { MBTI_GROUPS, MBTI_SUMMARY, mbtiPath } from '../lib/mbti';
import { buildMbtiIndexSchema, useJsonLd } from '../lib/schema';
import { toSeoLang, useSeo } from '../lib/seo';

const SEO = {
  en: {
    title: 'MBTI Anime & Game Characters by Type',
    description: 'Browse anime, manga, game and novel characters by their community-voted MBTI type: INTJ, INTP, ENTJ, ENTP, INFJ, INFP, ENFJ, ENFP and more.',
    heading: 'Characters by MBTI type',
  },
  zh: {
    title: 'MBTI 16 型人格动漫游戏角色大全',
    description: '按网友投票得出的 MBTI 类型浏览动漫、漫画、游戏与小说角色：INTJ、INTP、ENTJ、ENTP、INFJ、INFP、ENFJ、ENFP 等 16 型。',
    heading: '按 MBTI 类型浏览角色',
  },
  ja: {
    title: 'MBTI タイプ別 アニメ・ゲームキャラクター一覧',
    description: 'コミュニティ投票による MBTI タイプ別に、アニメ・漫画・ゲーム・小説のキャラクターを探そう：INTJ、INTP、ENTJ、ENTP、INFJ、INFP など 16 タイプ。',
    heading: 'MBTI タイプ別キャラクター',
  },
} as const;

const COUNT_LABEL = { en: (n: number) => `${n} characters`, zh: (n: number) => `${n} 位角色`, ja: (n: number) => `${n} 人` };

export const MbtiIndexPage: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = toSeoLang(i18n.language);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let cancelled = false;
    // One count-only request per type: exact even past PostgREST's 1000-row response cap
    Promise.all(
      MBTI_TYPES.map((type) =>
        supabase
          .from('character_personality_summary')
          .select('character_id', { count: 'exact', head: true })
          .eq('top_mbti', type)
          .then(({ count, error }) => [type, error ? null : count ?? 0] as const)
      )
    ).then((results) => {
      if (cancelled || results.some(([, count]) => count === null)) return;
      setCounts(Object.fromEntries(results) as Record<string, number>);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useSeo({ title: SEO[lang].title, description: SEO[lang].description, path: '/mbti', lang });
  const schema = useMemo(
    () => buildMbtiIndexSchema([...MBTI_TYPES], SEO[lang].title, SEO[lang].description, lang),
    [lang]
  );
  useJsonLd(schema);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-3">{SEO[lang].heading}</h1>
      <p className="text-gray-400 mb-10 max-w-3xl">{SEO[lang].description}</p>

      <div className="space-y-10">
        {MBTI_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`group-${group.id}`}>
            <h2 id={`group-${group.id}`} className="text-sm font-mono tracking-widest text-gray-500 mb-3">
              {group.label[lang]}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {group.types.map((type) => (
                <li key={type}>
                  <Link
                    to={mbtiPath(type)}
                    className="group block h-full bg-eva-surface border border-white/10 rounded-xl p-5 hover:border-eva-secondary/60 transition-colors"
                  >
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-2xl font-extrabold font-mono text-white group-hover:text-eva-secondary transition-colors">
                        {type}
                      </span>
                      {counts && <span className="text-xs text-gray-500">{COUNT_LABEL[lang](counts[type] || 0)}</span>}
                    </div>
                    <p className="text-sm text-gray-400">{MBTI_SUMMARY[type][lang]}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};
