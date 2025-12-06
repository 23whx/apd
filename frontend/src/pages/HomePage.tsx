import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Zap, Activity, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Work } from '../lib/types';
import { SkeletonWorkCard } from '../components/Skeleton';

interface TrendingWork extends Work {
  character_count: number;
  vote_count: number;
}

export const HomePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [showNoResultModal, setShowNoResultModal] = useState(false);
  const [trendingWorks, setTrendingWorks] = useState<TrendingWork[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  useEffect(() => {
    fetchTrendingWorks();
  }, []);

  const fetchTrendingWorks = async () => {
    try {
      // 获取所有作品的投票统计
      const { data: worksData, error: worksError } = await supabase
        .from('works')
        .select('id, name_cn, name_en, name_jp, type, poster_url')
        .limit(50); // 获取前50个作品

      if (worksError) throw worksError;
      if (!worksData || worksData.length === 0) {
        setTrendingWorks([]);
        setLoadingTrending(false);
        return;
      }

      const workIds = worksData.map(w => w.id);

      // 获取每个作品的角色数量
      const { data: charCounts } = await supabase
        .from('characters')
        .select('work_id')
        .in('work_id', workIds);

      // 获取每个作品的投票数（通过角色）
      const { data: charIds } = await supabase
        .from('characters')
        .select('id, work_id')
        .in('work_id', workIds);

      if (charIds && charIds.length > 0) {
        const characterIds = charIds.map(c => c.id);
        const { data: voteCounts } = await supabase
          .from('personality_votes')
          .select('character_id')
          .in('character_id', characterIds);

        // 统计每个作品的数据
        const workStats = worksData.map(work => {
          const workCharIds = charIds.filter(c => c.work_id === work.id).map(c => c.id);
          const characterCount = charCounts?.filter(c => c.work_id === work.id).length || 0;
          const voteCount = voteCounts?.filter(v => workCharIds.includes(v.character_id)).length || 0;

          return {
            ...work,
            character_count: characterCount,
            vote_count: voteCount
          };
        });

        // 按投票数排序，取前3个，去重
        const sortedByVotes = [...workStats].sort((a, b) => b.vote_count - a.vote_count);
        const topVoted = sortedByVotes.slice(0, 3);

        // 去重：如果第一名和历史第一名相同，只保留一个
        const uniqueWorks: TrendingWork[] = [];
        const seenIds = new Set<string>();

        topVoted.forEach(work => {
          if (!seenIds.has(work.id)) {
            uniqueWorks.push(work);
            seenIds.add(work.id);
          }
        });

        setTrendingWorks(uniqueWorks.slice(0, 3));
      } else {
        // 没有角色数据时，显示前3个作品
        setTrendingWorks(worksData.slice(0, 3).map(w => ({
          ...w,
          character_count: 0,
          vote_count: 0
        })));
      }
    } catch (error) {
      console.error('Error fetching trending works:', error);
    } finally {
      setLoadingTrending(false);
    }
  };

  const getWorkName = (work: Work) => {
    if (i18n.language === 'zh') return work.name_cn || work.name_en || work.name_jp || 'Unknown';
    if (i18n.language === 'ja') return work.name_jp || work.name_en || work.name_cn || 'Unknown';
    return work.name_en || work.name_cn || work.name_jp || 'Unknown';
  };

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
          {loadingTrending ? (
            // 显示骨架屏
            <>
              <SkeletonWorkCard />
              <SkeletonWorkCard />
              <SkeletonWorkCard />
            </>
          ) : trendingWorks.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              No trending works yet. <Link to="/submit" className="text-eva-secondary hover:underline">Submit a work</Link> to get started!
            </div>
          ) : (
            trendingWorks.map((work) => (
              <Link
                key={work.id}
                to={`/works/${work.id}`}
                className="group bg-eva-surface border border-white/5 rounded-xl overflow-hidden hover:border-eva-secondary/50 transition-all duration-300"
              >
                <div className="h-48 bg-gray-800 relative overflow-hidden">
                  {work.poster_url ? (
                    <img
                      src={work.poster_url}
                      alt={getWorkName(work)}
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
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-eva-secondary transition-colors line-clamp-2">
                    {getWorkName(work)}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-white/5 px-2 py-1 rounded">
                      {work.character_count} {t('trending.charactersCount')}
                    </span>
                    <span className="bg-white/5 px-2 py-1 rounded">
                      {work.vote_count} {t('trending.votesCount')}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
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

