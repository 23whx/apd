import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

export interface SourceEditorHandle {
  /** Insert text at the cursor (replacing any selection) as its own block. */
  insertBlock: (text: string) => void;
  focus: () => void;
}

interface SourceEditorProps {
  value: string;
  onChange: (value: string) => void;
  upload: (file: File) => Promise<string>;
  onUploadingChange?: (delta: number) => void;
}

const isMedia = (f: File) => f.type.startsWith('image/') || f.type.startsWith('video/');

/** Plain Markdown source editor (for HTML blocks and fine-grained Markdown), with paste/drop upload. */
export const SourceEditor = forwardRef<SourceEditorHandle, SourceEditorProps>(function SourceEditor(
  { value, onChange, upload, onUploadingChange },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  // Grow with the content so the page scrolls instead of a small inner box
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, window.innerHeight * 0.6)}px`;
  }, [value]);

  const insertBlock = useCallback(
    (text: string) => {
      const el = textareaRef.current;
      const current = valueRef.current;
      const start = el?.selectionStart ?? current.length;
      const end = el?.selectionEnd ?? current.length;
      const before = current.slice(0, start).replace(/\s*$/, '');
      const after = current.slice(end).replace(/^\s*/, '');
      const next = `${before}${before ? '\n\n' : ''}${text}\n\n${after}`;
      onChange(next);
      const caret = (before ? before.length + 2 : 0) + text.length + 2;
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(caret, caret);
      });
    },
    [onChange]
  );

  useImperativeHandle(ref, () => ({ insertBlock, focus: () => textareaRef.current?.focus() }), [insertBlock]);

  /** Insert a placeholder right away and replace it once the upload finishes, without clobbering typing. */
  const uploadFiles = (files: File[]) => {
    for (const file of files.filter(isMedia)) {
      const token = `<!-- 上传中 ${Date.now()}-${Math.random().toString(36).slice(2)} -->`;
      insertBlock(token);
      onUploadingChange?.(1);
      upload(file)
        .then((url) => {
          const md = file.type.startsWith('video/')
            ? `<video controls src="${url}" style="max-width: 100%;"></video>`
            : `![${file.name.replace(/\.[^.]+$/, '')}](${url})`;
          onChange(valueRef.current.replace(token, md));
        })
        .catch(() => onChange(valueRef.current.replace(`${token}\n\n`, '').replace(token, '')))
        .finally(() => onUploadingChange?.(-1));
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onPaste={(e) => {
        const files = Array.from(e.clipboardData?.files || []).filter(isMedia);
        if (files.length === 0) return;
        e.preventDefault();
        uploadFiles(files);
      }}
      onDrop={(e) => {
        const files = Array.from(e.dataTransfer?.files || []).filter(isMedia);
        if (files.length === 0) return;
        e.preventDefault();
        uploadFiles(files);
      }}
      onDragOver={(e) => e.preventDefault()}
      spellCheck={false}
      aria-label="文章正文 Markdown 源码"
      placeholder="Markdown 源码。可直接粘贴或拖入图片/视频。"
      className="w-full mt-6 bg-transparent text-gray-200 font-mono text-[15px] leading-7 focus:outline-none resize-none placeholder-gray-600"
    />
  );
});
