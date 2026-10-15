import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { NodeSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { Placeholder } from '@tiptap/extensions';
import {
  Bold,
  Code,
  FileText,
  Film,
  FolderOpen,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Table,
  Undo2,
  Unlink,
} from 'lucide-react';
import { RawHtml } from './RawHtmlNode';
import { htmlToMarkdown, markdownToHtml } from './markdown';
import './blog-editor.css';

/** Image node with a transient upload id, so a local preview can be swapped for the uploaded URL. */
const UploadableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      uploadId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-upload-id'),
        renderHTML: (attrs) => (attrs.uploadId ? { 'data-upload-id': attrs.uploadId } : {}),
      },
    };
  },
}).configure({ inline: false, allowBase64: false });

const isMedia = (f: File) => f.type.startsWith('image/') || f.type.startsWith('video/');
const altFromFile = (f: File) => {
  const base = f.name.replace(/\.[^.]+$/, '');
  return /^(image|screenshot|clipboard|blob)$/i.test(base) ? '' : base;
};
const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export interface RichEditorHandle {
  /** Push any pending edit to onChange right away; returns the Markdown if there was one. */
  flush: () => string | null;
  insertImage: (url: string, alt?: string) => void;
  insertRawHtml: (html: string) => void;
  insertLink: (text: string, href: string) => void;
  insertFiles: (files: File[]) => void;
  getText: () => string;
  focus: () => void;
}

interface RichEditorProps {
  /** Changing this reloads the editor from `markdown` (language switch, mode switch, draft restore). */
  docKey: string;
  markdown: string;
  onChange: (markdown: string) => void;
  upload: (file: File) => Promise<string>;
  /** Called with +1 when an upload starts and -1 when it ends. */
  onUploadingChange?: (delta: number) => void;
  onOpenMediaLibrary: () => void;
  onOpenArticlePicker: () => void;
  onTextChange?: (text: string) => void;
  toolbarClassName?: string;
}

interface SlashItem {
  id: string;
  label: string;
  hint: string;
  keywords: string;
  icon: React.ReactNode;
  run: (editor: Editor) => void;
}

interface SlashState {
  open: boolean;
  query: string;
  index: number;
  from: number;
  top: number;
  left: number;
}

const CLOSED: SlashState = { open: false, query: '', index: 0, from: 0, top: 0, left: 0 };

