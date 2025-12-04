import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Search, Loader2, Users } from 'lucide-react';

interface Character {
  id: string;
  name_cn: string;
  name_en?: string;
  name_jp?: string;
  avatar_url?: string;
  work_id: string;
  works?: {
    name_cn: string;
    name_en?: string;
    type: string[];
  };
  top_mbti?: string;
  top_enneagram?: string;
  top_subtype?: string;
  top_yi?: string;
}

export const CharactersPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
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
          works (
            name_cn,
            name_en,
            type
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const chars = data || [];

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
    } catch (err: any) {
      console.error('Error fetching characters:', err);
      setError(err.message);
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

  const getCharacterName = (char: Character) => {
    if (i18n.language === 'zh') return char.name_cn;
    if (i18n.language === 'ja' && char.name_jp) return char.name_jp;
    return char.name_en || char.name_cn;
  };

  const getWorkName = (work: any) => {
    if (!work) return 'Unknown Work';
    if (i18n.language === 'zh') return work.name_cn;
    return work.name_en || work.name_cn;
  };

  const filteredCharacters = characters.filter((char) => {
    const query = searchTerm.toLowerCase();
    return (
      char.name_cn.toLowerCase().includes(query) ||
      char.name_en?.toLowerCase().includes(query) ||
      char.name_jp?.toLowerCase().includes(query) ||
      char.works?.name_cn.toLowerCase().includes(query) ||
      char.works?.name_en?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-eva-secondary mx-auto mb-4" />
          <p className="text-lg text-gray-400">Loading characters...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-8 h-8 text-eva-secondary" />
        <h1 className="text-4xl font-bold">{t('nav.characters')}</h1>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search characters or works..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-eva-surface border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 bg-eva-surface border border-white/10 rounded-xl p-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-eva-secondary mb-1">
              {filteredCharacters.length}
            </div>
            <div className="text-sm text-gray-400">Characters Found</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-eva-accent mb-1">
              {new Set(characters.map(c => c.work_id)).size}
            </div>
            <div className="text-sm text-gray-400">Different Works</div>
          </div>
        </div>
      </div>

      {/* Characters Grid */}
      {filteredCharacters.length === 0 ? (
        <div className="text-center py-12 bg-eva-surface border border-white/10 rounded-xl">
          <p className="text-gray-400">No characters found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredCharacters.map((character) => (
            <Link
              key={character.id}
              to={`/characters/${character.id}`}
              className="group bg-eva-surface border border-white/5 rounded-xl overflow-hidden hover:border-eva-secondary/50 transition-all duration-300"
            >
              <div className="aspect-square bg-gray-800 relative">
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
                  {getCharacterName(character)}
                </h3>
                
                {/* Personality Tags - 统一紫色，一排显示 */}
                <div className="flex flex-wrap gap-1 mb-2">
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
                
                {character.works && (
                  <p className="text-xs text-gray-400 line-clamp-1">
                    {getWorkName(character.works)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination Hint */}
      {characters.length >= 100 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          Showing first 100 characters. Use search to find specific characters.
        </div>
      )}
    </div>
  );
};

