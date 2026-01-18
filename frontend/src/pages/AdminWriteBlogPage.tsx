import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, Eye, ArrowLeft, AlertCircle, Image as ImageIcon, FolderOpen, X, Link2, FileText } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { useTranslation } from 'react-i18next';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

type BlogLang = 'zh' | 'en' | 'ja';

export const AdminWriteBlogPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { user, loading: authLoading, isAdmin, adminChecked } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // 用于“新文章”编辑期间的媒体目录作用域，避免同一张图反复上传产生重复文件
  const draftMediaScopeRef = useRef<string>(
    `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  // 仅追踪“本次打开页面期间上传过的文件路径”，用于在编辑过程中做安全的自动清理
  const sessionUploadedPathsRef = useRef<Set<string>>(new Set());
  const deletingPathsRef = useRef<Set<string>>(new Set());

  // 避免 useEffect 依赖 translationsDraft 导致频繁触发/闭包拿到旧值
  const translationsDraftRef = useRef<
    Record<BlogLang, { title: string; excerpt: string; content: string }>
  >({
    zh: { title: '', excerpt: '', content: '' },
    en: { title: '', excerpt: '', content: '' },
    ja: { title: '', excerpt: '', content: '' },
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // 图片库弹窗状态
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [libraryImages, setLibraryImages] = useState<Array<{ name: string; url: string; path: string; created_at: string }>>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  
  // 文章链接选择器状态
  const [showArticleSelector, setShowArticleSelector] = useState(false);
  const [articleList, setArticleList] = useState<Array<{ id: string; title: string; slug: string; cover_image?: string; excerpt: string }>>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articleLinkType, setArticleLinkType] = useState<'text' | 'card'>('text');

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
  const [articleType, setArticleType] = useState<'original' | 'external'>('original');
  const [externalUrl, setExternalUrl] = useState('');

  const loadedPostRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!adminChecked) return;
    if (!isAdmin) return;

    if (isEditMode && id && loadedPostRef.current !== id) {
      loadedPostRef.current = id;
      fetchBlogPost();
    }
  }, [id, user?.id, authLoading, adminChecked, isAdmin]);

  useEffect(() => {
    translationsDraftRef.current = translationsDraft;
  }, [translationsDraft]);

  // admin 权限由 AuthContext 统一检查并缓存（避免每个页面重复请求 users.role）

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
      setArticleType(data.article_type || 'original');
      setExternalUrl(data.external_url || '');

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

  // 当语言切换时，如果文章选择器是打开的，重新加载对应语言的文章列表
  useEffect(() => {
    if (showArticleSelector) {
      loadArticleList();
    }
  }, [lang, showArticleSelector]);

  // 提取内容中的所有图片/视频 URL
  const extractMediaUrls = (text: string): string[] => {
    const urls: string[] = [];
    // 注意：video/img 的 src 可能包在引号里，所以这里要排除 " ' >
    const blogMediaPattern =
      /https:\/\/[^\/]+\.supabase\.co\/storage\/v1\/object\/public\/blog-media\/[^\s\)\"\'\>]+/g;
    const matches = text.match(blogMediaPattern);
    if (matches) {
      urls.push(...matches.map((u) => u.replace(/[)"'\]>]+$/g, '')));
    }
    return urls;
  };

  // 从 URL 中提取文件路径
  const getFilePathFromUrl = (url: string): string | null => {
    const trimmed = url.trim().replace(/[)"'\]>]+$/g, '');
    try {
      const u = new URL(trimmed);
      const marker = '/storage/v1/object/public/blog-media/';
      const idx = u.pathname.indexOf(marker);
      if (idx === -1) return null;
      const path = u.pathname.slice(idx + marker.length);
      return decodeURIComponent(path);
    } catch {
      const match = trimmed.match(/\/blog-media\/(.+)$/);
      return match ? match[1] : null;
    }
  };

  // 清理未使用的媒体文件
  const cleanupUnusedMedia = async (oldContent: string, newContent: string, postId?: string) => {
    try {
      const oldPaths = extractMediaUrls(oldContent)
        .map(getFilePathFromUrl)
        .filter((p): p is string => !!p);
      const newPaths = extractMediaUrls(newContent)
        .map(getFilePathFromUrl)
        .filter((p): p is string => !!p);

      // 找出被删除的 URL
      const deletedPaths = oldPaths.filter((p) => !newPaths.includes(p));

      if (deletedPaths.length === 0) return;

      // 如果是编辑模式，检查这些 URL 是否在其他语言版本中使用
      if (postId) {
        const { data: translations } = await supabase
          .from('blog_post_translations')
          .select('content_md, lang')
          .eq('post_id', postId);

        if (translations) {
          // 收集所有其他语言版本的文件路径
          const otherLangPaths = new Set<string>();
          translations.forEach(trans => {
            if (trans.lang !== lang) {
              const paths = extractMediaUrls(trans.content_md || '')
                .map(getFilePathFromUrl)
                .filter((p): p is string => !!p);
              paths.forEach((p) => otherLangPaths.add(p));
            }
          });

          // 只删除在所有语言版本中都不再使用的文件
          for (const path of deletedPaths) {
            if (!otherLangPaths.has(path)) {
              await supabase.storage.from('blog-media').remove([path]);
            } else {
              console.log('File still used in other language versions:', path);
            }
          }
        }
      } else {
        // 新文章，直接删除
        for (const path of deletedPaths) {
          await supabase.storage.from('blog-media').remove([path]);
        }
      }
    } catch (err) {
      console.error('Error cleaning up unused media:', err);
    }
  };

  const getFileExtension = (file: File): string => {
    const nameExt = (file.name || '').split('.').pop();
    if (nameExt && nameExt !== file.name) return nameExt.toLowerCase();
    const type = (file.type || '').toLowerCase();
    if (type === 'image/png') return 'png';
    if (type === 'image/jpeg') return 'jpg';
    if (type === 'image/webp') return 'webp';
    if (type === 'image/gif') return 'gif';
    if (type === 'video/mp4') return 'mp4';
    if (type === 'video/webm') return 'webm';
    return 'bin';
  };

  const sha256Hex = async (file: File): Promise<string | null> => {
    try {
      // 需要 secure context（生产 https / 本地 localhost 都 OK）
      if (!crypto?.subtle) return null;
      const buf = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      return null;
    }
  };

  // 上传图片/视频到 Supabase Storage
  const uploadMedia = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      const fileExt = getFileExtension(file);
      const scope = isEditMode && id ? `posts/${id}` : `drafts/${draftMediaScopeRef.current}`;
      const hash = await sha256Hex(file);
      const fileName = hash
        ? `${hash}.${fileExt}`
        : `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${scope}/${fileName}`;

      // 上传到 Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('blog-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      // 如果同名（同哈希）已存在，就直接复用现有文件，避免 Bucket 出现两张一样的图（不同名字）
      if (uploadError) {
        const msg = (uploadError as any)?.message || '';
        const status = (uploadError as any)?.statusCode || (uploadError as any)?.status;
        const isAlreadyExists = status === 409 || /already exists/i.test(msg);
        if (!isAlreadyExists) throw uploadError;
      }

      // 获取公开 URL
      const pathForUrl = data?.path || filePath;
      const { data: { publicUrl } } = supabase.storage
        .from('blog-media')
        .getPublicUrl(pathForUrl);

      sessionUploadedPathsRef.current.add(pathForUrl);

      return publicUrl;
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(`上传失败：${err.message}`);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const cleanupSessionUploadedButUnreferenced = async () => {
    const allTexts: string[] = [
      translationsDraftRef.current.zh.content || '',
      translationsDraftRef.current.en.content || '',
      translationsDraftRef.current.ja.content || '',
    ];

    const referencedPaths = new Set<string>();
    for (const text of allTexts) {
      const paths = extractMediaUrls(text)
        .map(getFilePathFromUrl)
        .filter((p): p is string => !!p);
      paths.forEach((p) => referencedPaths.add(p));
    }

    const candidates: string[] = [];
    sessionUploadedPathsRef.current.forEach((p) => {
      if (!referencedPaths.has(p)) candidates.push(p);
    });

    if (candidates.length === 0) return;

    // 编辑模式下，避免误删“仍被其他语言（DB）引用”的媒体
    let usedInDbPaths: Set<string> | null = null;
    if (isEditMode && id) {
      const { data: translations } = await supabase
        .from('blog_post_translations')
        .select('content_md')
        .eq('post_id', id);

      usedInDbPaths = new Set<string>();
      (translations || []).forEach((t) => {
        const paths = extractMediaUrls(t.content_md || '')
          .map(getFilePathFromUrl)
          .filter((p): p is string => !!p);
        paths.forEach((p) => usedInDbPaths!.add(p));
      });
    }

    for (const path of candidates) {
      if (deletingPathsRef.current.has(path)) continue;
      if (usedInDbPaths && usedInDbPaths.has(path)) continue;

      deletingPathsRef.current.add(path);
      try {
        await supabase.storage.from('blog-media').remove([path]);
        sessionUploadedPathsRef.current.delete(path);
      } catch (err) {
        console.error('Failed to cleanup unused session file:', path, err);
      } finally {
        deletingPathsRef.current.delete(path);
      }
    }
  };

  // 编辑过程中（含新文章）自动清理：只清理"本次会话上传且已不再被正文引用"的文件，避免 Bucket 残留
  useEffect(() => {
    const t = setTimeout(() => {
      cleanupSessionUploadedButUnreferenced().catch((err) => {
        console.error('Session media cleanup error:', err);
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [content, lang]);

  // 加载图片库
  const loadMediaLibrary = async () => {
    setLoadingLibrary(true);
    try {
      const images: Array<{ name: string; url: string; path: string; created_at: string }> = [];
      
      // 递归获取所有子目录的文件
      const getAllFiles = async (prefix: string = '') => {
        const { data: items } = await supabase.storage
          .from('blog-media')
          .list(prefix, {
            limit: 1000,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (!items) return;

        for (const item of items) {
          const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
          
          // 如果是目录，递归获取
          if (item.id === null) {
            await getAllFiles(fullPath);
          } else {
            // 只处理图片文件
            if (item.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
              const { data: { publicUrl } } = supabase.storage
                .from('blog-media')
                .getPublicUrl(fullPath);
              
              images.push({
                name: item.name,
                url: publicUrl,
                path: fullPath,
                created_at: item.created_at || ''
              });
            }
          }
        }
      };

      await getAllFiles();
      setLibraryImages(images);
    } catch (err: any) {
      console.error('Failed to load media library:', err);
      alert(`加载图片库失败：${err.message}`);
    } finally {
      setLoadingLibrary(false);
    }
  };

  // 从图片库选择图片
  const selectImageFromLibrary = (imageUrl: string, imageName: string) => {
    const imageMarkdown = `![${imageName}](${imageUrl})`;
    
    // 尝试在光标位置插入
    const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
    if (textarea && textarea.selectionStart !== undefined) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '\n' + imageMarkdown + '\n' + content.substring(end);
      
      // 保存当前滚动位置
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      setContentForLang(newContent);
      
      // 关闭弹窗
      setShowMediaLibrary(false);
      
      // 恢复滚动位置，防止页面跳动
      setTimeout(() => {
        window.scrollTo(scrollX, scrollY);
      }, 0);
    } else {
      // 降级方案：添加到末尾
      setContentForLang(content + '\n' + imageMarkdown);
      setShowMediaLibrary(false);
    }
  };

  // 加载站内文章列表
  const loadArticleList = async () => {
    setLoadingArticles(true);
    try {
      // 获取所有已发布的文章（使用当前编辑语言）
      const { data, error } = await supabase
        .from('blog_post_translations')
        .select('post_id, title, slug, excerpt')
        .eq('lang', lang)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // 获取封面图（从主表）
      const postIds = (data || []).map(d => d.post_id);
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('id, cover_image')
        .in('id', postIds)
        .eq('published', true);

      const postsMap = new Map(posts?.map(p => [p.id, p.cover_image]) || []);

      const articles = (data || []).map(d => ({
        id: d.post_id,
        title: d.title,
        slug: d.slug,
        excerpt: d.excerpt,
        cover_image: postsMap.get(d.post_id)
      }))
      // 排除当前正在编辑的文章
      .filter(a => !id || a.id !== id);

      setArticleList(articles);
    } catch (err: any) {
      console.error('Failed to load article list:', err);
      alert(`加载文章列表失败：${err.message}`);
    } finally {
      setLoadingArticles(false);
    }
  };

  // 插入站内文章链接
  const insertArticleLink = (article: { title: string; slug: string; cover_image?: string; excerpt: string }) => {
    const currentLangCode = lang === 'zh' ? 'zh' : lang === 'ja' ? 'ja' : 'en';
    const articleUrl = `/${currentLangCode}/blog/${article.slug}`;
    
    let linkMarkdown = '';
    
    if (articleLinkType === 'card') {
      // 扁平化精美卡片形式：采用横向布局，只保留标题和提示，极大压缩空间
      // 注意：不要让任意一行以 4 个空格开头，否则 Markdown 会识别为“缩进代码块”，预览区就只会显示源码
      // 重要：不要使用 h1-h6（例如 h4），否则 md-editor/rehype 可能会为标题自动插入锚点 <a>，
      // 如果我们外层又是 <a>，就会触发 “<a> cannot be a descendant of <a>” 的嵌套错误。
      linkMarkdown = `
<div style="border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; margin: 20px 0; background: rgba(255,255,255,0.03); overflow: hidden; display: flex; align-items: stretch; min-height: 80px;">
<a href="${articleUrl}" style="text-decoration: none; color: inherit; display: flex; width: 100%;">
${article.cover_image ? `<div style="width: 120px; height: 80px; flex-shrink: 0; border-right: 1px solid rgba(255,255,255,0.05);"><img src="${article.cover_image}" alt="${article.title}" style="width: 100%; height: 100%; object-fit: cover;" /></div>` : ''}
<div style="padding: 12px 16px; flex-grow: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0;">
<div style="color: #fff; font-size: 1rem; font-weight: 600; margin: 0 0 4px 0; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${article.title}</div>
<div style="color: #8b5cf6; font-size: 0.85rem; font-weight: 500;">→ 阅读全文</div>
</div>
</a>
</div>
`;
    } else {
      // 普通链接形式
      linkMarkdown = `[${article.title}](${articleUrl})`;
    }
    
    // 在光标位置插入
    const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
    if (textarea && textarea.selectionStart !== undefined) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      // 核心修复：确保 HTML 块前后都有两个换行符，且前后不带任何空格，强制打破代码块识别
      const newContent = content.substring(0, start).trimEnd() + '\n\n' + linkMarkdown.trim() + '\n\n' + content.substring(end).trimStart();
      
      // 保存当前滚动位置
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      setContentForLang(newContent);
      
      // 关闭弹窗
      setShowArticleSelector(false);
      
      // 恢复滚动位置
      setTimeout(() => {
        window.scrollTo(scrollX, scrollY);
      }, 0);
    } else {
      // 降级方案：添加到末尾
      setContentForLang(content + '\n' + linkMarkdown);
      setShowArticleSelector(false);
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
    // Validation for external articles
    if (articleType === 'external') {
      if (!title.trim()) {
        setError('标题不能为空');
        return;
      }
      if (!externalUrl.trim()) {
        setError('外部链接不能为空');
        return;
      }
      if (!slug.trim()) {
        setError('URL标识符不能为空');
        return;
      }
    } else {
      // Validation for original articles
      if (!title.trim() || !content.trim()) {
        setError('标题和内容不能为空');
        return;
      }
      if (!slug.trim()) {
        setError('URL标识符不能为空');
        return;
      }
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
        article_type: articleType,
        external_url: articleType === 'external' ? externalUrl.trim() : null,
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
        {isEditMode ? (articleType === 'external' ? '编辑引用文章' : '编辑文章') : '写新文章'}
      </h1>
      <p className="text-gray-400 mb-8">
        {articleType === 'external' 
          ? '编辑引用文章的元数据（标题、分类、标签、外链等）' 
          : '使用 Markdown 格式撰写你的博客文章'}
      </p>

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

        {/* 文章类型标识（仅编辑模式显示） */}
        {isEditMode && (
          <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
            <label className="block text-sm font-medium mb-2 text-gray-300">
              文章类型
            </label>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                articleType === 'original' 
                  ? 'bg-eva-secondary/20 text-eva-secondary border border-eva-secondary/30' 
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {articleType === 'original' ? '原创文章' : '引用外链'}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {articleType === 'original' 
                ? '完整的原创文章，需要编写内容' 
                : '引用的外部文章，只需编辑元数据和外链地址'}
            </p>
          </div>
        )}

        {/* 外链URL（仅引用文章显示） */}
        {articleType === 'external' && (
          <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
            <label className="block text-sm font-medium mb-2 text-gray-300">
              外链地址 <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
            />
            <p className="mt-2 text-xs text-gray-500">
              原文链接（知乎、B站、Medium等平台的文章URL）
            </p>
          </div>
        )}

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

        {/* Markdown 富文本编辑器（仅原创文章） */}
        {articleType === 'original' && (
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
                rehypePlugins: [rehypeRaw],
                // 确保预览区域允许所有 HTML 标签和样式属性
                rehypeRewrite: (node: any) => {
                  if (node.type === 'element' && node.tagName === 'div') {
                    // 允许所有内联样式
                  }
                },
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
                  buttonProps: { 'aria-label': '上传图片', title: '上传新图片' },
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
                  name: 'select-from-library',
                  keyCommand: 'select-from-library',
                  buttonProps: { 'aria-label': '从图片库选择', title: '从已上传的图片中选择' },
                  icon: (
                    <svg width="12" height="12" viewBox="0 0 20 20">
                      <path fill="currentColor" d="M0 4c0-1.1.9-2 2-2h7l2 2h7c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V4zm2 2v10h16V6H2z"/>
                    </svg>
                  ),
                  execute: () => {
                    setShowMediaLibrary(true);
                    loadMediaLibrary();
                  },
                },
                {
                  name: 'insert-article-link',
                  keyCommand: 'insert-article-link',
                  buttonProps: { 'aria-label': '插入站内文章链接', title: '插入站内文章链接' },
                  icon: (
                    <svg width="12" height="12" viewBox="0 0 20 20">
                      <path fill="currentColor" d="M9.26 13a2 2 0 0 1 .01-2.01A3 3 0 0 0 9 5H5a3 3 0 0 0 0 6h.08a6.06 6.06 0 0 0 0 2H5A5 5 0 0 1 5 3h4a5 5 0 0 1 .26 10zm1.48-6a2 2 0 0 1-.01 2.01A3 3 0 0 0 11 15h4a3 3 0 0 0 0-6h-.08a6.06 6.06 0 0 0 0-2H15a5 5 0 0 1 0 10h-4a5 5 0 0 1-.26-10z"/>
                    </svg>
                  ),
                  execute: () => {
                    setShowArticleSelector(true);
                    loadArticleList();
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
        )}

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

      {/* 图片库弹窗 */}
      {articleType === 'original' && showMediaLibrary && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-eva-surface border border-white/20 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-6 h-6 text-eva-secondary" />
                <h2 className="text-2xl font-bold text-white">图片库</h2>
                <span className="text-sm text-gray-400">
                  {libraryImages.length} 张图片
                </span>
              </div>
              <button
                onClick={() => setShowMediaLibrary(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* 图片网格 */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingLibrary ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-eva-secondary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400">加载图片库中...</p>
                  </div>
                </div>
              ) : libraryImages.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">图片库为空</p>
                    <p className="text-gray-500 text-sm mt-2">上传新图片后会显示在这里</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {libraryImages.map((img) => (
                    <div
                      key={img.path}
                      className="group relative bg-black/30 border border-white/10 rounded-lg overflow-hidden cursor-pointer hover:border-eva-secondary transition-all hover:scale-105"
                      onClick={() => selectImageFromLibrary(img.url, img.name)}
                    >
                      <div className="aspect-square relative">
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* 悬停遮罩 */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-center px-4">
                            <p className="text-white font-medium text-sm mb-2">点击插入</p>
                            <p className="text-gray-300 text-xs truncate">{img.name}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 底部提示 */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              <p className="text-sm text-gray-400 text-center">
                💡 点击任意图片即可插入到文章中 · 多语言文章可复用同一张图片
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 文章选择器弹窗 */}
      {articleType === 'original' && showArticleSelector && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-eva-surface border border-white/20 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Link2 className="w-6 h-6 text-eva-secondary" />
                <h2 className="text-2xl font-bold text-white">插入站内文章链接</h2>
                <span className="text-sm text-gray-400">
                  {articleList.length} 篇文章
                </span>
              </div>
              <button
                onClick={() => setShowArticleSelector(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* 链接类型选择 */}
            <div className="px-6 pt-4 flex items-center gap-4">
              <span className="text-sm text-gray-400">链接样式：</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setArticleLinkType('text')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    articleLinkType === 'text'
                      ? 'bg-eva-secondary text-eva-bg'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    普通链接
                  </div>
                </button>
                <button
                  onClick={() => setArticleLinkType('card')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    articleLinkType === 'card'
                      ? 'bg-eva-secondary text-eva-bg'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    卡片形式
                  </div>
                </button>
              </div>
            </div>

            {/* 文章列表 */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingArticles ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-eva-secondary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400">加载文章列表中...</p>
                  </div>
                </div>
              ) : articleList.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">暂无已发布的文章</p>
                    <p className="text-gray-500 text-sm mt-2">发布文章后会显示在这里</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {articleList.map((article) => (
                    <div
                      key={article.id}
                      className="group bg-black/30 border border-white/10 rounded-lg overflow-hidden cursor-pointer hover:border-eva-secondary transition-all hover:scale-[1.02]"
                      onClick={() => insertArticleLink(article)}
                    >
                      <div className="flex gap-4 p-4">
                        {article.cover_image && (
                          <div className="flex-shrink-0 w-32 h-24 rounded overflow-hidden">
                            <img
                              src={article.cover_image}
                              alt={article.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-gray-400 text-sm line-clamp-2">
                            {article.excerpt || '暂无摘要'}
                          </p>
                          <div className="mt-2 text-eva-secondary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            → 点击插入
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 底部提示 */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              <p className="text-sm text-gray-400 text-center">
                💡 选择文章形式后，点击任意文章即可插入链接 · 卡片形式会显示封面和摘要
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
