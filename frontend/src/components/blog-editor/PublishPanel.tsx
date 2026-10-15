import React, { useEffect, useRef, useState } from 'react';
import { FolderOpen, ImagePlus, Loader2, Sparkles, Trash2, X } from 'lucide-react';

export const BLOG_CATEGORIES = [
  { value: 'mbti', label: 'MBTI' },
  { value: 'enneagram-types', label: '九型基本类型' },
  { value: 'enneagram-wings', label: '九型侧翼' },
  { value: 'enneagram-instincts', label: '九型副型' },
  { value: 'tritype', label: 'Tritype' },
  { value: 'yixue', label: '易学人格学' },
  { value: 'tech', label: '技术文章' },
  { value: 'other', label: '其他' },
];

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface PublishPanelProps {
  open: boolean;
  onClose: () => void;
  lang: string;
  isPublished: boolean;
  saving: boolean;
  error: string;
  slug: string;
  onSlugChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  tags: string[];
  onTagsChange: (v: string[]) => void;
  coverImage: string;
  onCoverChange: (v: string) => void;
  uploadCover: (file: File) => Promise<string>;
  onPickCoverFromLibrary: () => void;
  excerpt: string;
  onExcerptChange: (v: string) => void;
  onGenerateExcerpt: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
}

export const PublishPanel: React.FC<PublishPanelProps> = (props) => {
  const { open, onClose } = props;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const slugInvalid = !!props.slug && !SLUG_PATTERN.test(props.slug);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/60" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-panel-title"
        className="h-full w-full max-w-md overflow-y-auto bg-eva-surface border-l border-white/10 shadow-2xl focus:outline-none flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 id="publish-panel-title" className="text-lg font-bold">
            {props.isPublished ? '更新已发布的文章' : '发布设置'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10" aria-label="关闭">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          <CoverField {...props} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="excerpt" className="text-sm font-medium text-gray-300">
                摘要 <span className="text-gray-500 font-normal">（列表和搜索结果里显示）</span>
              </label>
              <button
                type="button"
                onClick={props.onGenerateExcerpt}
                className="inline-flex items-center gap-1 text-xs text-eva-secondary hover:underline"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                从正文提取
              </button>
            </div>
            <textarea
              id="excerpt"
              value={props.excerpt}
              onChange={(e) => props.onExcerptChange(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="一两句话说明这篇文章讲什么…"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-eva-secondary resize-none"
            />
            <p className="mt-1 text-right text-xs text-gray-500">{props.excerpt.length}/300 · 建议 80–150 字</p>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-gray-300 mb-2">分类</legend>
            <div className="flex flex-wrap gap-2">
              {BLOG_CATEGORIES.map((c) => (
                <label
                  key={c.value}
                  className={`cursor-pointer px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    props.category === c.value
                      ? 'bg-eva-secondary/20 border-eva-secondary text-eva-secondary'
                      : 'border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={c.value}
                    checked={props.category === c.value}
                    onChange={() => props.onCategoryChange(c.value)}
                    className="sr-only"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>

          <TagInput tags={props.tags} onChange={props.onTagsChange} />

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-2">
              文章链接
            </label>
            <div
              className={`flex items-center bg-black/30 border rounded-lg focus-within:border-eva-secondary ${
                slugInvalid ? 'border-red-500/70' : 'border-white/10'
              }`}
            >
              <span className="pl-3 text-sm text-gray-500 font-mono whitespace-nowrap">/{props.lang}/blog/</span>
              <input
                id="slug"
                value={props.slug}
                onChange={(e) => props.onSlugChange(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="intj-anime-characters"
                aria-invalid={slugInvalid}
                aria-describedby="slug-help"
                className="flex-1 min-w-0 bg-transparent px-1 py-2 text-sm text-white font-mono focus:outline-none"
              />
            </div>
            <p id="slug-help" className={`mt-1 text-xs ${slugInvalid ? 'text-red-400' : 'text-gray-500'}`}>
              {slugInvalid ? '只能用小写英文字母、数字和连字符（-）' : '用英文关键词更利于搜索收录；所有语言版本共用这个链接'}
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 px-6 py-4 border-t border-white/10 bg-eva-surface space-y-3">
          {props.error && <p className="text-sm text-red-400" role="alert">{props.error}</p>}
          <button
            type="button"
            onClick={props.onPublish}
            disabled={props.saving || slugInvalid}
            className="w-full bg-eva-secondary text-eva-bg font-bold py-3 rounded-lg hover:bg-eva-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {props.saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {props.isPublished ? '更新文章' : '发布文章'}
          </button>
          {props.isPublished && (
            <button
              type="button"
              onClick={props.onUnpublish}
              disabled={props.saving}
              className="w-full text-sm text-gray-400 hover:text-red-300 py-1"
            >
              撤回发布（转为草稿）
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CoverField: React.FC<PublishPanelProps> = ({ coverImage, onCoverChange, uploadCover, onPickCoverFromLibrary }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      onCoverChange(await uploadCover(file));
    } catch {
      // uploadCover reports the error
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-300 mb-2">封面图</p>
      {coverImage ? (
        <div className="relative group rounded-lg overflow-hidden border border-white/10">
          <img src={coverImage} alt="封面预览" className="w-full aspect-[16/9] object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button type="button" onClick={() => inputRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-white/15 text-sm hover:bg-white/25">
              更换
            </button>
            <button type="button" onClick={() => onCoverChange('')} className="px-3 py-1.5 rounded-lg bg-white/15 text-sm hover:bg-red-500/40 inline-flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              移除
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`w-full aspect-[16/9] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 text-sm transition-colors ${
            dragOver ? 'border-eva-secondary text-eva-secondary bg-eva-secondary/5' : 'border-white/15 text-gray-400 hover:border-white/30'
          }`}
        >
          {uploading ? <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" /> : <ImagePlus className="w-6 h-6" aria-hidden="true" />}
          {uploading ? '上传中…' : '点击上传或拖入图片'}
          <span className="text-xs text-gray-500">建议 1200×675（16:9），也会用作分享卡片</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      <div className="mt-2 flex items-center gap-4 text-xs">
        <button type="button" onClick={onPickCoverFromLibrary} className="inline-flex items-center gap-1 text-gray-400 hover:text-white">
          <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
          从图片库选择
        </button>
        <button type="button" onClick={() => setShowUrl((v) => !v)} className="text-gray-400 hover:text-white">
          使用图片链接
        </button>
      </div>
      {showUrl && (
        <input
          type="url"
          value={coverImage}
          onChange={(e) => onCoverChange(e.target.value)}
          placeholder="https://…"
          aria-label="封面图片链接"
          className="mt-2 w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-eva-secondary"
        />
      )}
    </div>
  );
};

const TagInput: React.FC<{ tags: string[]; onChange: (tags: string[]) => void }> = ({ tags, onChange }) => {
  const [draft, setDraft] = useState('');

  const commit = (raw: string) => {
    const next = raw
      .split(/[,，、]/)
      .map((t) => t.trim())
      .filter((t) => t && !tags.includes(t));
    if (next.length) onChange([...tags, ...next].slice(0, 10));
    setDraft('');
  };

  return (
    <div>
      <label htmlFor="tag-input" className="block text-sm font-medium text-gray-300 mb-2">
        标签 <span className="text-gray-500 font-normal">（回车或逗号添加，最多 10 个）</span>
      </label>
      <div className="flex flex-wrap items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-2 py-2 focus-within:border-eva-secondary">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full bg-eva-accent/20 text-eva-accent text-sm">
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="p-0.5 rounded-full hover:bg-white/10"
              aria-label={`删除标签 ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          id="tag-input"
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            if (/[,，、]/.test(v)) commit(v);
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              commit(draft);
            } else if (e.key === 'Backspace' && !draft && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={() => draft.trim() && commit(draft)}
          placeholder={tags.length ? '' : 'INTJ、人格分析、动漫'}
          className="flex-1 min-w-[8rem] bg-transparent px-1 py-0.5 text-sm text-white focus:outline-none"
        />
      </div>
    </div>
  );
};
