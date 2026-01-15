import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, BookOpen, Calendar, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BlogPost {
  post_id: string;
  lang: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image?: string;
  category: string;
  tags: string[];
  view_count: number;
  published_at: string;
  author_username: string;
  author_avatar_id: number;
}

export const BlogPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { lang: langParam } = useParams<{ lang?: string }>();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchPosts();
  }, [langParam, i18n.language]);

  const currentLang = (() => {
    const raw = (langParam || i18n.language || 'en').toLowerCase();
    if (raw.startsWith('zh')) return 'zh';
    if (raw.startsWith('ja')) return 'ja';
    return 'en';
  })();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_post_translations_with_author')
        .select('*')
        .eq('published', true)
        .in('lang', [currentLang, 'zh'])
        .order('published_at', { ascending: false });

      if (error) throw error;

      // Prefer current language; fallback to zh if missing
      const byPost = new Map<string, BlogPost>();
      (data || []).forEach((row: any) => {
        const postId = row.post_id as string;
        const existing = byPost.get(postId);
        if (!existing) {
          byPost.set(postId, row as BlogPost);
          return;
        }
        if (existing.lang !== currentLang && row.lang === currentLang) {
          byPost.set(postId, row as BlogPost);
        }
      });

      setPosts(Array.from(byPost.values()));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: t('blog.categories.all'), icon: '📚' },
    { value: 'mbti', label: 'MBTI', icon: '📊' },
    { value: 'enneagram-types', label: t('blog.categories.enneagramTypes'), icon: '🎭' },
    { value: 'enneagram-wings', label: t('blog.categories.enneagramWings'), icon: '🪶' },
    { value: 'enneagram-instincts', label: t('blog.categories.enneagramInstincts'), icon: '🧭' },
    { value: 'tritype', label: 'Tritype', icon: '🔺' },
    { value: 'yixue', label: t('blog.categories.yixue'), icon: '☯️' },
    { value: 'tech', label: t('blog.categories.tech'), icon: '💻' },
    { value: 'other', label: t('blog.categories.other'), icon: '📝' },
  ];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPostLink = (post: BlogPost) => `/${post.lang}/blog/${post.slug}`;

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'mbti':
        return {
          gradient: 'from-blue-600/20 via-eva-accent/20 to-purple-600/20',
          iconColor: 'text-blue-400/30',
          borderColor: 'border-blue-500/30',
          label: 'MBTI'
        };
      case 'enneagram-types':
      case 'enneagram-wings':
      case 'enneagram-instincts':
        return {
          gradient: 'from-orange-600/20 via-red-600/20 to-pink-600/20',
          iconColor: 'text-orange-400/30',
          borderColor: 'border-orange-500/30',
          label: 'Enneagram'
        };
      case 'tritype':
        return {
          gradient: 'from-rose-600/20 via-fuchsia-600/20 to-pink-600/20',
          iconColor: 'text-rose-400/30',
          borderColor: 'border-rose-500/30',
          label: 'Tritype'
        };
      case 'yixue':
        return {
          gradient: 'from-teal-600/20 via-emerald-600/20 to-yellow-600/20',
          iconColor: 'text-teal-400/30',
          borderColor: 'border-teal-500/30',
          label: 'YiXue'
        };
      case 'tech':
        return {
          gradient: 'from-cyan-600/20 via-blue-600/20 to-indigo-600/20',
          iconColor: 'text-cyan-400/30',
          borderColor: 'border-cyan-500/30',
          label: 'Tech'
        };
      default:
        return {
          gradient: 'from-gray-600/20 via-slate-600/20 to-zinc-600/20',
          iconColor: 'text-gray-400/30',
          borderColor: 'border-white/10',
          label: 'APD'
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-3">
          <BookOpen className="w-12 h-12 text-eva-secondary" />
          {t('blog.title')}
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          {t('blog.subtitle')}
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('blog.searchPlaceholder')}
            className="w-full bg-eva-surface border border-white/10 rounded-lg pl-12 pr-4 py-4 text-white focus:outline-none focus:border-eva-secondary"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === cat.value
                  ? 'bg-eva-secondary text-eva-bg'
                  : 'bg-eva-surface border border-white/10 text-gray-400 hover:text-white hover:border-white/30'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eva-secondary"></div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-eva-surface border border-white/10 rounded-xl">
          <p className="text-gray-400">{t('blog.noArticles')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const styles = getCategoryStyles(post.category);
            return (
              <Link
                key={post.post_id}
                to={getPostLink(post)}
                className={`group bg-eva-surface border ${styles.borderColor} rounded-xl overflow-hidden hover:border-eva-secondary/50 transition-all duration-300 flex flex-col`}
              >
                {/* Cover Image or Aesthetic Placeholder */}
                {post.cover_image ? (
                  <div className="h-40 bg-gray-800 relative overflow-hidden">
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-eva-surface to-transparent opacity-80"></div>
                  </div>
                ) : (
                  <div className={`h-40 bg-gradient-to-br ${styles.gradient} flex items-center justify-center relative overflow-hidden`}>
                    {/* Background Decorative Icon */}
                    <div className={`absolute -right-4 -bottom-4 transform rotate-12 ${styles.iconColor}`}>
                      <BookOpen className="w-32 h-32 opacity-20" />
                    </div>
                    {/* Central Brand Mark */}
                    <div className="relative z-10 flex flex-col items-center text-center px-4">
                      <div className={`text-[10px] font-mono tracking-[0.3em] uppercase ${styles.iconColor.replace('/30', '/60')} mb-2`}>
                        {styles.label}
                      </div>
                      <BookOpen className={`w-10 h-10 ${styles.iconColor.replace('/30', '/80')}`} />
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400 font-mono uppercase tracking-wider">
                      {categories.find(c => c.value === post.category)?.label.replace(/[📊🎭🪶🧭☯️💻📝]\s/, '') || post.category}
                    </span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                      <Eye className="w-3 h-3" />
                      {post.view_count}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-eva-secondary transition-colors line-clamp-4 leading-snug">
                    {post.title}
                  </h3>

                  {post.excerpt && (
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.published_at)}
                    </div>
                    <div className="text-[10px] font-bold text-eva-secondary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      {t('blog.readMore')} →
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Results count */}
      {!loading && filteredPosts.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          {t('blog.showingCount', { count: filteredPosts.length })}
        </div>
      )}
    </div>
  );
};
