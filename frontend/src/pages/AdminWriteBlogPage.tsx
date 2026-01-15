import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, Eye, ArrowLeft, AlertCircle, Image as ImageIcon } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { useTranslation } from 'react-i18next';
import remarkGfm from 'remark-gfm';

type BlogLang = 'zh' | 'en' | 'ja';

export const AdminWriteBlogPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { user, loading: authLoading } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  // 文章数据
  const initialLang: BlogLang = (() => {
    const raw = (i18n.language || 'en').toLowerCase();
    if (raw.startsWith('zh')) return 'zh';
    if (raw.startsWith('ja')) return 'ja';
    return 'en';
  })();
  const [lang, setLang] = useState<BlogLang>(initialLang);
  const [translationsDraft, setTranslationsDraft] = useState<Record<BlogLang, { title: string; excerpt: string; content: string }>>({
    zh: { title: '', excerpt: '', content: '' },
    en: { title: '', excerpt: '', content: '' },
    ja: { title: '', excerpt: '', content: '' },
  });
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState<string>('tech');
  const [tags, setTags] = useState<string>('');
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setAdminChecked(true);
      setIsAdmin(false);
      return;
    }

    (async () => {
      const ok = await checkAdminStatus();
      setAdminChecked(true);
      if (ok && isEditMode && id) {
        fetchBlogPost();
      }
    })();
  }, [id, user?.id, authLoading]);

  const checkAdminStatus = async (): Promise<boolean> => {
    if (!user) return false;

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      return false;
    }

    const ok = data?.role === 'admin' || data?.role === 'mod';
    setIsAdmin(ok);
    return ok;
  };

  const fetchBlogPost = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // slug is shared across languages in current schema
      setSlug(data.slug);
      setCoverImage(data.cover_image || '');
      setCategory(data.category);
      setTags((data.tags || []).join(', '));
      setPublished(data.published);

      // Load translation for current language (fallback to zh)
      await loadTranslationForLang(data.id, lang);
    } catch (err: any) {
      setError(err.message || '加载文章失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTranslationForLang = async (postId: string, targetLang: BlogLang) => {
    try {
      const { data, error } = await supabase
        .from('blog_post_translations')
        .select('lang, title, excerpt, content_md')
        .eq('post_id', postId)
        .eq('lang', targetLang)
        .maybeSingle();

      if (error) throw error;

      const row = data || null;
      if (row) {
        setTranslationsDraft((prev) => ({
          ...prev,
          [targetLang]: {
            title: row.title || '',
            excerpt: row.excerpt || '',
            content: row.content_md || '',
          },
        }));
        setTitle(row.title || '');
        setExcerpt(row.excerpt || '');
        setContent(row.content_md || '');
        return;
      }

      // If translation missing, show blank (admin can create it)
      setTitle('');
      setExcerpt('');
      setContent('');
    } catch (e) {
      console.error('Error loading translation:', e);
    }
  };

  // 自动生成 slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const setTitleForLang = (val: string) => {
    setTitle(val);
    setTranslationsDraft((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], title: val },
    }));
  };

  const setExcerptForLang = (val: string) => {
    setExcerpt(val);
    setTranslationsDraft((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], excerpt: val },
    }));
  };

  const setContentForLang = (val: string) => {
    setContent(val);
    setTranslationsDraft((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], content: val },
    }));
  };

  const handleLangChange = async (nextLang: BlogLang) => {
    if (nextLang === lang) return;

    setLang(nextLang);

    // If we already have draft content, load it immediately
    const draft = translationsDraft[nextLang];
    if (draft?.title || draft?.excerpt || draft?.content) {
      setTitle(draft.title);
      setExcerpt(draft.excerpt);
      setContent(draft.content);
      return;
    }

    // If editing an existing post, load from DB
    if (isEditMode && id) {
      await loadTranslationForLang(id, nextLang);
    } else {
      setTitle('');
      setExcerpt('');
      setContent('');
    }
  };

  // 提取内容中的所有图片/视频 URL
  const extractMediaUrls = (text: string): string[] => {
    const urls: string[] = [];
    const blogMediaPattern = /https:\/\/[^\/]+\.supabase\.co\/storage\/v1\/object\/public\/blog-media\/[^\s\)]+/g;
    const matches = text.match(blogMediaPattern);
    if (matches) {
      urls.push(...matches);
    }
    return urls;
  };

  // 从 URL 中提取文件路径
  const getFilePathFromUrl = (url: string): string | null => {
    const match = url.match(/\/blog-media\/(.+)$/);
    return match ? match[1] : null;
  };

  // 删除 Storage 中的文件
  const deleteMediaFile = async (fileUrl: string) => {
    try {
      const filePath = getFilePathFromUrl(fileUrl);
      if (!filePath) return;

      const { error } = await supabase.storage
        .from('blog-media')
        .remove([filePath]);

      if (error) {
        console.error('Failed to delete file:', error);
      } else {
        console.log('Successfully deleted unused file:', filePath);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  // 清理未使用的媒体文件
  const cleanupUnusedMedia = async (oldContent: string, newContent: string, postId?: string) => {
    try {
      const oldUrls = extractMediaUrls(oldContent);
      const newUrls = extractMediaUrls(newContent);

      // 找出被删除的 URL
      const deletedUrls = oldUrls.filter(url => !newUrls.includes(url));

      if (deletedUrls.length === 0) return;

      // 如果是编辑模式，检查这些 URL 是否在其他语言版本中使用
      if (postId) {
        const { data: translations } = await supabase
          .from('blog_post_translations')
          .select('content_md, lang')
          .eq('post_id', postId);

        if (translations) {
          // 收集所有其他语言版本的 URL
          const otherLangUrls = new Set<string>();
          translations.forEach(trans => {
            if (trans.lang !== lang) {
              const urls = extractMediaUrls(trans.content_md || '');
              urls.forEach(url => otherLangUrls.add(url));
            }
          });

          // 只删除在所有语言版本中都不再使用的文件
          for (const url of deletedUrls) {
            if (!otherLangUrls.has(url)) {
              await deleteMediaFile(url);
            } else {
              console.log('File still used in other language versions:', url);
            }
          }
        }
      } else {
        // 新文章，直接删除
        for (const url of deletedUrls) {
          await deleteMediaFile(url);
        }
      }
    } catch (err) {
      console.error('Error cleaning up unused media:', err);
    }
  };

  // 上传图片/视频到 Supabase Storage
  const uploadMedia = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      // 生成唯一文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // 上传到 Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('blog-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 获取公开 URL
      const { data: { publicUrl } } = supabase.storage
        .from('blog-media')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(`上传失败：${err.message}`);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // 处理粘贴上传
  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          try {
            const url = await uploadMedia(file);
            const imageMarkdown = `![${file.name}](${url})`;
            
            // 尝试获取光标位置并在光标处插入
            const textarea = event.target as HTMLTextAreaElement;
            if (textarea && textarea.selectionStart !== undefined) {
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const newContent = content.substring(0, start) + '\n' + imageMarkdown + '\n' + content.substring(end);
              setContentForLang(newContent);
            } else {
              // 降级方案：添加到末尾
              setContentForLang(content + '\n' + imageMarkdown);
            }
          } catch (err) {
            // Error already handled in uploadMedia
          }
        }
      }
    }
  };

  // 处理拖拽上传
  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        try {
          const url = await uploadMedia(file);
          const isVideo = file.type.startsWith('video/');
          const mediaMarkdown = isVideo
            ? `<video controls src="${url}" style="max-width: 100%;"></video>`
            : `![${file.name}](${url})`;
          
          // 尝试获取 textarea 并在光标处插入
          const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
          if (textarea && textarea.selectionStart !== undefined) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent = content.substring(0, start) + '\n' + mediaMarkdown + '\n' + content.substring(end);
            setContentForLang(newContent);
            
            // 设置新的光标位置
            setTimeout(() => {
              const newPos = start + mediaMarkdown.length + 2;
              textarea.setSelectionRange(newPos, newPos);
              textarea.focus();
            }, 100);
          } else {
            // 降级方案：添加到末尾
            setContentForLang(content + '\n' + mediaMarkdown + '\n');
          }
        } catch (err) {
          // Error already handled in uploadMedia
        }
      }
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitleForLang(newTitle);
    if (!isEditMode || !slug) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSave = async (publishNow: boolean) => {
    if (!title.trim() || !content.trim()) {
      setError('标题和内容不能为空');
      return;
    }

    if (!slug.trim()) {
      setError('URL标识符不能为空');
      return;
    }

    setSaving(true);
    setError('');

    // 保存旧内容以便清理未使用的媒体文件
    const oldContent = isEditMode && id ? translationsDraft[lang]?.content || '' : '';

    try {
      // Split by both English and Chinese commas
      const tagsArray = tags.split(/[，,]/).map(t => t.trim()).filter(t => t);

      // Master record must satisfy NOT NULL title/content_md in current schema.
      // We keep master title/content as default language (zh) if present; otherwise use current language.
      const defaultLang: BlogLang = 'zh';
      const defaultDraft = translationsDraft[defaultLang];
      const masterTitle = (defaultDraft?.title || title).trim();
      const masterExcerpt = (defaultDraft?.excerpt || excerpt).trim() || null;
      const masterContent = (defaultDraft?.content || content).trim();

      const masterData = {
        title: masterTitle,
        slug: slug.trim(),
        content_md: masterContent,
        excerpt: masterExcerpt,
        cover_image: coverImage.trim() || null,
        category,
        tags: tagsArray,
        published: publishNow,
        published_at: publishNow ? new Date().toISOString() : null,
        author_id: user!.id,
        default_lang: defaultLang,
      };

      let postId = id;

      if (isEditMode && postId) {
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update(masterData)
          .eq('id', postId);
        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('blog_posts')
          .insert([masterData])
          .select('id')
          .single();
        if (insertError) throw insertError;
        postId = inserted.id;
      }

      // Upsert translation for current language
      const translationData = {
        post_id: postId,
        lang,
        slug: slug.trim(),
        title: title.trim(),
        excerpt: excerpt.trim() || null,
        content_md: content.trim(),
      };

      const { error: tErr } = await supabase
        .from('blog_post_translations')
        .upsert(translationData, { onConflict: 'post_id,lang' });

      if (tErr) throw tErr;

      // 清理未使用的媒体文件（在后台执行，不阻塞保存流程）
      if (isEditMode && oldContent) {
        cleanupUnusedMedia(oldContent, content, postId).catch(err => {
          console.error('Failed to cleanup unused media:', err);
        });
      }

      alert(isEditMode ? '文章已更新！' : '文章已保存！');
      navigate('/admin/blog');
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (!adminChecked || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eva-secondary mb-4"></div>
          <p className="text-gray-400">Checking permissions...</p>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eva-secondary"></div>
      </div>
    );
  }

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate('/admin/blog')}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回文章列表
      </button>

      <h1 className="text-4xl font-bold mb-2">
        {isEditMode ? '编辑文章' : '写新文章'}
      </h1>
      <p className="text-gray-400 mb-8">使用 Markdown 格式撰写你的博客文章</p>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* 标题 */}
        <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2 gap-4">
            <label className="block text-sm font-medium text-gray-300">
              标题 <span className="text-red-400">*</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">语言</span>
              <select
                value={lang}
                onChange={(e) => handleLangChange(e.target.value as BlogLang)}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-eva-secondary"
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="输入文章标题..."
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-xl font-bold focus:outline-none focus:border-eva-secondary"
          />
          <p className="mt-2 text-xs text-gray-500">
            当前正在编辑：<span className="text-eva-secondary font-medium">{lang.toUpperCase()}</span> 版本标题/正文/摘要（slug、分类、封面、标签是全局共享的）
          </p>
        </div>

        {/* URL标识符 */}
        <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
          <label className="block text-sm font-medium mb-2 text-gray-300">
            URL 标识符 (Slug) <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="url-friendly-slug"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary font-mono text-sm"
          />
          <p className="mt-2 text-xs text-gray-500">
            文章URL: /{lang}/blog/{slug || 'your-slug'}（建议按语言访问；未翻译时会回退到中文）
          </p>
        </div>

        {/* 分类和标签 */}
        <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
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

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                标签 <span className="text-gray-500">(逗号分隔)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="INTJ, 人格分析, 动漫"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
              />
            </div>
          </div>
        </div>

        {/* 封面图片 */}
        <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
          <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> 封面图片 URL
          </label>
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://example.com/cover.jpg"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
          />
          {coverImage && (
            <div className="mt-4 flex justify-center">
              <img
                src={coverImage}
                alt="Cover Preview"
                className="max-h-48 w-auto object-contain rounded-lg border border-white/10"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* 摘要 */}
        <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
          <label className="block text-sm font-medium mb-2 text-gray-300">
            文章摘要 <span className="text-gray-500">(用于列表展示和SEO)</span>
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerptForLang(e.target.value)}
            rows={3}
            placeholder="简要描述文章内容..."
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary resize-none"
          />
        </div>

        {/* Markdown 富文本编辑器 */}
        <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
          <label className="block text-sm font-medium mb-4 text-gray-300">
            文章内容 <span className="text-red-400">*</span>
            <span className="text-gray-500 text-xs ml-2">（支持 Markdown 格式，左侧编辑，右侧实时预览）</span>
          </label>
          
          {uploading && (
            <div className="mb-4 bg-eva-secondary/20 border border-eva-secondary/50 text-eva-secondary px-4 py-3 rounded flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-eva-secondary border-t-transparent rounded-full animate-spin"></div>
              <span>正在上传文件...</span>
            </div>
          )}

          <div 
            data-color-mode="dark"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onPaste={handlePaste}
          >
            <MDEditor
              value={content}
              onChange={(val) => setContentForLang(val || '')}
              height={600}
              preview="live"
              hideToolbar={false}
              enableScroll={true}
              visibleDragbar={false}
              visiableDragbar={false}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
              }}
              previewOptions={{
                style: {
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  color: '#fff',
                  padding: '16px',
                },
                remarkPlugins: [remarkGfm],
                components: {
                  // 自定义组件渲染
                  video: ({ node, ...props }: any) => (
                    <video controls style={{ maxWidth: '100%' }} {...props} />
                  ),
                  ol: ({ node, ...props }: any) => (
                    <ol style={{ paddingLeft: '2rem', marginBottom: '1rem', listStyleType: 'decimal' }} {...props} />
                  ),
                  ul: ({ node, ...props }: any) => (
                    <ul style={{ paddingLeft: '2rem', marginBottom: '1rem', listStyleType: 'disc' }} {...props} />
                  ),
                  li: ({ node, ...props }: any) => (
                    <li style={{ marginBottom: '0.5rem' }} {...props} />
                  ),
                }
              }}
              textareaProps={{
                placeholder: '在这里撰写文章内容...\n\n✨ 支持 Markdown 语法\n📸 拖拽图片/视频文件到此处上传\n📋 粘贴截图自动上传\n🎬 支持插入视频（MP4, WebM）'
              }}
              extraCommands={[
                {
                  name: 'upload-image',
                  keyCommand: 'upload-image',
                  buttonProps: { 'aria-label': '上传图片', title: '上传图片' },
                  icon: (
                    <svg width="12" height="12" viewBox="0 0 20 20">
                      <path fill="currentColor" d="M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 13l-6-5-2 2-4-5-4 8V4h16v11z"/>
                    </svg>
                  ),
                  execute: (state, api) => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const url = await uploadMedia(file);
                          const imageMarkdown = `![${file.name}](${url})`;
                          // 在光标位置插入
                          const newText = state.text.substring(0, state.selection.start) + 
                                          '\n' + imageMarkdown + '\n' + 
                                          state.text.substring(state.selection.end);
                          api.replaceSelection(imageMarkdown);
                          setContentForLang(newText);
                        } catch (err) {
                          // Error already handled
                        }
                      }
                    };
                    input.click();
                  },
                },
                {
                  name: 'upload-video',
                  keyCommand: 'upload-video',
                  buttonProps: { 'aria-label': '上传视频', title: '上传视频' },
                  icon: (
                    <svg width="12" height="12" viewBox="0 0 20 20">
                      <path fill="currentColor" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                    </svg>
                  ),
                  execute: (state, api) => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'video/*';
                    input.onchange = async (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const url = await uploadMedia(file);
                          const videoMarkdown = `<video controls src="${url}" style="max-width: 100%;"></video>`;
                          // 在光标位置插入
                          const newText = state.text.substring(0, state.selection.start) + 
                                          '\n' + videoMarkdown + '\n' + 
                                          state.text.substring(state.selection.end);
                          api.replaceSelection(videoMarkdown);
                          setContentForLang(newText);
                        } catch (err) {
                          // Error already handled
                        }
                      }
                    };
                    input.click();
                  },
                },
              ]}
            />
          </div>
          <p className="mt-3 text-xs text-gray-500">
            💡 提示：
            <span className="ml-2">• 点击工具栏的图片/视频图标上传文件</span>
            <span className="ml-2">• 直接拖拽图片/视频到编辑器</span>
            <span className="ml-2">• 粘贴截图自动上传</span>
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1 bg-white/10 border border-white/10 text-white font-bold py-3 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {published ? '取消发布（转草稿）' : '保存为草稿'}
              </>
            )}
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex-1 bg-eva-secondary text-eva-bg font-bold py-3 rounded-lg hover:bg-eva-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-eva-bg border-t-transparent rounded-full animate-spin"></div>
                发布中...
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                {published ? '更新（保持发布）' : '发布文章'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
