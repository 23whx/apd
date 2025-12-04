import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Work, Character } from '../lib/types';
import { ArrowLeft, ExternalLink, Plus } from 'lucide-react';

interface CharacterWithPersonality extends Character {
  top_mbti?: string;
  top_enneagram?: string;
  top_subtype?: string;
  top_yi?: string;
}

export const WorkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [work, setWork] = useState<Work | null>(null);
  const [characters, setCharacters] = useState<CharacterWithPersonality[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchWorkDetails();
    }
  }, [id]);

  const fetchWorkDetails = async () => {
    setLoading(true);
    try {
      // Fetch work and characters in parallel
      const [workResult, charsResult] = await Promise.all([
        supabase
          .from('works')
          .select('id, name_cn, name_en, name_jp, type, poster_url, summary_md, source_urls, created_at')
          .eq('id', id)
          .single(),
        supabase
          .from('characters')
          .select('id, name_cn, name_en, name_jp, avatar_url, work_id, created_at')
          .eq('work_id', id)
      ]);

      if (workResult.error) throw workResult.error;
      if (charsResult.error) throw charsResult.error;

      setWork(workResult.data);
      const chars = charsResult.data || [];

      // Fetch personality votes for all characters
      if (chars.length > 0) {
        const characterIds = chars.map(c => c.id);
        const { data: votesData } = await supabase
          .from('personality_votes')
          .select('character_id, mbti, enneagram, subtype, yi_hexagram')
          .in('character_id', characterIds);

        // Calculate top personality for each character
        const charsWithPersonality = chars.map(char => {
          const charVotes = votesData?.filter(v => v.character_id === char.id) || [];
          
          return {
            ...char,
            top_mbti: getTopVote(charVotes, 'mbti'),
            top_enneagram: getTopVote(charVotes, 'enneagram'),
            top_subtype: getTopVote(charVotes, 'subtype'),
            top_yi: getTopVote(charVotes, 'yi_hexagram')
          };
        });

        setCharacters(charsWithPersonality);
      } else {
        setCharacters(chars);
      }
    } catch (error) {
      console.error('Error fetching work details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTopVote = (votes: any[], field: string): string | undefined => {
    const counts: Record<string, number> = {};
    votes.forEach(vote => {
      const value = vote[field];
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
    
    const entries = Object.entries(counts);
    if (entries.length === 0) return undefined;
    
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  };

  const getWorkName = (work: Work) => {
    if (i18n.language === 'zh') return work.name_cn;
    if (i18n.language === 'ja' && work.name_jp) return work.name_jp;
    return work.name_en || work.name_cn;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eva-secondary"></div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Work not found</h1>
        <Link to="/works" className="text-eva-secondary hover:underline">
          Back to works
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to="/works"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to works
      </Link>

      {/* Work Header */}
      <div className="bg-eva-surface border border-white/10 rounded-xl p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster/Cover Image */}
          <div className="w-full md:w-64 flex-shrink-0">
            {work.poster_url ? (
              <img
                src={work.poster_url}
                alt={getWorkName(work)}
                className="w-full h-auto object-contain rounded-lg border border-white/10"
                style={{ maxHeight: '400px' }}
              />
            ) : (
              <div className="w-full h-80 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
                No Poster
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{getWorkName(work)}</h1>
                <div className="flex flex-col gap-1 text-gray-400 text-sm">
                  {work.name_cn && i18n.language !== 'zh' && <span>中文: {work.name_cn}</span>}
                  {work.name_en && <span>English: {work.name_en}</span>}
                  {work.name_jp && <span>日本語: {work.name_jp}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(Array.isArray(work.type) ? work.type : [work.type]).map((type) => (
                  <span key={type} className="bg-eva-secondary/20 text-eva-secondary px-3 py-1 rounded text-sm font-bold">
                    {t(`workTypes.${type}`)}
                  </span>
                ))}
              </div>
            </div>

            {work.summary_md && (
              <div className="prose prose-invert max-w-none mb-4">
                <p className="text-gray-300">{work.summary_md}</p>
              </div>
            )}

            {work.source_urls && (
              <div className="flex gap-2 mt-4">
                {Object.entries(work.source_urls as Record<string, string>).map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-eva-secondary hover:underline"
                  >
                    {key} <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Characters Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            Characters ({characters.length})
          </h2>
          {user && (
            <Link
              to={`/works/${id}/submit-character`}
              className="bg-eva-accent text-white px-4 py-2 rounded-lg hover:bg-eva-accent/90 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Character
            </Link>
          )}
        </div>

        {characters.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-eva-surface border border-white/10 rounded-xl">
            No characters found for this work
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {characters.map((character) => (
              <Link
                key={character.id}
                to={`/characters/${character.id}`}
                className="group bg-eva-surface border border-white/5 rounded-xl overflow-hidden hover:border-eva-secondary/50 transition-all"
              >
                <div className="aspect-square bg-gray-800 relative flex items-center justify-center">
                  {character.avatar_url ? (
                    <img
                      src={character.avatar_url}
                      alt={character.name_cn}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">
                      ?
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-white group-hover:text-eva-secondary transition-colors line-clamp-2 text-sm mb-2">
                    {character.name_cn}
                  </h3>
                  
                  {/* Personality Tags - 统一紫色，一排显示 */}
                  <div className="flex flex-wrap gap-1">
                    {character.top_mbti && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-eva-accent/20 text-eva-accent font-bold">
                        {character.top_mbti}
                      </span>
                    )}
                    {character.top_enneagram && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-eva-accent/20 text-eva-accent font-bold">
                        {character.top_enneagram}
                      </span>
                    )}
                    {character.top_subtype && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-eva-accent/20 text-eva-accent font-bold">
                        {character.top_subtype}
                      </span>
                    )}
                    {character.top_yi && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-eva-accent/20 text-eva-accent font-bold">
                        {character.top_yi.substring(0, 10)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

