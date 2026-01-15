import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, Eye, Tag, User } from 'lucide-react';
import { CommentSection } from '../components/CommentSection';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BlogPost {
  post_id: string;
  lang: string;
  title: string;
  slug: string;
  content_md: string;
  excerpt: string;
  cover_image?: string;
  category: string;
  tags: string[];
  view_count: number;
  published_at: string;
  author_username: string;
  author_avatar_id: number;
}

export const BlogDetailPage: React.FC = () => {
  const { i18n } = useTranslation();
  const { slug, lang: langParam } = useParams<{ slug: string; lang?: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost();
      incrementViewCount();
    }
  }, [slug, langParam, i18n.language]);

  const currentLang = (() => {
    const raw = (langParam || i18n.language || 'en').toLowerCase();
    if (raw.startsWith('zh')) return 'zh';
    if (raw.startsWith('ja')) return 'ja';
    return 'en';
  })();

  const blogListLink = `/${currentLang}/blog`;

  const fetchPost = async () => {
    setLoading(true);
    try {
      // Prefer current language; fallback to zh
      const { data, error } = await supabase
        .from('blog_post_translations_with_author')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .in('lang', [currentLang, 'zh'])
        .order('lang', { ascending: true }); // not guaranteed, but we'll pick in code

      if (error) throw error;

      const rows = (data || []) as BlogPost[];
      const preferred = rows.find((r) => r.lang === currentLang) || rows.find((r) => r.lang === 'zh') || null;
      setPost(preferred);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await supabase.rpc('increment_post_view_count', { post_slug: slug });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'mbti': '📊 MBTI',
      'enneagram-types': '🎭 九型类型',
      'enneagram-wings': '🪶 九型侧翼',
      'enneagram-instincts': '🧭 九型副型',
      'yixue': '☯️ 易学人格学',
      'tech': '💻 技术',
      'other': '📝 其他',
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eva-secondary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">文章未找到</h1>
        <Link to={blogListLink} className="text-eva-secondary hover:underline">
          返回博客列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Button */}
      <Link
        to={blogListLink}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回博客列表
      </Link>

      {/* Cover Image */}
      {post.cover_image && (
        <div className="mb-8 rounded-xl overflow-hidden border border-white/10">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-auto object-cover"
            style={{ maxHeight: '500px' }}
          />
        </div>
      )}

      {/* Article Header */}
      <article className="bg-eva-surface border border-white/10 rounded-xl p-8 mb-8">
        {/* Category Badge */}
        <div className="mb-4">
          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded bg-eva-accent/20 text-eva-accent">
            {getCategoryLabel(post.category)}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold mb-6">{post.title}</h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{post.author_username}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(post.published_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>{post.view_count} 次阅读</span>
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.flatMap(t => t.split(/[，,]/)).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded bg-white/5 text-gray-400"
              >
                <Tag className="w-3 h-3" />
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content_md}
          </ReactMarkdown>
        </div>
      </article>

      {/* Comments Section */}
      <CommentSection targetType="poll" targetId={post.post_id} />

      {/* Related Posts or Navigation */}
      <div className="mt-8 text-center">
        <Link
          to={blogListLink}
          className="inline-flex items-center gap-2 text-eva-secondary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          查看更多文章
        </Link>
      </div>
    </div>
  );
};