export const RichEditor = forwardRef<RichEditorHandle, RichEditorProps>(function RichEditor(
  { docKey, markdown, onChange, upload, onUploadingChange, onOpenMediaLibrary, onOpenArticlePicker, onTextChange, toolbarClassName },
  ref
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onTextChangeRef = useRef(onTextChange);
  onTextChangeRef.current = onTextChange;
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const [slash, setSlash] = useState<SlashState>(CLOSED);
  const slashRef = useRef(slash);
  slashRef.current = slash;
  const [linkEditing, setLinkEditing] = useState(false);
  const [linkDraft, setLinkDraft] = useState('');

  const flush = useCallback((): string | null => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const editor = editorRef.current;
    // Parents flush before unmounting/switching; a destroyed editor has nothing left to read
    if (!pendingRef.current || !editor || editor.isDestroyed) return null;
    pendingRef.current = false;
    const md = htmlToMarkdown(editor.getHTML());
    onChangeRef.current(md);
    return md;
  }, []);

  const onUploadingChangeRef = useRef(onUploadingChange);
  onUploadingChangeRef.current = onUploadingChange;
  const bumpUploading = useCallback((delta: number) => onUploadingChangeRef.current?.(delta), []);

  /** Replace (or remove, when attrs is null) the placeholder image with this upload id. */
  const resolveUpload = useCallback((uploadId: string, attrs: { src: string } | null) => {
    const editor = editorRef.current;
    if (!editor || editor.isDestroyed) return;
    const { state } = editor;
    let tr = state.tr;
    let found = false;
    state.doc.descendants((node, pos) => {
      if (found) return false;
      if (node.type.name === 'image' && node.attrs.uploadId === uploadId) {
        tr = attrs
          ? tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs, uploadId: null })
          : tr.delete(pos, pos + node.nodeSize);
        found = true;
        return false;
      }
      return true;
    });
    if (found) editor.view.dispatch(tr);
  }, []);

  const insertFiles = useCallback(
    (files: File[]) => {
      const editor = editorRef.current;
      if (!editor) return;
      for (const file of files.filter(isMedia)) {
        bumpUploading(1);
        if (file.type.startsWith('image/')) {
          // Show the image immediately from a local blob URL; swap in the real URL when the upload finishes
          const uploadId = `up-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const blobUrl = URL.createObjectURL(file);
          editor.chain().focus().insertContent({ type: 'image', attrs: { src: blobUrl, alt: altFromFile(file), uploadId } }).run();
          upload(file)
            .then((url) => resolveUpload(uploadId, { src: url }))
            .catch(() => resolveUpload(uploadId, null))
            .finally(() => {
              URL.revokeObjectURL(blobUrl);
              bumpUploading(-1);
            });
        } else {
          upload(file)
            .then((url) =>
              editorRef.current
                ?.chain()
                .focus()
                .insertContent({ type: 'rawHtml', attrs: { html: `<video controls src="${escapeAttr(url)}" style="max-width: 100%;"></video>` } })
                .run()
            )
            .catch(() => undefined)
            .finally(() => bumpUploading(-1));
        }
      }
    },
    [bumpUploading, resolveUpload, upload]
  );
  const insertFilesRef = useRef(insertFiles);
  insertFilesRef.current = insertFiles;

  const pickFiles = useCallback((accept: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;
    input.onchange = () => insertFilesRef.current(Array.from(input.files || []));
    input.click();
  }, []);

  const slashItems: SlashItem[] = useMemo(
    () => [
      { id: 'p', label: '正文', hint: '普通段落', keywords: 'text paragraph zw zhengwen', icon: <Pilcrow className="w-4 h-4" />, run: (e) => e.chain().focus().setParagraph().run() },
      { id: 'h2', label: '大标题', hint: '## 二级标题', keywords: 'h2 heading title bt biaoti', icon: <Heading2 className="w-4 h-4" />, run: (e) => e.chain().focus().setHeading({ level: 2 }).run() },
      { id: 'h3', label: '小标题', hint: '### 三级标题', keywords: 'h3 heading subtitle bt biaoti', icon: <Heading3 className="w-4 h-4" />, run: (e) => e.chain().focus().setHeading({ level: 3 }).run() },
      { id: 'image', label: '图片', hint: '从电脑上传', keywords: 'image picture tp tupian img', icon: <ImageIcon className="w-4 h-4" />, run: () => pickFiles('image/*') },
      { id: 'library', label: '图片库', hint: '选择已上传的图片', keywords: 'library media tpk tupianku', icon: <FolderOpen className="w-4 h-4" />, run: () => onOpenMediaLibrary() },
      { id: 'video', label: '视频', hint: 'MP4 / WebM', keywords: 'video sp shipin', icon: <Film className="w-4 h-4" />, run: () => pickFiles('video/*') },
      { id: 'article', label: '站内文章', hint: '链接或卡片', keywords: 'article link card wz wenzhang', icon: <FileText className="w-4 h-4" />, run: () => onOpenArticlePicker() },
      { id: 'quote', label: '引用', hint: '> 引用块', keywords: 'quote blockquote yy yinyong', icon: <Quote className="w-4 h-4" />, run: (e) => e.chain().focus().toggleBlockquote().run() },
      { id: 'ul', label: '无序列表', hint: '- 列表', keywords: 'list bullet ul lb liebiao', icon: <List className="w-4 h-4" />, run: (e) => e.chain().focus().toggleBulletList().run() },
      { id: 'ol', label: '有序列表', hint: '1. 列表', keywords: 'ordered number ol lb liebiao', icon: <ListOrdered className="w-4 h-4" />, run: (e) => e.chain().focus().toggleOrderedList().run() },
      { id: 'code', label: '代码块', hint: '``` 代码', keywords: 'code codeblock dm daima', icon: <SquareCode className="w-4 h-4" />, run: (e) => e.chain().focus().toggleCodeBlock().run() },
      { id: 'table', label: '表格', hint: '3 × 3', keywords: 'table bg biaoge', icon: <Table className="w-4 h-4" />, run: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { id: 'hr', label: '分割线', hint: '---', keywords: 'hr divider line fgx fengexian', icon: <Minus className="w-4 h-4" />, run: (e) => e.chain().focus().setHorizontalRule().run() },
    ],
    [onOpenArticlePicker, onOpenMediaLibrary, pickFiles]
  );

  const filteredSlash = useMemo(() => {
    const q = slash.query.toLowerCase();
    return q ? slashItems.filter((i) => i.label.includes(q) || i.keywords.includes(q)) : slashItems;
  }, [slash.query, slashItems]);
  const filteredSlashRef = useRef(filteredSlash);
  filteredSlashRef.current = filteredSlash;

  const runSlash = useCallback((item: SlashItem | undefined) => {
    const editor = editorRef.current;
    const s = slashRef.current;
    setSlash(CLOSED);
    if (!editor || !item) return;
    // Remove the "/query" text, then apply the chosen block
    editor.chain().focus().deleteRange({ from: s.from, to: editor.state.selection.from }).run();
    item.run(editor);
  }, []);

  /** Open the insert menu when a paragraph starts with "/" (optionally followed by a filter word). */
  const updateSlash = useCallback((editor: Editor) => {
    const { selection } = editor.state;
    const { $from, empty } = selection;
    if (!empty || $from.parent.type.name !== 'paragraph') {
      if (slashRef.current.open) setSlash(CLOSED);
      return;
    }
    const before = $from.parent.textBetween(0, $from.parentOffset, '\n', '￼');
    const match = /^\/([^\s/]{0,12})$/.exec(before);
    if (!match) {
      if (slashRef.current.open) setSlash(CLOSED);
      return;
    }
    const coords = editor.view.coordsAtPos($from.pos);
    setSlash((prev) => ({
      open: true,
      query: match[1],
      index: prev.open && prev.query === match[1] ? prev.index : 0,
      from: $from.start(),
      top: coords.bottom + 6,
      left: coords.left,
    }));
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        // Markdown has no underline; keep the toolbar to what the post format can store
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      UploadableImage,
      TableKit.configure({ table: { resizable: false } }),
      RawHtml,
      Placeholder.configure({ placeholder: '从这里开始写正文… 输入「/」插入图片、标题、引用、表格等' }),
    ],
    content: markdownToHtml(markdown),
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-invert prose-lg max-w-none focus:outline-none',
        'aria-label': '文章正文',
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files || []).filter(isMedia);
        if (files.length === 0) return false;
        event.preventDefault();
        insertFilesRef.current(files);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const files = Array.from(event.dataTransfer?.files || []).filter(isMedia);
        if (files.length === 0) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (pos) editorRef.current?.commands.setTextSelection(pos.pos);
        insertFilesRef.current(files);
        return true;
      },
      handleKeyDown: (_view, event) => {
        const s = slashRef.current;
        if (!s.open) return false;
        const items = filteredSlashRef.current;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          if (items.length === 0) return true;
          const delta = event.key === 'ArrowDown' ? 1 : -1;
          setSlash((prev) => ({ ...prev, index: (prev.index + delta + items.length) % items.length }));
          return true;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          if (items.length === 0) return false;
          event.preventDefault();
          runSlash(items[Math.min(s.index, items.length - 1)]);
          return true;
        }
        if (event.key === 'Escape') {
          setSlash(CLOSED);
          return true;
        }
        return false;
      },
    },
    onCreate: ({ editor }) => {
      editorRef.current = editor;
      onTextChangeRef.current?.(editor.getText());
    },
    onUpdate: ({ editor }) => {
      pendingRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      // Converting to Markdown on every keystroke is wasteful; batch it
      timerRef.current = setTimeout(flush, 400);
      onTextChangeRef.current?.(editor.getText());
      updateSlash(editor);
    },
    onSelectionUpdate: ({ editor }) => updateSlash(editor),
    onBlur: () => {
      flush();
    },
  });
  editorRef.current = editor;

  // Reload content when the document identity changes (not on every markdown prop change)
  const loadedKeyRef = useRef(docKey);
  useEffect(() => {
    if (!editor || loadedKeyRef.current === docKey) return;
    loadedKeyRef.current = docKey;
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = false;
    editor.commands.setContent(markdownToHtml(markdown), { emitUpdate: false });
    onTextChangeRef.current?.(editor.getText());
    // markdown is read only when docKey changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey, editor]);

  // Don't lose the last keystrokes when the editor unmounts (e.g. switching to source mode)
  useEffect(() => () => void flush(), [flush]);

  useImperativeHandle(
    ref,
    () => ({
      flush,
      insertImage: (url, alt = '') => editorRef.current?.chain().focus().insertContent({ type: 'image', attrs: { src: url, alt } }).run(),
      insertRawHtml: (html) => editorRef.current?.chain().focus().insertContent({ type: 'rawHtml', attrs: { html } }).run(),
      insertLink: (text, href) =>
        editorRef.current
          ?.chain()
          .focus()
          .insertContent({ type: 'text', text, marks: [{ type: 'link', attrs: { href } }] })
          .insertContent(' ')
          .run(),
      insertFiles,
      getText: () => editorRef.current?.getText() ?? '',
      focus: () => editorRef.current?.commands.focus(),
    }),
    [flush, insertFiles]
  );

  // Must be stable: a new function each render makes the menu re-register (and re-render) forever
  const shouldShowBubble = useCallback(
    ({ editor: e, state }: { editor: Editor; state: Editor['state'] }) =>
      e.isEditable && !state.selection.empty && !(state.selection instanceof NodeSelection),
    []
  );

  const applyLink = () => {
    if (!editor) return;
    const href = linkDraft.trim();
    if (!href) editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    setLinkEditing(false);
  };

  const startLink = () => {
    if (!editor) return;
    if (editor.state.selection.empty && !editor.isActive('link')) {
      const href = window.prompt('链接地址');
      if (href?.trim()) {
        editor.chain().focus().insertContent({ type: 'text', text: href.trim(), marks: [{ type: 'link', attrs: { href: href.trim() } }] }).run();
      }
      return;
    }
    setLinkDraft(editor.getAttributes('link').href || '');
    setLinkEditing(true);
  };

  if (!editor) return null;

  const tb = (label: string, icon: React.ReactNode, onClick: () => void, active = false, disabled = false) => (
    <button
      key={label}
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`p-2 rounded-md transition-colors disabled:opacity-30 ${
        active ? 'bg-eva-secondary/20 text-eva-secondary' : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
    </button>
  );
  const sep = (k: string) => <span key={k} className="w-px h-5 bg-white/10 mx-1" aria-hidden="true" />;
  const chain = () => editor.chain().focus();

  return (
    <div className="blog-editor">
      <div
        role="toolbar"
        aria-label="格式工具栏"
        className={`flex flex-wrap items-center gap-0.5 py-2 border-b border-white/10 bg-eva-bg/95 backdrop-blur ${toolbarClassName ?? ''}`}
      >
        {tb('撤销 (Ctrl+Z)', <Undo2 className="w-4 h-4" />, () => chain().undo().run(), false, !editor.can().undo())}
        {tb('重做 (Ctrl+Shift+Z)', <Redo2 className="w-4 h-4" />, () => chain().redo().run(), false, !editor.can().redo())}
        {sep('s1')}
        {tb('大标题', <Heading2 className="w-4 h-4" />, () => chain().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
        {tb('小标题', <Heading3 className="w-4 h-4" />, () => chain().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
        {tb('加粗 (Ctrl+B)', <Bold className="w-4 h-4" />, () => chain().toggleBold().run(), editor.isActive('bold'))}
        {tb('斜体 (Ctrl+I)', <Italic className="w-4 h-4" />, () => chain().toggleItalic().run(), editor.isActive('italic'))}
        {tb('删除线', <Strikethrough className="w-4 h-4" />, () => chain().toggleStrike().run(), editor.isActive('strike'))}
        {tb('行内代码', <Code className="w-4 h-4" />, () => chain().toggleCode().run(), editor.isActive('code'))}
        {tb('链接 (Ctrl+K)', <LinkIcon className="w-4 h-4" />, startLink, editor.isActive('link'))}
        {sep('s2')}
        {tb('引用', <Quote className="w-4 h-4" />, () => chain().toggleBlockquote().run(), editor.isActive('blockquote'))}
        {tb('无序列表', <List className="w-4 h-4" />, () => chain().toggleBulletList().run(), editor.isActive('bulletList'))}
        {tb('有序列表', <ListOrdered className="w-4 h-4" />, () => chain().toggleOrderedList().run(), editor.isActive('orderedList'))}
        {tb('代码块', <SquareCode className="w-4 h-4" />, () => chain().toggleCodeBlock().run(), editor.isActive('codeBlock'))}
        {tb('分割线', <Minus className="w-4 h-4" />, () => chain().setHorizontalRule().run())}
        {tb('表格', <Table className="w-4 h-4" />, () => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}
        {sep('s3')}
        {tb('上传图片（也可直接粘贴或拖入）', <ImageIcon className="w-4 h-4" />, () => pickFiles('image/*'))}
        {tb('图片库', <FolderOpen className="w-4 h-4" />, onOpenMediaLibrary)}
        {tb('上传视频', <Film className="w-4 h-4" />, () => pickFiles('video/*'))}
        {tb('插入站内文章', <FileText className="w-4 h-4" />, onOpenArticlePicker)}
      </div>

      <BubbleMenu
        editor={editor}
        shouldShow={shouldShowBubble}
        className="flex items-center gap-0.5 rounded-lg border border-white/15 bg-[#1f1f1f] p-1 shadow-xl"
      >
        {linkEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyLink();
            }}
            className="flex items-center gap-1"
          >
            <input
              autoFocus
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setLinkEditing(false)}
              placeholder="粘贴或输入链接，回车确认"
              aria-label="链接地址"
              className="w-64 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-eva-secondary"
            />
            <button type="submit" className="px-2 py-1 text-sm text-eva-secondary hover:bg-white/10 rounded">
              确定
            </button>
          </form>
        ) : (
          <>
            {tb('加粗', <Bold className="w-4 h-4" />, () => chain().toggleBold().run(), editor.isActive('bold'))}
            {tb('斜体', <Italic className="w-4 h-4" />, () => chain().toggleItalic().run(), editor.isActive('italic'))}
            {tb('删除线', <Strikethrough className="w-4 h-4" />, () => chain().toggleStrike().run(), editor.isActive('strike'))}
            {tb('行内代码', <Code className="w-4 h-4" />, () => chain().toggleCode().run(), editor.isActive('code'))}
            {tb('大标题', <Heading2 className="w-4 h-4" />, () => chain().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
            {tb('引用', <Quote className="w-4 h-4" />, () => chain().toggleBlockquote().run(), editor.isActive('blockquote'))}
            {tb('链接', <LinkIcon className="w-4 h-4" />, startLink, editor.isActive('link'))}
            {editor.isActive('link') && tb('取消链接', <Unlink className="w-4 h-4" />, () => chain().extendMarkRange('link').unsetLink().run())}
          </>
        )}
      </BubbleMenu>

      <EditorContent
        editor={editor}
        className="pt-6"
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            startLink();
          }
        }}
      />

      {slash.open && filteredSlash.length > 0 && (
        <div
          role="listbox"
          aria-label="插入内容"
          className="fixed z-50 w-64 max-h-80 overflow-y-auto rounded-lg border border-white/15 bg-[#1f1f1f] p-1 shadow-2xl"
          style={{ top: slash.top, left: slash.left }}
        >
          {filteredSlash.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={i === slash.index}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setSlash((prev) => ({ ...prev, index: i }))}
              onClick={() => runSlash(item)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left ${
                i === slash.index ? 'bg-eva-secondary/15 text-white' : 'text-gray-300'
              }`}
            >
              <span className="text-eva-secondary">{item.icon}</span>
              <span className="flex-1 text-sm">{item.label}</span>
              <span className="text-xs text-gray-500">{item.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
