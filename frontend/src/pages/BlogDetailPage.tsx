import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, Eye, Tag, User, Share2, Link2, Check, X as XIcon } from 'lucide-react';
import { CommentSection } from '../components/CommentSection';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

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
  article_type?: string;
  external_url?: string;
}

export const BlogDetailPage: React.FC = () => {
  const { i18n, t } = useTranslation();
  const { slug, lang: langParam } = useParams<{ slug: string; lang?: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const viewCountIncrementedRef = useRef<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // 动态计算当前语言，确保响应 URL 参数和全局语言切换
  const normalizeLang = (raw: string | undefined | null): 'zh' | 'en' | 'ja' => {
    const v = (raw || 'en').toLowerCase();
    if (v.startsWith('zh')) return 'zh';
    if (v.startsWith('ja')) return 'ja';
    return 'en';
  };

  const getCurrentLang = (): 'zh' | 'en' | 'ja' => normalizeLang(langParam || i18n.language);
  const getDesiredLangFromI18n = (): 'zh' | 'en' | 'ja' => normalizeLang(i18n.language);

  // 用户在 UI 切换语言时，同步更新 /:lang/blog/:slug 的 URL 前缀，保证查询的是对应语言的翻译
  useEffect(() => {
    if (!slug) return;
    if (!langParam) return; // /blog/:slug 不强制改 URL

    const urlLang = normalizeLang(langParam);
    const desired = getDesiredLangFromI18n();
    if (urlLang !== desired) {
      navigate(`/${desired}/blog/${slug}`, { replace: true });
    }
  }, [slug, langParam, i18n.language, navigate]);

  useEffect(() => {
    if (!slug) return;
    fetchPost();
  }, [slug, langParam, i18n.language]);

  // Dev 环境 React.StrictMode 会让 effect 触发两次：这里确保同一篇文章只计数一次
  useEffect(() => {
    if (!slug) return;
    if (viewCountIncrementedRef.current === slug) return;
    viewCountIncrementedRef.current = slug;
    incrementViewCount();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const currentLang = getCurrentLang();
      
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
      'enneagram-types': `🎭 ${t('blog.categories.enneagramTypes')}`,
      'enneagram-wings': `🪶 ${t('blog.categories.enneagramWings')}`,
      'enneagram-instincts': `🧭 ${t('blog.categories.enneagramInstincts')}`,
      'yixue': `☯️ ${t('blog.categories.yixue')}`,
      'tech': `💻 ${t('blog.categories.tech')}`,
      'other': `📝 ${t('blog.categories.other')}`,
    };
    return labels[category] || category;
  };

  // 获取当前文章的完整 URL
  const getShareUrl = () => {
    return window.location.href;
  };

  // 复制链接到剪贴板
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // 分享到各个平台
  const shareToX = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(post?.title || '');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareToWeibo = () => {
    const url = encodeURIComponent(getShareUrl());
    const title = encodeURIComponent(post?.title || '');
    window.open(`https://service.weibo.com/share/share.php?url=${url}&title=${title}`, '_blank');
  };

  // 禁止复制文章内容
  const handleCopy = (e: React.ClipboardEvent) => {
    e.preventDefault();
    alert(t('blog.copyDisabled'));
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eva-secondary"></div>
      </div>
    );
  }

  const currentLang = getCurrentLang();
  const blogListLink = `/${currentLang}/blog`;

  if (!post) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('blog.articleNotFound')}</h1>
        <Link to={blogListLink} className="text-eva-secondary hover:underline">
          {t('blog.backToBlogList')}
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
        {t('blog.backToBlogList')}
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
            <span>{t('blog.readCount', { count: post.view_count })}</span>
          </div>
          
          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-eva-secondary/10 hover:bg-eva-secondary/20 border border-eva-secondary/30 rounded-lg text-eva-secondary transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span className="font-medium">{t('blog.share')}</span>
          </button>
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
        <div 
          className="prose prose-invert prose-lg max-w-none select-none"
          onCopy={handleCopy}
          onContextMenu={handleContextMenu}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
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
          {t('blog.viewMoreArticles')}
        </Link>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-eva-surface border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Share2 className="w-6 h-6 text-eva-secondary" />
                <h3 className="text-xl font-bold text-white">{t('blog.shareTitle')}</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Share Platforms */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {/* X (Twitter) */}
              <button
                onClick={shareToX}
                className="flex flex-col items-center gap-2 p-4 bg-black/30 hover:bg-black/50 border border-white/10 hover:border-white/30 rounded-xl transition-all group"
              >
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-400 group-hover:text-white">X</span>
              </button>

              {/* Facebook */}
              <button
                onClick={shareToFacebook}
                className="flex flex-col items-center gap-2 p-4 bg-black/30 hover:bg-black/50 border border-white/10 hover:border-white/30 rounded-xl transition-all group"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-400 group-hover:text-white">Facebook</span>
              </button>

              {/* Weibo */}
              <button
                onClick={shareToWeibo}
                className="flex flex-col items-center gap-2 p-4 bg-black/30 hover:bg-black/50 border border-white/10 hover:border-white/30 rounded-xl transition-all group"
              >
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.68 14.96c-2.51.46-4.68-.88-4.84-2.99-.16-2.11 1.75-4.12 4.27-4.58 2.51-.46 4.68.88 4.84 2.99.16 2.11-1.75 4.12-4.27 4.58zm11.2-4.58c-.14-.39-.54-.61-.9-.48-.35.13-.51.54-.37.92.64 1.79.13 3.26-.98 4.26-.74.66-1.76 1.05-2.9 1.05-1.01 0-1.91-.27-2.69-.75-.21-.13-.48-.11-.66.05-.18.16-.23.42-.11.64.85 1.51 2.72 2.27 4.68 1.64 1.54-.5 2.78-1.61 3.31-3.04.42-1.15.36-2.42-.38-3.29zm-4.08-1.65c.56-1.01.41-2.15-.36-2.97-.83-.88-2.21-1.24-3.49-.91-.38.1-.61.49-.51.87.1.38.49.61.87.51.81-.21 1.68.02 2.18.58.47.53.58 1.25.23 1.88-.14.25-.13.55.03.79.16.24.44.36.72.29.31-.08.47-.39.33-.64zm3.72-4.7C17.94 1.71 14.4.78 11.14 2.01c-.77.29-1.09 1.15-.72 1.92.37.77 1.24 1.09 2.01.72 2.15-.81 4.57-.21 5.99 1.62 1.42 1.83 1.42 4.35 0 6.18-.29.37-.29.89 0 1.26.29.37.77.37 1.06 0 2.01-2.59 2.01-6.18 0-8.77z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-400 group-hover:text-white">{t('blog.weibo')}</span>
              </button>
            </div>

            {/* Copy Link */}
            <div className="p-4 bg-black/30 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={getShareUrl()}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-gray-300 outline-none"
                />
                <button
                  onClick={copyLink}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    linkCopied
                      ? 'bg-green-600 text-white'
                      : 'bg-eva-secondary text-eva-bg hover:bg-eva-secondary/80'
                  }`}
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t('blog.copied')}</span>
                    </>
                  ) : (
                    <span>{t('blog.copy')}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Notice */}
            <p className="mt-4 text-xs text-gray-500 text-center">
              {t('blog.shareNotice')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
