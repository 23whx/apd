import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Work } from '../lib/types';
import { Search } from 'lucide-react';

export const WorksPage: React.FC = () => {
  const { t } = useTranslation();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'anime' | 'manga' | 'game' | 'novel'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWorks();
  }, []); // Only fetch once on mount

  const fetchWorks = async () => {
    setLoading(true);
    try {
      // Only select needed fields
      const { data, error } = await supabase
        .from('works')
        .select('id, name_cn, name_en, name_jp, alias, type, poster_url, summary_md, created_at')
        .order('created_at', { ascending: false })
        .limit(100); // Limit initial load

      if (error) throw error;
      setWorks(data || []);
    } catch (error) {
      console.error('Error fetching works:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter works by type and search query in frontend
  const filteredWorks = works
    .filter((work) => {
      // Filter by type
      if (filter !== 'all' && !work.type.includes(filter)) {
        return false;
      }
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          work.name_cn.toLowerCase().includes(query) ||
          work.name_en?.toLowerCase().includes(query) ||
          work.name_jp?.toLowerCase().includes(query)
        );
      }
      return true;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('nav.works')}</h1>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('hero.searchPlaceholder')}
              className="w-full bg-eva-surface border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-eva-secondary"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'anime', 'manga', 'game', 'novel'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === type
                    ? 'bg-eva-secondary text-eva-bg'
                    : 'bg-eva-surface border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {type === 'all' ? 'All' : t(`workTypes.${type}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Works Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eva-secondary"></div>
        </div>
      ) : filteredWorks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No works found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredWorks.map((work) => (
            <Link
              key={work.id}
              to={`/works/${work.id}`}
              className="group bg-eva-surface border border-white/5 rounded-xl overflow-hidden hover:border-eva-secondary/50 transition-all duration-300"
            >
              <div className="h-48 bg-gray-800 relative overflow-hidden">
                {work.poster_url ? (
                  <img
                    src={work.poster_url}
                    alt={work.name_cn}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-eva-surface to-transparent opacity-80"></div>
                <div className="absolute top-4 right-4 flex gap-1 flex-wrap justify-end">
                  {(Array.isArray(work.type) ? work.type : [work.type]).map((type) => (
                    <span key={type} className="bg-black/50 backdrop-blur text-xs px-2 py-1 rounded text-white border border-white/10">
                      {t(`workTypes.${type}`)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-eva-secondary transition-colors line-clamp-1">
                  {work.name_cn}
                </h3>
                {work.name_en && (
                  <p className="text-sm text-gray-400 line-clamp-1">{work.name_en}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

