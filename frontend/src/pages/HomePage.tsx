import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Zap, Activity, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [showNoResultModal, setShowNoResultModal] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    
    try {
      // 尝试使用 RPC 函数进行搜索
      const { data: allResults, error: searchError } = await supabase.rpc('search_works', {
        search_query: searchQuery
      }) as { data: any[] | null; error: any };

      if (searchError) {
        // RPC 函数不存在，直接跳转到作品列表页让用户手动筛选
        console.warn('RPC search failed, redirecting to works page:', searchError);
        navigate(`/works?search=${encodeURIComponent(searchQuery)}`);
        setSearching(false);
        return;
      }

      if (allResults && allResults.length > 0) {
        if (allResults.length === 1) {
          navigate(`/works/${allResults[0].id}`);
        } else {
          navigate(`/works?search=${encodeURIComponent(searchQuery)}`);
        }
      } else {
        // 没找到结果，显示确认对话框
        setShowNoResultModal(true);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      // 发生错误时也跳转到作品列表页
      navigate(`/works?search=${encodeURIComponent(searchQuery)}`);
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-20">
          <div className="absolute top-10 right-10 w-64 h-64 bg-eva-accent rounded-full blur-[100px]"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-eva-secondary rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eva-secondary/10 border border-eva-secondary/20 text-eva-secondary text-xs font-bold tracking-widest uppercase mb-6">
            <Zap className="w-3 h-3" />
            {t('hero.status')}
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {t('hero.title')}
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            {t('hero.subtitle')} <br />
            {t('hero.description')}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-eva-secondary to-eva-accent opacity-30 blur group-hover:opacity-50 transition duration-200 rounded-lg"></div>
            <div className="relative flex items-center bg-eva-surface rounded-lg p-1">
              <Search className="w-6 h-6 text-gray-400 ml-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder={t('hero.searchPlaceholder')}
                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 px-4 py-3 outline-none"
                disabled={searching}
              />
              <button 
                onClick={handleSearch}
                disabled={!searchQuery.trim() || searching}
                className="bg-eva-secondary text-eva-bg px-6 py-2 rounded font-bold hover:bg-eva-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {searching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-eva-bg border-t-transparent rounded-full animate-spin"></div>
                    搜索中...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    搜索
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-eva-secondary" />
            {t('trending.title')}
          </h2>
          <Link to="/works" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
            {t('trending.viewAll')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder Cards */}
          {[
            { title: 'Neon Genesis Evangelion', type: 'anime', chars: 24, votes: '1.2k' },
            { title: 'Genshin Impact', type: 'game', chars: 85, votes: '15k' },
            { title: 'Lord of the Mysteries', type: 'novel', chars: 12, votes: '800' },
          ].map((work, idx) => (
            <Link
              key={idx}
              to={`/works/${idx + 1}`}
              className="group bg-eva-surface border border-white/5 rounded-xl overflow-hidden hover:border-eva-secondary/50 transition-all duration-300"
            >
              <div className="h-48 bg-gray-800 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-eva-surface to-transparent opacity-80"></div>
                <span className="absolute top-4 right-4 bg-black/50 backdrop-blur text-xs px-2 py-1 rounded text-white border border-white/10">
                  {t(`workTypes.${work.type}`)}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-eva-secondary transition-colors">
                  {work.title}
                </h3>
                <p className="text-sm text-gray-400 mb-4">Psychological, Mecha, Post-Apocalyptic</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="bg-white/5 px-2 py-1 rounded">
                    {work.chars} {t('trending.charactersCount')}
                  </span>
                  <span className="bg-white/5 px-2 py-1 rounded">
                    {work.votes} {t('trending.votesCount')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* No Result Modal */}
      {showNoResultModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-eva-surface border border-white/10 rounded-xl max-w-md w-full p-8 relative">
            <h3 className="text-2xl font-bold mb-4">未找到作品</h3>
            <p className="text-gray-300 mb-6">
              数据库中没有找到「{searchQuery}」相关的作品。您想要提交这个作品吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNoResultModal(false);
                  navigate('/submit', { state: { workName: searchQuery } });
                }}
                className="flex-1 bg-eva-secondary text-eva-bg font-bold py-3 rounded-lg hover:bg-eva-secondary/90 transition-colors"
              >
                是，去提交
              </button>
              <button
                onClick={() => {
                  setShowNoResultModal(false);
                  setSearchQuery('');
                }}
                className="flex-1 bg-white/10 text-white font-bold py-3 rounded-lg hover:bg-white/20 transition-colors"
              >
                否，留在主页
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

