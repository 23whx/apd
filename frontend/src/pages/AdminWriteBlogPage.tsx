import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft, Check, Cloud, FileText, FolderOpen, Image as ImageIcon, Link2, Loader2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { RichEditor, type RichEditorHandle } from '../components/blog-editor/RichEditor';
import { SourceEditor, type SourceEditorHandle } from '../components/blog-editor/SourceEditor';
import { PublishPanel, SLUG_PATTERN } from '../components/blog-editor/PublishPanel';
import { countWords, markdownToPlainText, readingMinutes } from '../components/blog-editor/markdown';

type BlogLang = 'zh' | 'en' | 'ja';
type EditorMode = 'rich' | 'source';
type Draft = { title: string; excerpt: string; content: string };
type Drafts = Record<BlogLang, Draft>;
interface Meta {
  slug: string;
  coverImage: string;
  category: string;
  tags: string[];
  published: boolean;
  publishedAt: string | null;
  articleType: 'original' | 'external';
  externalUrl: string;
}
interface LocalDraft {
  v: 1;
  savedAt: number;
  lang: BlogLang;
  drafts: Drafts;
  meta: Meta;
}

const LANGS: { code: BlogLang; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];
const EMPTY_DRAFT: Draft = { title: '', excerpt: '', content: '' };
const EMPTY_DRAFTS: Drafts = { zh: { ...EMPTY_DRAFT }, en: { ...EMPTY_DRAFT }, ja: { ...EMPTY_DRAFT } };
const EMPTY_META: Meta = {
  slug: '',
  coverImage: '',
  category: 'tech',
  tags: [],
  published: false,
  publishedAt: null,
  articleType: 'original',
  externalUrl: '',
};
const MODE_KEY = 'apd-blog-editor-mode';
const draftKey = (postId?: string) => `apd-blog-draft:${postId ?? 'new'}`;
const hasContent = (d: Draft) => !!(d.title.trim() || d.content.trim());

const readLocal = (key: string): LocalDraft | null => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed?.v === 1 ? parsed : null;
  } catch {
    return null;
  }
};
const writeLocal = (key: string, value: LocalDraft | null) => {
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value));
    else localStorage.removeItem(key);
  } catch {
    // storage full or blocked: autosave is best-effort
  }
};

const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const timeLabel = (d: Date | number) =>
  new Date(d).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// --- Supabase Storage helpers --------------------------------------------------------------------

const MEDIA_URL_PATTERN = /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/blog-media\/[^\s)"'>]+/g;

const mediaPathFromUrl = (url: string): string | null => {
  const trimmed = url.trim().replace(/[)"'\]>]+$/g, '');
  try {
    const u = new URL(trimmed);
    const marker = '/storage/v1/object/public/blog-media/';
    const idx = u.pathname.indexOf(marker);
    return idx === -1 ? null : decodeURIComponent(u.pathname.slice(idx + marker.length));
  } catch {
    return trimmed.match(/\/blog-media\/(.+)$/)?.[1] ?? null;
  }
};

const mediaPathsIn = (text: string): string[] =>
  (text.match(MEDIA_URL_PATTERN) || []).map(mediaPathFromUrl).filter((p): p is string => !!p);

const fileExtension = (file: File): string => {
  const nameExt = (file.name || '').split('.').pop();
  if (nameExt && nameExt !== file.name) return nameExt.toLowerCase();
  const byType: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  };
  return byType[(file.type || '').toLowerCase()] ?? 'bin';
};

