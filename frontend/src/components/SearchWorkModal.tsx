import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface SearchWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const SearchWorkModal: React.FC<SearchWorkModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSearchResults([]);
      setError('');
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setSearchResults([]);

    try {
      // 只在数据库中模糊搜索
      const { data, error: searchError } = await supabase
        .from('works')
        .select('id, name_cn, name_en, name_jp, type, cover_url')
        .or(`name_cn.ilike.%${query}%,name_en.ilike.%${query}%,name_jp.ilike.%${query}%`)
        .limit(10);

      if (searchError) throw searchError;

      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        // 没有找到，提示用户去提交
        setError('No matching works found. Would you like to submit this work?');
      }
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNew = () => {
    onClose();
    navigate('/submit', { state: { workName: query } });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-eva-surface border border-white/10 rounded-xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Search className="w-6 h-6 text-eva-secondary" />
          Search ACGN Work
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Work Name (中/英/日 any language)
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g., 进击的巨人 / Attack on Titan"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
              autoFocus
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="w-full bg-eva-secondary text-eva-bg font-bold py-3 rounded-lg hover:bg-eva-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </div>

        {/* 搜索结果 */}
        {searchResults.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-bold text-lg">Search Results:</h3>
            {searchResults.map((work) => (
              <button
                key={work.id}
                onClick={() => {
                  navigate(`/works/${work.id}`);
                  onClose();
                }}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 text-left transition-colors flex items-center gap-4"
              >
                {work.cover_url && (
                  <img
                    src={work.cover_url}
                    alt={work.name_cn}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-bold text-lg">{work.name_cn}</p>
                  <p className="text-sm text-gray-400">
                    {work.name_en || 'N/A'} • {work.type}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 没有找到的提示 */}
        {error && (
          <div className="mt-6 space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleSubmitNew}
              className="w-full bg-eva-accent text-white font-bold py-3 rounded-lg hover:bg-eva-accent/90 transition-colors"
            >
              Submit "{query}" as New Work
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
