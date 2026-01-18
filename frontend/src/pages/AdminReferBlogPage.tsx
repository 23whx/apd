import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Link as LinkIcon, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const AdminReferBlogPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, adminChecked } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [externalUrl, setExternalUrl] = useState('');
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [tags, setTags] = useState('');
  const [publishNow, setPublishNow] = useState(true);

  const categories = [
    { value: 'mbti', label: '📊 MBTI' },
    { value: 'enneagram-types', label: '🎭 九型基本类型' },
    { value: 'enneagram-wings', label: '🪶 九型侧翼' },
    { value: 'enneagram-instincts', label: '🧭 九型副型' },
    { value: 'tritype', label: '🔺 Tritype' },
    { value: 'yixue', label: '☯️ 易学人格学' },
    { value: 'tech', label: '💻 技术文章' },
    { value: 'other', label: '📝 其他' },
  ];

  const handleSubmit = async () => {
    if (!externalUrl.trim()) {
      setError('请输入文章链接');
      return;
    }

    if (!title.trim()) {
      setError('请输入文章标题');
      return;
    }

    // Validate URL
    try {
      new URL(externalUrl);
    } catch {
      setError('请输入有效的URL链接');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tagsArray = tags.split(/[，,]/).map(t => t.trim()).filter(t => t);
      
      // Generate a slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100) + '-' + Date.now();

      const articleData = {
        article_type: 'external',
        external_url: externalUrl.trim(),
        title: title.trim(),
        slug,
        content_md: `> 本文引用自外部链接\n\n${excerpt || ''}`,
        excerpt: excerpt.trim() || null,
        cover_image: coverImage.trim() || null,
        category,
        tags: tagsArray,
        published: publishNow,
        published_at: publishNow ? new Date().toISOString() : null,
        author_id: user!.id,
        default_lang: 'zh',
      };

      const { error: insertError } = await supabase
        .from('blog_posts')
        .insert([articleData]);

      if (insertError) throw insertError;

      alert('引用文章已保存！');
      navigate('/admin/blog');
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  if (!adminChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eva-secondary mb-4"></div>
          <p className="text-gray-400">检查权限中...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">权限不足</h1>
        <p className="text-gray-400">只有管理员可以访问此页面</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate('/admin/blog')}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回文章列表
      </button>

      <div className="flex items-center gap-3 mb-2">
        <LinkIcon className="w-8 h-8 text-eva-secondary" />
        <h1 className="text-4xl font-bold">引用外部文章</h1>
      </div>
      <p className="text-gray-400 mb-8">将知乎、B站专栏、Medium等平台的优质文章收录到本站博客</p>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* 外链URL */}
        <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            文章链接 <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://zhuanlan.zhihu.com/p/... 或 https://www.bilibili.com/read/cv..."
              className="w-full bg-black/30 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            支持：知乎专栏、B站专栏、Medium、微信公众号文章等
          </p>
        </div>

        {/* 标题 */}
        <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            文章标题 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入文章标题..."
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-xl font-bold focus:outline-none focus:border-eva-secondary"
          />
        </div>

        {/* 摘要 */}
        <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            文章摘要（可选）
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="简要描述文章内容..."
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-eva-secondary"
          />
        </div>

        {/* 封面图 */}
        <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            封面图链接（可选）
          </label>
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://example.com/cover.jpg"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
          />
        </div>

        {/* 分类和标签 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              分类 <span className="text-red-400">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              标签（可选）
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="标签1,标签2,标签3"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
            />
            <p className="mt-2 text-xs text-gray-500">用逗号或中文逗号分隔多个标签</p>
          </div>
        </div>

        {/* 发布状态 */}
        <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="w-5 h-5 rounded border-white/10 bg-black/30 text-eva-secondary focus:ring-eva-secondary focus:ring-offset-0"
            />
            <span className="text-sm font-medium text-gray-300">
              立即发布（取消勾选将保存为草稿）
            </span>
          </label>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-eva-secondary text-eva-bg px-8 py-4 rounded-lg font-bold hover:bg-eva-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? '保存中...' : publishNow ? '发布引用' : '保存草稿'}
          </button>
          <button
            onClick={() => navigate('/admin/blog')}
            className="px-8 py-4 rounded-lg font-bold bg-white/5 hover:bg-white/10 transition-all"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
