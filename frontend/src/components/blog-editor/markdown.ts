// Markdown <-> HTML conversion for the rich-text blog editor.
//
// Posts are stored as Markdown (rendered on the site by react-markdown + rehype-raw). The editor works on
// HTML, so content is converted on the way in (marked) and back on the way out (turndown).
// Block-level raw HTML (videos, article cards, …) has no rich-text equivalent: it is wrapped in a
// <div data-raw-html> placeholder on the way in, kept verbatim by the RawHtml node, and written back
// unchanged on the way out.
import { Marked, type Tokens } from 'marked';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const RAW_ATTR = 'data-raw-html';

const marked = new Marked({ gfm: true, breaks: false });

// CommonMark only treats an HTML line as a block when it is a lone open/close tag, so a one-line
// <video …></video> would otherwise become inline HTML inside a paragraph (and be dropped by the editor).
const MEDIA_BLOCK = /^<(video|iframe|audio)\b[\s\S]*?<\/\1>[^\n]*(?:\n|$)/;
marked.use({
  extensions: [
    {
      name: 'mediaBlock',
      level: 'block',
      start: (src: string) => src.match(/^<(?:video|iframe|audio)\b/m)?.index,
      tokenizer(src: string) {
        const m = MEDIA_BLOCK.exec(src);
        return m ? { type: 'mediaBlock', raw: m[0], text: m[0].trim() } : undefined;
      },
      renderer: (token) => `<div ${RAW_ATTR}="${encodeURIComponent(String(token.text))}"></div>\n`,
    },
  ],
});
marked.use({
  renderer: {
    html(token: Tokens.HTML | Tokens.Tag) {
      // Inline tags (<br>, <span>…) pass through; whole HTML blocks become opaque placeholders
      if (!token.block) return token.text;
      const html = token.text.trim();
      return html ? `<div ${RAW_ATTR}="${encodeURIComponent(html)}"></div>\n` : '';
    },
  },
});

export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown || '', { async: false });
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
  hr: '---',
  linkStyle: 'inlined',
  // Raw-HTML placeholders are empty <div>s, which turndown treats as blank before any rule runs
  blankReplacement: (_content, node) => {
    const el = node as HTMLElement;
    if (el.nodeName === 'DIV' && el.hasAttribute?.(RAW_ATTR)) {
      const html = decodeURIComponent(el.getAttribute(RAW_ATTR) || '').trim();
      return html ? `\n\n${html}\n\n` : '';
    }
    return (node as unknown as { isBlock?: boolean }).isBlock ? '\n\n' : '';
  },
});
turndown.use(gfm);

// GFM's canonical strikethrough is ~~double~~ (the plugin emits a single ~)
turndown.addRule('strikethrough', {
  filter: ['del', 's'],
  replacement: (content) => `~~${content}~~`,
});

// Images still uploading only exist in this browser (blob: URLs); never write them to the post
turndown.addRule('uploadingImage', {
  filter: (node) =>
    node.nodeName === 'IMG' &&
    ((node as HTMLElement).hasAttribute('data-upload-id') || ((node as HTMLElement).getAttribute('src') || '').startsWith('blob:')),
  replacement: () => '',
});

// Turndown's default list item uses "-   " (three spaces); use the common single-space form
turndown.addRule('listItem', {
  filter: 'li',
  replacement: (content, node) => {
    const parent = node.parentNode as HTMLElement | null;
    let prefix = '- ';
    if (parent?.nodeName === 'OL') {
      const start = Number(parent.getAttribute('start') || 1);
      prefix = `${start + Array.prototype.indexOf.call(parent.children, node)}. `;
    }
    const body = content
      .replace(/^\n+/, '')
      .replace(/\n+$/, '')
      .replace(/\n(?=.)/g, `\n${' '.repeat(prefix.length)}`);
    return prefix + body + (node.nextSibling ? '\n' : '');
  },
});

export function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  // Table cells hold <p> in the editor; Markdown table cells must be single-line
  doc.querySelectorAll('td > p, th > p').forEach((p) => {
    p.replaceWith(...Array.from(p.childNodes), doc.createTextNode(' '));
  });
  // The editor's <colgroup> stops the GFM plugin from recognising the header row
  doc.querySelectorAll('colgroup').forEach((c) => c.remove());
  // List items wrap their text in <p>; unwrapping a lone leading <p> keeps lists tight ("- a\n- b")
  doc.querySelectorAll('li > p:first-child').forEach((p) => {
    if (p.parentElement?.querySelectorAll(':scope > p').length === 1) p.replaceWith(...Array.from(p.childNodes));
  });
  return turndown.turndown(doc.body).trim() + '\n';
}

/** Plain text for word counts, from either the editor or raw Markdown. */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|-]/g, ' ');
}

/** Count CJK characters individually and other scripts by words, the way Chinese writing tools do. */
export function countWords(text: string): number {
  const cjk = text.match(/[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯]/g)?.length ?? 0;
  const words =
    text
      .replace(/[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯]/g, ' ')
      .match(/[A-Za-z0-9À-ɏ]+(?:['’-][A-Za-z0-9À-ɏ]+)*/g)?.length ?? 0;
  return cjk + words;
}

/** Rough reading time: ~400 CJK characters or ~200 words per minute. */
export function readingMinutes(text: string): number {
  const cjk = text.match(/[぀-ヿ㐀-䶿一-鿿]/g)?.length ?? 0;
  const words = countWords(text) - cjk;
  return Math.max(1, Math.round(cjk / 400 + words / 200));
}
