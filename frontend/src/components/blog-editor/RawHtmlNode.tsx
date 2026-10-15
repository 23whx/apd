import React, { useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { Code2, Trash2 } from 'lucide-react';

const RAW_ATTR = 'data-raw-html';

/**
 * A block of raw HTML (video, article card, custom embed) kept verbatim inside the rich-text editor.
 * See markdown.ts for how it round-trips through Markdown.
 */
export const RawHtml = Node.create({
  name: 'rawHtml',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      html: {
        default: '',
        parseHTML: (el) => decodeURIComponent(el.getAttribute(RAW_ATTR) || ''),
        renderHTML: (attrs) => ({ [RAW_ATTR]: encodeURIComponent(attrs.html || '') }),
      },
    };
  },

  parseHTML() {
    return [{ tag: `div[${RAW_ATTR}]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(RawHtmlView);
  },
});

const RawHtmlView: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const [editing, setEditing] = useState(false);
  const html: string = node.attrs.html || '';
  const kind = /<video/i.test(html) ? '视频' : /\/blog\//.test(html) ? '文章卡片' : 'HTML';

  return (
    <NodeViewWrapper
      className={`raw-html-block my-4 rounded-lg border ${selected ? 'border-eva-secondary' : 'border-white/10'} bg-black/20`}
      data-drag-handle
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 text-xs text-gray-500" contentEditable={false}>
        <span>{kind}</span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 hover:text-white"
            aria-pressed={editing}
          >
            <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
            {editing ? '完成' : '编辑 HTML'}
          </button>
          <button
            type="button"
            onClick={deleteNode}
            className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/20 hover:text-red-300"
            aria-label="删除这个块"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </span>
      </div>
      {editing ? (
        <textarea
          defaultValue={html}
          onBlur={(e) => updateAttributes({ html: e.target.value })}
          rows={Math.min(14, Math.max(3, html.split('\n').length + 1))}
          className="w-full bg-transparent p-3 font-mono text-xs text-gray-200 focus:outline-none resize-y"
          aria-label="HTML 源码"
          spellCheck={false}
        />
      ) : (
        // Admin-authored content, rendered the same way the public post page renders it (rehype-raw)
        <div className="p-3 pointer-events-none" contentEditable={false} dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </NodeViewWrapper>
  );
};
