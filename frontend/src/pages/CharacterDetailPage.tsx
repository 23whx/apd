import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Character, Work, VoteStatistics } from '../lib/types';
import { ArrowLeft, ExternalLink, TrendingUp } from 'lucide-react';
import { VotePanel } from '../components/VotePanel';
import { VoteChart } from '../components/VoteChart';
import { CommentSection } from '../components/CommentSection';

interface CharacterWithWork extends Character {
  works?: Work;
}

export const CharacterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [character, setCharacter] = useState<CharacterWithWork | null>(null);
  const [stats, setStats] = useState<VoteStatistics>({
    mbti: {},
    enneagram: {},
    subtype: {},
    yi_hexagram: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // Parallel data fetching for better performance
      Promise.all([
        fetchCharacterDetails(),
        fetchVoteStatistics()
      ]).finally(() => setLoading(false));
    }
  }, [id]);

  const fetchCharacterDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select(`
          id,
          name_cn,
          name_en,
          name_jp,
          avatar_url,
          work_id,
          source_link,
          summary_md,
          created_at,
          works:work_id (
            id,
            name_cn,
            name_en,
            name_jp
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching character:', error);
        return;
      }
      setCharacter(data);
    } catch (error) {
      console.error('Error fetching character:', error);
    }
  };

  const fetchVoteStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from('personality_votes')
        .select('mbti, enneagram, subtype, yi_hexagram')
        .eq('character_id', id);

      if (error) {
        console.error('Error fetching vote statistics:', error);
        return;
      }

      // Aggregate statistics
      const newStats: VoteStatistics = {
        mbti: {},
        enneagram: {},
        subtype: {},
        yi_hexagram: {}
      };

      data?.forEach((vote) => {
        if (vote.mbti) newStats.mbti[vote.mbti] = (newStats.mbti[vote.mbti] || 0) + 1;
        if (vote.enneagram) newStats.enneagram[vote.enneagram] = (newStats.enneagram[vote.enneagram] || 0) + 1;
        if (vote.subtype) newStats.subtype[vote.subtype] = (newStats.subtype[vote.subtype] || 0) + 1;
        if (vote.yi_hexagram) newStats.yi_hexagram[vote.yi_hexagram] = (newStats.yi_hexagram[vote.yi_hexagram] || 0) + 1;
      });

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching vote statistics:', error);
    }
  };

  const getCharacterName = (char: CharacterWithWork) => {
    if (i18n.language === 'zh' && char.name_cn) return char.name_cn;
    if (i18n.language === 'ja' && char.name_jp) return char.name_jp;
    if (char.name_en) return char.name_en;
    return char.name_cn || char.name_jp || 'Unknown Character';
  };

  const getWorkName = (char: CharacterWithWork) => {
    if (!char.works) return 'Unknown Work';
    const work = char.works;
    if (i18n.language === 'zh' && work.name_cn) return work.name_cn;
    if (i18n.language === 'ja' && work.name_jp) return work.name_jp;
    if (work.name_en) return work.name_en;
    return work.name_cn || work.name_jp || 'Unknown Work';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eva-secondary"></div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('common.characterNotFound')}</h1>
        <Link to="/works" className="text-eva-secondary hover:underline">
          {t('common.backToWorks')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to={`/works/${character.work_id}`}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.backTo')} {getWorkName(character)}
      </Link>

      {/* Character Header - Compact */}
      <div className="bg-eva-surface border border-white/10 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar - Small */}
          <div className="w-32 h-32 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
            {character.avatar_url ? (
              <img
                src={character.avatar_url}
                alt={character.name_cn}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-4xl text-gray-600">?</div>
            )}
          </div>

          {/* Character Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{getCharacterName(character)}</h1>
            
            {/* Display work name instead of other language names */}
            {character.works && (
              <div className="text-sm text-gray-400 mb-3">
                <span className="text-eva-secondary">
                  {t('common.from')}: {getWorkName(character)}
                </span>
              </div>
            )}

            {character.summary_md && (
              <p className="text-gray-300 text-sm mb-3">{character.summary_md}</p>
            )}

            {character.source_link && (
              <a
                href={character.source_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-eva-secondary hover:underline"
              >
                {t('common.viewSource')} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Vote Statistics - Compact Grid */}
      <div className="bg-eva-surface border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-eva-secondary" />
          {t('characterDetail.votingResults')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <VoteChart title={t('characterDetail.mbti')} data={stats.mbti} />
          <VoteChart title={t('characterDetail.enneagram')} data={stats.enneagram} />
          <VoteChart title={t('characterDetail.subtype')} data={stats.subtype} />
          <VoteChart title={t('characterDetail.yiHexagram')} data={stats.yi_hexagram} />
        </div>
      </div>

      {/* Vote Panel */}
      {user && (
        <VotePanel characterId={id!} onVoteSubmit={fetchVoteStatistics} />
      )}

      {/* Comments */}
      <CommentSection targetType="character" targetId={id!} />
    </div>
  );
};

