import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MBTI_TYPES } from '../lib/types';
import { MBTI_SUMMARY, isMbtiType, mbtiPath, type CharacterSummaryRow } from '../lib/mbti';
import { buildMbtiHubSchema, useJsonLd } from '../lib/schema';
import { displayName, mbtiHubSeo, toSeoLang, useSeo } from '../lib/seo';
import { SkeletonCharacterCard } from '../components/Skeleton';

const TEXT = {
  headingSuffix: { en: 'Characters', zh: '角色', ja: 'のキャラクター' },
  count: { en: (n: number) => `${n} characters typed by community vote`, zh: (n: number) => `共 ${n} 位角色，由网友投票得出`, ja: (n: number) => `コミュニティ投票による ${n} 人のキャラクター` },
  votes: { en: 'votes', zh: '票', ja: '票' },
  empty: { en: 'No characters have this as their top type yet. Vote on a character to add one!', zh: '暂时还没有以此为最高票类型的角色，去给角色投票吧！', ja: 'まだこのタイプが最多票のキャラクターはいません。投票してみよう！' },
  error: { en: 'Could not load characters right now.', zh: '暂时无法加载角色列表。', ja: 'キャラクターを読み込めませんでした。' },
  otherTypes: { en: 'Other MBTI types', zh: '其他 MBTI 类型', ja: 'ほかの MBTI タイプ' },
  allTypes: { en: 'All MBTI types', zh: '全部 MBTI 类型', ja: 'すべての MBTI タイプ' },
  notFound: { en: 'Unknown MBTI type', zh: '未知的 MBTI 类型', ja: '不明な MBTI タイプ' },
};

export const MbtiTypePage: React.FC = () => {
  const { type: rawType } = useParams<{ type: string }>();
  const { i18n } = useTranslation();
  const lang = toSeoLang(i18n.language);
  const valid = isMbtiType(rawType);
  const type = valid ? rawType!.toUpperCase() : '';

  const [rows, setRows] = useState<CharacterSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    supabase
      .from('character_personality_summary')
      .select('*')
      .eq('top_mbti', type)
      .order('vote_count', { ascending: false })
      .limit(300)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Error fetching MBTI hub:', error);
          setFailed(true);
          setRows([]);
        } else {
          setRows((data || []) as CharacterSummaryRow[]);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type, valid]);

  const names = useMemo(
    () =>
      rows.map((r) => ({
        row: r,
        name: displayName({ cn: r.name_cn, en: r.name_en, jp: r.name_jp }, lang),
        work: displayName({ cn: r.work_name_cn, en: r.work_name_en, jp: r.work_name_jp }, lang),
      })),
    [rows, lang]
  );

  const seo = valid && !loading && !failed ? mbtiHubSeo(type, rows.length, names.map((n) => n.name), lang) : null;
  useSeo({
    title: seo?.title,
    description: seo?.description,
    path: valid ? mbtiPath(type) : null,
    lang,
    // Unknown types and empty hubs (thin content) stay out of the index
    noindex: !valid || (!loading && !failed && rows.length === 0),
  });
  const schema = useMemo(
    () => (seo ? buildMbtiHubSchema(type, rows, seo.title, seo.description, lang) : null),
    // seo is derived from these inputs
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seo?.title, seo?.description, rows, type, lang]
  );
  useJsonLd(schema);

  if (!valid) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{TEXT.notFound[lang]}</h1>
        <Link to="/mbti" className="text-eva-secondary hover:underline">{TEXT.allTypes[lang]}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/mbti" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {TEXT.allTypes[lang]}
      </Link>

      <header className="bg-eva-surface border border-white/10 rounded-xl p-6 sm:p-8 mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">
          <span className="text-eva-secondary">{type}</span> {TEXT.headingSuffix[lang]}
        </h1>
        <p className="text-gray-300 text-lg mb-2">{MBTI_SUMMARY[type as keyof typeof MBTI_SUMMARY][lang]}</p>
        {!loading && !failed && <p className="text-sm text-gray-500">{TEXT.count[lang](rows.length)}</p>}
      </header>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <SkeletonCharacterCard key={i} />
          ))}
        </div>
      ) : failed ? (
        <p className="text-center py-12 text-gray-400 bg-eva-surface border border-white/10 rounded-xl">{TEXT.error[lang]}</p>
      ) : rows.length === 0 ? (
        <p className="text-center py-12 text-gray-400 bg-eva-surface border border-white/10 rounded-xl">{TEXT.empty[lang]}</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {names.map(({ row, name, work }) => (
            <li key={row.character_id}>
              <Link
                to={`/characters/${row.character_id}`}
                className="group block h-full bg-eva-surface border border-white/5 rounded-xl overflow-hidden hover:border-eva-secondary/50 transition-all"
              >
                <div className="aspect-square bg-gray-800 flex items-center justify-center">
                  {row.avatar_url ? (
                    <img src={row.avatar_url} alt={name} loading="lazy" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-4xl text-gray-600" aria-hidden="true">?</span>
                  )}
                </div>
                <div className="p-3">
                  <h2 className="font-bold text-sm text-white group-hover:text-eva-secondary transition-colors line-clamp-2">{name}</h2>
                  <p className="text-xs text-gray-500 line-clamp-1 mb-2">{work}</p>
                  <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                    {row.top_enneagram && <span className="px-1.5 py-0.5 rounded bg-eva-accent/20 text-eva-accent">{row.top_enneagram}</span>}
                    {row.top_subtype && <span className="px-1.5 py-0.5 rounded bg-eva-accent/20 text-eva-accent">{row.top_subtype}</span>}
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                      {row.vote_count} {TEXT.votes[lang]}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <nav aria-label={TEXT.otherTypes[lang]} className="mt-12">
        <h2 className="text-xl font-bold mb-4">{TEXT.otherTypes[lang]}</h2>
        <div className="flex flex-wrap gap-2">
          {MBTI_TYPES.filter((t) => t !== type).map((t) => (
            <Link
              key={t}
              to={mbtiPath(t)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-mono hover:border-eva-secondary hover:text-eva-secondary transition-colors"
            >
              {t}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};