const sha256Hex = async (file: File): Promise<string | null> => {
  try {
    if (!crypto?.subtle) return null;
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
};

// -------------------------------------------------------------------------------------------------

export const AdminWriteBlogPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { user, loading: authLoading, isAdmin, adminChecked } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const initialLang: BlogLang = (() => {
    const raw = (i18n.language || 'en').toLowerCase();
    return raw.startsWith('zh') ? 'zh' : raw.startsWith('ja') ? 'ja' : 'en';
  })();

  // Content
  const [lang, setLang] = useState<BlogLang>(initialLang);
  const [drafts, setDrafts] = useState<Drafts>(EMPTY_DRAFTS);
  const [meta, setMeta] = useState<Meta>(EMPTY_META);
  // Last state known to be on the server (for dirty checks and media cleanup)
  const [serverDrafts, setServerDrafts] = useState<Drafts>(EMPTY_DRAFTS);
  const [serverMeta, setServerMeta] = useState<Meta>(EMPTY_META);

  // Editor
  const [mode, setMode] = useState<EditorMode>(() => {
    try {
      return localStorage.getItem(MODE_KEY) === 'source' ? 'source' : 'rich';
    } catch {
      return 'rich';
    }
  });
  const [docVersion, setDocVersion] = useState(0);
  const [plainText, setPlainText] = useState('');
  const [uploadingCount, setUploadingCount] = useState(0);
  const richRef = useRef<RichEditorHandle>(null);
  const sourceRef = useRef<SourceEditorHandle>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const slugTouchedRef = useRef(false);

  // Status
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [localSavedAt, setLocalSavedAt] = useState<number | null>(null);
  const [restoreOffer, setRestoreOffer] = useState<LocalDraft | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  // Media library / article picker
  const [libraryTarget, setLibraryTarget] = useState<null | 'content' | 'cover'>(null);
  const [libraryImages, setLibraryImages] = useState<Array<{ name: string; url: string; path: string }>>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [showArticleSelector, setShowArticleSelector] = useState(false);
  const [articleList, setArticleList] = useState<Array<{ id: string; title: string; slug: string; cover_image?: string; excerpt: string }>>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articleLinkType, setArticleLinkType] = useState<'text' | 'card'>('text');

  // Files uploaded while this page is open, so unreferenced ones can be cleaned up safely
  const [draftMediaScope] = useState(() => `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const sessionUploadedPathsRef = useRef<Set<string>>(new Set());
  const loadedPostRef = useRef<string | null>(null);
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;
  const metaRef = useRef(meta);
  metaRef.current = meta;

  const draft = drafts[lang];
  const dirty = useMemo(
    () => JSON.stringify(drafts) !== JSON.stringify(serverDrafts) || JSON.stringify(meta) !== JSON.stringify(serverMeta),
    [drafts, serverDrafts, meta, serverMeta]
  );

  const updateDraft = useCallback(
    (patch: Partial<Draft>, forLang: BlogLang = lang) =>
      setDrafts((prev) => ({ ...prev, [forLang]: { ...prev[forLang], ...patch } })),
    [lang]
  );
  const updateMeta = useCallback((patch: Partial<Meta>) => setMeta((prev) => ({ ...prev, ...patch })), []);

  // ---------------------------------------------------------------------------------------------
  // Loading

  useEffect(() => {
    if (authLoading || !user || !adminChecked || !isAdmin) return;

    if (!isEditMode) {
      const local = readLocal(draftKey());
      if (local && Object.values(local.drafts).some(hasContent)) setRestoreOffer(local);
      return;
    }
    if (!id || loadedPostRef.current === id) return;
    loadedPostRef.current = id;

    (async () => {
      setLoading(true);
      try {
        const [{ data: post, error: postError }, { data: translations, error: tError }] = await Promise.all([
          supabase.from('blog_posts').select('*').eq('id', id).single(),
          supabase.from('blog_post_translations').select('lang, title, excerpt, content_md').eq('post_id', id),
        ]);
        if (postError) throw postError;
        if (tError) throw tError;

        const loaded: Drafts = { zh: { ...EMPTY_DRAFT }, en: { ...EMPTY_DRAFT }, ja: { ...EMPTY_DRAFT } };
        for (const t of translations || []) {
          if (t.lang in loaded) {
            loaded[t.lang as BlogLang] = { title: t.title || '', excerpt: t.excerpt || '', content: t.content_md || '' };
          }
        }
        const loadedMeta: Meta = {
          slug: post.slug || '',
          coverImage: post.cover_image || '',
          category: post.category || 'tech',
          tags: post.tags || [],
          published: !!post.published,
          publishedAt: post.published_at || null,
          articleType: post.article_type || 'original',
          externalUrl: post.external_url || '',
        };
        slugTouchedRef.current = true;
        setDrafts(loaded);
        setServerDrafts(loaded);
        setMeta(loadedMeta);
        setServerMeta(loadedMeta);
        const updatedAt = Date.parse(post.updated_at || post.created_at || '') || 0;
        // Open the language the admin is using if it exists, otherwise the first one that does
        setLang((current) => (hasContent(loaded[current]) ? current : LANGS.find((l) => hasContent(loaded[l.code]))?.code ?? current));
        setDocVersion((v) => v + 1);

        const local = readLocal(draftKey(id));
        if (local && local.savedAt > updatedAt && JSON.stringify(local.drafts) !== JSON.stringify(loaded)) {
          setRestoreOffer(local);
        }
      } catch (err) {
        setError((err as Error).message || '加载文章失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEditMode, user, authLoading, adminChecked, isAdmin]);

  // ---------------------------------------------------------------------------------------------
  // Autosave to this browser (the server copy only changes when the admin saves or publishes)

  useEffect(() => {
    if (loading || restoreOffer) return; // never overwrite a draft the admin hasn't decided about yet
    const t = setTimeout(() => {
      if (dirty) {
        const savedAt = Date.now();
        writeLocal(draftKey(id), { v: 1, savedAt, lang, drafts, meta });
        setLocalSavedAt(savedAt);
      } else {
        writeLocal(draftKey(id), null);
        setLocalSavedAt(null);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [drafts, meta, lang, dirty, id, loading, restoreOffer]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const acceptRestore = () => {
    if (!restoreOffer) return;
    setDrafts(restoreOffer.drafts);
    setMeta({ ...EMPTY_META, ...restoreOffer.meta });
    setLang(restoreOffer.lang);
    setDocVersion((v) => v + 1);
    setRestoreOffer(null);
  };
  const discardRestore = () => {
    writeLocal(draftKey(id), null);
    setRestoreOffer(null);
  };

  // ---------------------------------------------------------------------------------------------
  // Media

  const uploadMedia = useCallback(
    async (file: File): Promise<string> => {
      try {
        const scope = id ? `posts/${id}` : `drafts/${draftMediaScope}`;
        // Name files by content hash so the same image is stored once
        const hash = await sha256Hex(file);
        const fileName = `${hash ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}.${fileExtension(file)}`;
        const filePath = `${scope}/${fileName}`;
        const { data, error: uploadError } = await supabase.storage
          .from('blog-media')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) {
          const status = (uploadError as { statusCode?: number | string }).statusCode;
          const exists = String(status) === '409' || /already exists/i.test(uploadError.message || '');
          if (!exists) throw uploadError;
        }
        const path = data?.path || filePath;
        sessionUploadedPathsRef.current.add(path);
        return supabase.storage.from('blog-media').getPublicUrl(path).data.publicUrl;
      } catch (err) {
        setError(`上传失败：${(err as Error).message}`);
        throw err;
      }
    },
    [id, draftMediaScope]
  );

  // While editing, remove files uploaded in this session that are no longer referenced anywhere
  useEffect(() => {
    const t = setTimeout(async () => {
      const referenced = new Set<string>();
      Object.values(draftsRef.current).forEach((d) => mediaPathsIn(d.content).forEach((p) => referenced.add(p)));
      const cover = mediaPathFromUrl(metaRef.current.coverImage || '');
      if (cover) referenced.add(cover);
      Object.values(serverDrafts).forEach((d) => mediaPathsIn(d.content).forEach((p) => referenced.add(p)));
      const stale = [...sessionUploadedPathsRef.current].filter((p) => !referenced.has(p));
      if (stale.length === 0) return;
      stale.forEach((p) => sessionUploadedPathsRef.current.delete(p));
      await supabase.storage.from('blog-media').remove(stale);
    }, 3000);
    return () => clearTimeout(t);
  }, [drafts, meta.coverImage, serverDrafts]);

  const openLibrary = async (target: 'content' | 'cover') => {
    setLibraryTarget(target);
    setLoadingLibrary(true);
    try {
      const images: Array<{ name: string; url: string; path: string }> = [];
      const walk = async (prefix: string) => {
        const { data: items } = await supabase.storage
          .from('blog-media')
          .list(prefix, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
        for (const item of items || []) {
          const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
          if (item.id === null) await walk(fullPath);
          else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item.name)) {
            images.push({ name: item.name, path: fullPath, url: supabase.storage.from('blog-media').getPublicUrl(fullPath).data.publicUrl });
          }
        }
      };
      await walk('');
      setLibraryImages(images);
    } catch (err) {
      setError(`加载图片库失败：${(err as Error).message}`);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const pickLibraryImage = (url: string, name: string) => {
    if (libraryTarget === 'cover') updateMeta({ coverImage: url });
    else if (mode === 'rich') richRef.current?.insertImage(url, name.replace(/\.[^.]+$/, ''));
    else sourceRef.current?.insertBlock(`![${name}](${url})`);
    setLibraryTarget(null);
  };

  const openArticlePicker = async () => {
    setShowArticleSelector(true);
    setLoadingArticles(true);
    try {
      const { data, error: listError } = await supabase
        .from('blog_post_translations')
        .select('post_id, title, slug, excerpt')
        .eq('lang', lang)
        .order('created_at', { ascending: false })
        .limit(100);
      if (listError) throw listError;
      const postIds = (data || []).map((d) => d.post_id);
      const { data: posts } = await supabase.from('blog_posts').select('id, cover_image').in('id', postIds).eq('published', true);
      const covers = new Map((posts || []).map((p) => [p.id, p.cover_image]));
      setArticleList(
        (data || [])
          .filter((d) => covers.has(d.post_id) && d.post_id !== id)
          .map((d) => ({ id: d.post_id, title: d.title, slug: d.slug, excerpt: d.excerpt, cover_image: covers.get(d.post_id) || undefined }))
      );
    } catch (err) {
      setError(`加载文章列表失败：${(err as Error).message}`);
    } finally {
      setLoadingArticles(false);
    }
  };

  const insertArticleLink = (article: { title: string; slug: string; cover_image?: string }) => {
    const url = `/${lang}/blog/${article.slug}`;
    if (articleLinkType === 'card') {
      // Keep every line unindented (4 leading spaces would make Markdown treat it as a code block) and avoid
      // headings inside the <a> (heading anchors would nest <a> in <a>).
      const title = escapeHtml(article.title);
      const card = [
        '<div style="border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; margin: 20px 0; background: rgba(255,255,255,0.03); overflow: hidden; display: flex; align-items: stretch; min-height: 80px;">',
        `<a href="${escapeHtml(url)}" style="text-decoration: none; color: inherit; display: flex; width: 100%;">`,
        article.cover_image
          ? `<div style="width: 120px; height: 80px; flex-shrink: 0; border-right: 1px solid rgba(255,255,255,0.05);"><img src="${escapeHtml(article.cover_image)}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover;" /></div>`
          : '',
        '<div style="padding: 12px 16px; flex-grow: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0;">',
        `<div style="color: #fff; font-size: 1rem; font-weight: 600; margin: 0 0 4px 0; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div>`,
        '<div style="color: #8b5cf6; font-size: 0.85rem; font-weight: 500;">→ 阅读全文</div>',
        '</div>',
        '</a>',
        '</div>',
      ]
        .filter(Boolean)
        .join('\n');
      if (mode === 'rich') richRef.current?.insertRawHtml(card);
      else sourceRef.current?.insertBlock(card);
    } else if (mode === 'rich') {
      richRef.current?.insertLink(article.title, url);
    } else {
      sourceRef.current?.insertBlock(`[${article.title}](${url})`);
    }
    setShowArticleSelector(false);
  };

  // ---------------------------------------------------------------------------------------------
  // Editor plumbing

  /** Push pending rich-editor edits into state; returns the drafts including them. */
  const flushEditor = useCallback((): Drafts => {
    const md = mode === 'rich' ? richRef.current?.flush() : null;
    if (md == null) return draftsRef.current;
    const next = { ...draftsRef.current, [lang]: { ...draftsRef.current[lang], content: md } };
    draftsRef.current = next;
    return next;
  }, [mode, lang]);

  const switchLang = (next: BlogLang) => {
    if (next === lang) return;
    flushEditor();
    setLang(next);
  };

  const switchMode = (next: EditorMode) => {
    if (next === mode) return;
    flushEditor();
    setMode(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // preference only
    }
  };

  const handleTitleChange = (value: string) => {
    updateDraft({ title: value.replace(/\n/g, '') });
    // Suggest a slug from Latin-script titles until the admin edits it or the post is saved
    if (!slugTouchedRef.current && !isEditMode) {
      const s = generateSlug(value);
      if (s) updateMeta({ slug: s });
    }
  };

  const onUploadingChange = useCallback((delta: number) => setUploadingCount((c) => Math.max(0, c + delta)), []);
  const onRichChange = useCallback((md: string) => updateDraft({ content: md }), [updateDraft]);

  // ---------------------------------------------------------------------------------------------
  // Saving

  const save = useCallback(
    async (opts: { publish?: boolean } = {}): Promise<boolean> => {
      const currentDrafts = flushEditor();
      const current = metaRef.current;
      setError('');

      if (uploadingCount > 0) {
        setError('还有图片/视频在上传，请稍等再保存');
        return false;
      }
      const filled = LANGS.filter((l) => hasContent(currentDrafts[l.code]));
      if (filled.length === 0) {
        setError('先写点内容再保存吧：至少需要一个语言版本的标题');
        return false;
      }
      for (const l of filled) {
        const d = currentDrafts[l.code];
        if (!d.title.trim()) {
          setError(`${l.label}版本缺少标题`);
          return false;
        }
        if (current.articleType === 'original' && !d.content.trim()) {
          setError(`${l.label}版本缺少正文`);
          return false;
        }
      }
      if (current.articleType === 'external' && !current.externalUrl.trim()) {
        setError('外链地址不能为空');
        return false;
      }

      let slug = current.slug.trim();
      if (!slug) {
        slug =
          generateSlug(currentDrafts.en.title) ||
          filled.map((l) => generateSlug(currentDrafts[l.code].title)).find(Boolean) ||
          `post-${Date.now().toString(36)}`;
      }
      if (!SLUG_PATTERN.test(slug)) {
        setError('文章链接只能用小写英文字母、数字和连字符（-）');
        setPublishOpen(true);
        return false;
      }

      const publish = opts.publish ?? current.published;
      // Keep the original publish date when updating an already-published post
      const publishedAt = publish ? current.publishedAt || new Date().toISOString() : null;
      const master = currentDrafts.zh.title.trim() ? currentDrafts.zh : currentDrafts[filled[0].code];

      setSaving(true);
      try {
        const masterData = {
          title: master.title.trim(),
          slug,
          content_md: master.content.trim() || master.title.trim(),
          excerpt: master.excerpt.trim() || null,
          cover_image: current.coverImage.trim() || null,
          category: current.category,
          tags: current.tags,
          published: publish,
          published_at: publishedAt,
          author_id: user!.id,
          default_lang: 'zh',
          article_type: current.articleType,
          external_url: current.articleType === 'external' ? current.externalUrl.trim() : null,
        };

        let postId = id;
        if (postId) {
          const { error: updateError } = await supabase.from('blog_posts').update(masterData).eq('id', postId);
          if (updateError) throw updateError;
        } else {
          const { data: inserted, error: insertError } = await supabase.from('blog_posts').insert([masterData]).select('id').single();
          if (insertError) throw insertError;
          postId = inserted.id as string;
        }

        // Save every language version that has content; remove versions that were emptied
        const rows = filled.map((l) => ({
          post_id: postId,
          lang: l.code,
          slug,
          title: currentDrafts[l.code].title.trim(),
          excerpt: currentDrafts[l.code].excerpt.trim() || null,
          content_md: currentDrafts[l.code].content.trim(),
        }));
        const { error: tError } = await supabase.from('blog_post_translations').upsert(rows, { onConflict: 'post_id,lang' });
        if (tError) throw tError;
        const emptied = LANGS.filter((l) => !hasContent(currentDrafts[l.code]) && hasContent(serverDrafts[l.code])).map((l) => l.code);
        if (emptied.length && id) {
          await supabase.from('blog_post_translations').delete().eq('post_id', postId).in('lang', emptied);
        }

        // Delete media that the saved post no longer references (in any language or as the cover)
        const referenced = new Set<string>();
        Object.values(currentDrafts).forEach((d) => mediaPathsIn(d.content).forEach((p) => referenced.add(p)));
        const coverPath = mediaPathFromUrl(current.coverImage || '');
        if (coverPath) referenced.add(coverPath);
        const removed = new Set<string>();
        Object.values(serverDrafts).forEach((d) => mediaPathsIn(d.content).forEach((p) => !referenced.has(p) && removed.add(p)));
        const oldCover = mediaPathFromUrl(serverMeta.coverImage || '');
        if (oldCover && !referenced.has(oldCover)) removed.add(oldCover);
        if (removed.size) {
          supabase.storage
            .from('blog-media')
            .remove([...removed])
            .catch((err: unknown) => console.error('Failed to clean up unused media:', err));
        }

        const savedMeta = { ...current, slug, published: publish, publishedAt };
        setMeta(savedMeta);
        setServerMeta(savedMeta);
        setDrafts(currentDrafts);
        setServerDrafts(currentDrafts);
        setLastSavedAt(Date.now());
        setLocalSavedAt(null);
        writeLocal(draftKey(id), null);
        slugTouchedRef.current = true;

        if (!id && postId) {
          // Keep editing the same post: later saves update it instead of creating another
          loadedPostRef.current = postId;
          navigate(`/admin/blog/edit/${postId}`, { replace: true });
        }
        return true;
      } catch (err) {
        setError((err as Error).message || '保存失败');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [flushEditor, uploadingCount, id, user, serverDrafts, serverMeta, navigate]
  );

  const publish = async () => {
    if (await save({ publish: true })) {
      setPublishOpen(false);
      const slug = metaRef.current.slug;
      if (metaRef.current.articleType === 'original' && slug) navigate(`/${lang}/blog/${slug}`);
    }
  };

  const unpublish = async () => {
    if (await save({ publish: false })) setPublishOpen(false);
  };

  // Ctrl/Cmd + S saves
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!saving) save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, saving]);

  const leave = () => {
    if (dirty && !window.confirm('有修改还没保存到服务器（本机已保留草稿，下次打开可以恢复）。确定离开吗？')) return;
    navigate('/admin/blog');
  };

  // Title box grows with its text (also when a long title is loaded or the language changes)
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft.title, loading]);

  // ---------------------------------------------------------------------------------------------
  // Render

  if (!adminChecked || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-eva-secondary" aria-label="正在检查权限" />
      </div>
    );
  }
  if (!user || !isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold mb-4">权限不足</h1>
        <p className="text-gray-400">只有管理员可以访问此页面</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-eva-secondary" aria-label="正在加载文章" />
      </div>
    );
  }

  const text = mode === 'rich' ? plainText : markdownToPlainText(draft.content);
  const words = countWords(text);
  const status = uploadingCount
    ? { icon: <Loader2 className="w-4 h-4 animate-spin" />, text: `上传中（${uploadingCount}）`, tone: 'text-eva-secondary' }
    : saving
      ? { icon: <Loader2 className="w-4 h-4 animate-spin" />, text: '保存中…', tone: 'text-gray-400' }
      : dirty
        ? {
            icon: <Cloud className="w-4 h-4" />,
            text: localSavedAt ? `已暂存到本机 ${timeLabel(localSavedAt)} · 未保存到服务器` : '有未保存的修改',
            tone: 'text-amber-300/90',
          }
        : lastSavedAt
          ? { icon: <Check className="w-4 h-4" />, text: `已保存 ${timeLabel(lastSavedAt)}`, tone: 'text-gray-400' }
          : { icon: <Check className="w-4 h-4" />, text: meta.published ? '已发布' : isEditMode ? '草稿' : '新文章', tone: 'text-gray-500' };

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-16 z-40 h-14 border-b border-white/10 bg-eva-bg/95 backdrop-blur">
        <div className="max-w-5xl mx-auto h-full px-4 flex items-center gap-3">
          <button type="button" onClick={leave} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">文章列表</span>
          </button>

          <div role="tablist" aria-label="编辑语言" className="ml-2 flex items-center rounded-lg bg-white/5 p-0.5">
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                role="tab"
                aria-selected={lang === l.code}
                onClick={() => switchLang(l.code)}
                className={`relative px-3 py-1 rounded-md text-sm transition-colors ${
                  lang === l.code ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {l.label}
                {hasContent(drafts[l.code]) && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-eva-secondary" aria-label="已有内容" />
                )}
              </button>
            ))}
          </div>

          <span className={`ml-auto hidden md:inline-flex items-center gap-1.5 text-xs ${status.tone}`} role="status">
            {status.icon}
            {status.text}
          </span>

          <button
            type="button"
            onClick={() => save()}
            disabled={saving}
            title="Ctrl + S"
            className="ml-auto md:ml-2 px-3 py-1.5 rounded-lg text-sm border border-white/15 text-gray-200 hover:bg-white/10 disabled:opacity-50"
          >
            {meta.published ? '保存更新' : '保存草稿'}
          </button>
          <button
            type="button"
            onClick={() => {
              flushEditor();
              setPublishOpen(true);
            }}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg text-sm font-bold bg-eva-secondary text-eva-bg hover:bg-eva-secondary/90 disabled:opacity-50"
          >
            {meta.published ? '发布设置' : '发布'}
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pb-24">
        {restoreOffer && (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm" role="alert">
            <span className="flex-1 text-amber-100">
              发现 {new Date(restoreOffer.savedAt).toLocaleString('zh-CN', { hour12: false })} 自动暂存的草稿，比服务器上的版本新。
            </span>
            <button type="button" onClick={acceptRestore} className="px-3 py-1 rounded-md bg-amber-400 text-black font-medium">
              恢复草稿
            </button>
            <button type="button" onClick={discardRestore} className="px-3 py-1 rounded-md text-amber-100 hover:bg-white/10">
              丢弃
            </button>
          </div>
        )}

        {error && !publishOpen && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
            <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="关闭提示" className="text-red-300/70 hover:text-red-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <textarea
          ref={titleRef}
          value={draft.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (mode === 'rich') richRef.current?.focus();
              else sourceRef.current?.focus();
            }
          }}
          rows={1}
          maxLength={100}
          placeholder="请输入标题（最多 100 字）"
          aria-label="文章标题"
          className="mt-10 w-full resize-none overflow-hidden bg-transparent text-3xl sm:text-4xl font-bold leading-tight text-white placeholder-gray-600 focus:outline-none"
        />

        {meta.articleType === 'external' ? (
          <div className="mt-8 space-y-2">
            <label htmlFor="external-url" className="block text-sm font-medium text-gray-300">
              外链地址
            </label>
            <input
              id="external-url"
              type="url"
              value={meta.externalUrl}
              onChange={(e) => updateMeta({ externalUrl: e.target.value })}
              placeholder="https://example.com/article"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
            />
            <p className="text-xs text-gray-500">这是一篇引用文章：读者点击后会跳转到原文。封面、分类、标签在「发布设置」里修改。</p>
          </div>
        ) : mode === 'rich' ? (
          <RichEditor
            ref={richRef}
            docKey={`${lang}:${docVersion}`}
            markdown={draft.content}
            onChange={onRichChange}
            upload={uploadMedia}
            onUploadingChange={onUploadingChange}
            onOpenMediaLibrary={() => openLibrary('content')}
            onOpenArticlePicker={openArticlePicker}
            onTextChange={setPlainText}
            toolbarClassName="sticky top-[7.5rem] z-30 mt-6"
          />
        ) : (
          <SourceEditor
            ref={sourceRef}
            value={draft.content}
            onChange={(v) => updateDraft({ content: v })}
            upload={uploadMedia}
            onUploadingChange={onUploadingChange}
          />
        )}
      </main>

      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-eva-bg/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-11 flex items-center gap-4 text-xs text-gray-500">
          {meta.articleType === 'original' && (
            <span>
              {words.toLocaleString()} 字 · 约 {readingMinutes(text)} 分钟读完
            </span>
          )}
          <span className={`md:hidden inline-flex items-center gap-1.5 ${status.tone}`}>
            {status.icon}
            {status.text}
          </span>
          {meta.articleType === 'original' && (
            <div role="tablist" aria-label="编辑模式" className="ml-auto flex items-center rounded-md bg-white/5 p-0.5">
              {(
                [
                  ['rich', '所见即所得'],
                  ['source', 'Markdown 源码'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => switchMode(value)}
                  className={`px-2.5 py-1 rounded ${mode === value ? 'bg-white/10 text-white' : 'hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <PublishPanel
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        lang={lang}
        isPublished={meta.published}
        saving={saving}
        error={publishOpen ? error : ''}
        slug={meta.slug}
        onSlugChange={(v) => {
          slugTouchedRef.current = true;
          updateMeta({ slug: v });
        }}
        category={meta.category}
        onCategoryChange={(v) => updateMeta({ category: v })}
        tags={meta.tags}
        onTagsChange={(v) => updateMeta({ tags: v })}
        coverImage={meta.coverImage}
        onCoverChange={(v) => updateMeta({ coverImage: v })}
        uploadCover={uploadMedia}
        onPickCoverFromLibrary={() => openLibrary('cover')}
        excerpt={draft.excerpt}
        onExcerptChange={(v) => updateDraft({ excerpt: v })}
        onGenerateExcerpt={() => {
          const source = (mode === 'rich' ? plainText : markdownToPlainText(draft.content)).replace(/\s+/g, ' ').trim();
          updateDraft({ excerpt: source.length > 140 ? `${source.slice(0, 139)}…` : source });
        }}
        onPublish={publish}
        onUnpublish={unpublish}
      />

      {/* Media library */}
      {libraryTarget && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="library-title">
          <div className="bg-eva-surface border border-white/20 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-6 h-6 text-eva-secondary" aria-hidden="true" />
                <h2 id="library-title" className="text-2xl font-bold text-white">
                  {libraryTarget === 'cover' ? '选择封面' : '图片库'}
                </h2>
                <span className="text-sm text-gray-400">{libraryImages.length} 张图片</span>
              </div>
              <button type="button" onClick={() => setLibraryTarget(null)} className="p-2 hover:bg-white/10 rounded-lg" aria-label="关闭">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingLibrary ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-10 h-10 animate-spin text-eva-secondary" aria-label="加载中" />
                </div>
              ) : libraryImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <ImageIcon className="w-16 h-16 text-gray-600 mb-4" aria-hidden="true" />
                  <p className="text-gray-400 text-lg">图片库为空</p>
                  <p className="text-gray-500 text-sm mt-2">上传新图片后会显示在这里</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {libraryImages.map((img) => (
                    <button
                      key={img.path}
                      type="button"
                      onClick={() => pickLibraryImage(img.url, img.name)}
                      className="group relative aspect-square bg-black/30 border border-white/10 rounded-lg overflow-hidden hover:border-eva-secondary transition-colors"
                    >
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
                      <span className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-center justify-center text-sm text-white">
                        {libraryTarget === 'cover' ? '设为封面' : '点击插入'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Article picker */}
      {showArticleSelector && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="article-picker-title">
          <div className="bg-eva-surface border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Link2 className="w-6 h-6 text-eva-secondary" aria-hidden="true" />
                <h2 id="article-picker-title" className="text-2xl font-bold text-white">
                  插入站内文章
                </h2>
                <span className="text-sm text-gray-400">{articleList.length} 篇</span>
              </div>
              <button type="button" onClick={() => setShowArticleSelector(false)} className="p-2 hover:bg-white/10 rounded-lg" aria-label="关闭">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="px-6 pt-4 flex items-center gap-3" role="radiogroup" aria-label="链接样式">
              <span className="text-sm text-gray-400">样式：</span>
              {(
                [
                  ['text', '普通链接', <FileText key="t" className="w-4 h-4" />],
                  ['card', '卡片', <ImageIcon key="c" className="w-4 h-4" />],
                ] as const
              ).map(([value, label, icon]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={articleLinkType === value}
                  onClick={() => setArticleLinkType(value)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                    articleLinkType === value ? 'bg-eva-secondary text-eva-bg' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingArticles ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-10 h-10 animate-spin text-eva-secondary" aria-label="加载中" />
                </div>
              ) : articleList.length === 0 ? (
                <p className="text-center text-gray-400 py-16">当前语言暂无已发布的文章</p>
              ) : (
                <div className="space-y-3">
                  {articleList.map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => insertArticleLink(article)}
                      className="w-full flex gap-4 p-4 text-left bg-black/30 border border-white/10 rounded-lg hover:border-eva-secondary transition-colors"
                    >
                      {article.cover_image && (
                        <img src={article.cover_image} alt="" className="w-28 h-20 rounded object-cover shrink-0" loading="lazy" />
                      )}
                      <span className="min-w-0">
                        <span className="block text-white font-semibold line-clamp-1">{article.title}</span>
                        <span className="block text-gray-400 text-sm line-clamp-2 mt-1">{article.excerpt || '暂无摘要'}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
