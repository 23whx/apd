import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import type { Work, Character } from '../lib/types';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export const WorkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const [work, setWork] = useState<Work | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchWorkDetails();
    }
  }, [id]);

  const fetchWorkDetails = async () => {
    setLoading(true);
    try {
      // Fetch work
      const { data: workData, error: workError } = await supabase
        .from('works')
        .select('*')
        .eq('id', id)
        .single();

      if (workError) throw workError;
      setWork(workData);

      // Fetch characters
      const { data: charsData, error: charsError } = await supabase
        .from('characters')
        .select('*')
        .eq('work_id', id);

      if (charsError) throw charsError;
      setCharacters(charsData || []);
    } catch (error) {
      console.error('Error fetching work details:', error);
    } finally {
      setLoading(false);
    }
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
          <div className="w-full md:w-64 h-80 bg-gray-800 rounded-lg flex-shrink-0"></div>

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
              <span className="bg-eva-secondary/20 text-eva-secondary px-3 py-1 rounded text-sm font-bold">
                {t(`workTypes.${work.type}`)}
              </span>
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
        <h2 className="text-2xl font-bold mb-6">
          Characters ({characters.length})
        </h2>

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
                <div className="aspect-square bg-gray-800 relative">
                  {character.avatar_url ? (
                    <img
                      src={character.avatar_url}
                      alt={character.name_cn}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">
                      ?
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-white group-hover:text-eva-secondary transition-colors line-clamp-2 text-sm">
                    {character.name_cn}
                  </h3>
                  {character.name_en && (
                    <p className="text-xs text-gray-400 line-clamp-1">{character.name_en}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

