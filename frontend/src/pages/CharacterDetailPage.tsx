import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Character, VoteStatistics } from '../lib/types';
import { ArrowLeft, ExternalLink, TrendingUp } from 'lucide-react';
import { VotePanel } from '../components/VotePanel';
import { VoteChart } from '../components/VoteChart';
import { CommentSection } from '../components/CommentSection';

export const CharacterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [stats, setStats] = useState<VoteStatistics>({
    mbti: {},
    enneagram: {},
    subtype: {},
    yi_hexagram: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCharacterDetails();
      fetchVoteStatistics();
    }
  }, [id]);

  const fetchCharacterDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*, works(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCharacter(data);
    } catch (error) {
      console.error('Error fetching character:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoteStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from('personality_votes')
        .select('mbti, enneagram, subtype, yi_hexagram')
        .eq('character_id', id);

      if (error) throw error;

      // Aggregate statistics
      const stats: VoteStatistics = {
        mbti: {},
        enneagram: {},
        subtype: {},
        yi_hexagram: {}
      };

      data?.forEach((vote) => {
        if (vote.mbti) stats.mbti[vote.mbti] = (stats.mbti[vote.mbti] || 0) + 1;
        if (vote.enneagram) stats.enneagram[vote.enneagram] = (stats.enneagram[vote.enneagram] || 0) + 1;
        if (vote.subtype) stats.subtype[vote.subtype] = (stats.subtype[vote.subtype] || 0) + 1;
        if (vote.yi_hexagram) stats.yi_hexagram[vote.yi_hexagram] = (stats.yi_hexagram[vote.yi_hexagram] || 0) + 1;
      });

      setStats(stats);
    } catch (error) {
      console.error('Error fetching vote statistics:', error);
    }
  };

  const getCharacterName = (char: Character) => {
    if (i18n.language === 'zh') return char.name_cn;
    if (i18n.language === 'ja' && char.name_jp) return char.name_jp;
    return char.name_en || char.name_cn;
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
        <h1 className="text-2xl font-bold mb-4">Character not found</h1>
        <Link to="/works" className="text-eva-secondary hover:underline">
          Back to works
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
        Back to work
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Character Info */}
        <div className="lg:col-span-1">
          <div className="bg-eva-surface border border-white/10 rounded-xl p-6 sticky top-20">
            <div className="aspect-square bg-gray-800 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
              {character.avatar_url ? (
                <img
                  src={character.avatar_url}
                  alt={character.name_cn}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-gray-600">
                  ?
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold mb-2">{getCharacterName(character)}</h1>

            <div className="text-sm text-gray-400 space-y-1 mb-4">
              {character.name_cn && i18n.language !== 'zh' && <div>中文: {character.name_cn}</div>}
              {character.name_en && <div>English: {character.name_en}</div>}
              {character.name_jp && <div>日本語: {character.name_jp}</div>}
            </div>

            {character.source_link && (
              <a
                href={character.source_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-eva-secondary hover:underline"
              >
                View Source <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Right Column: Votes and Comments */}
        <div className="lg:col-span-2 space-y-8">
          {/* Vote Statistics */}
          <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-eva-secondary" />
              Personality Voting Results
            </h2>

            <div className="space-y-6">
              <VoteChart title="MBTI" data={stats.mbti} />
              <VoteChart title="Enneagram" data={stats.enneagram} />
              <VoteChart title="Subtype" data={stats.subtype} />
              <VoteChart title="Yi Hexagram" data={stats.yi_hexagram} />
            </div>
          </div>

          {/* Vote Panel */}
          {user && (
            <VotePanel characterId={id!} onVoteSubmit={fetchVoteStatistics} />
          )}

          {/* Comments */}
          <CommentSection targetType="character" targetId={id!} />
        </div>
      </div>
    </div>
  );
};

