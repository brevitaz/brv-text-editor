// Lightweight markdown → HTML renderer covering common CommonMark constructs.
// Intentionally small: headings, emphasis, code, lists, blockquotes, links,
// images, hr, paragraphs. All input is HTML-escaped before formatting tokens
// are expanded so user-supplied markdown cannot inject arbitrary HTML.

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function inline(s) {
  // s is already HTML-escaped
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g,
    (_, alt, url) => `<img src="${url}" alt="${alt}" />`)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_, text, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`)
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  s = s.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  return s
}

const BLOCK_START = /^(#{1,6}\s|>\s?|[-*+]\s+|\d+\.\s+|```|---\s*$|\*\*\*\s*$|___\s*$)/

export function markdownToHtml(md) {
  if (!md) return ''
  const lines = String(md).replace(/\r\n/g, '\n').split('\n')
  const out = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (/^```/.test(line)) {
      const lang = line.slice(3).trim()
      const buf = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++ }
      i++
      out.push(`<pre><code${lang ? ` class="language-${escapeHtml(lang)}"` : ''}>${escapeHtml(buf.join('\n'))}</code></pre>`)
      continue
    }

    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) { out.push('<hr />'); i++; continue }

    const h = /^(#{1,6})\s+(.*)$/.exec(line)
    if (h) { out.push(`<h${h[1].length}>${inline(escapeHtml(h[2]))}</h${h[1].length}>`); i++; continue }

    if (/^>\s?/.test(line)) {
      const buf = []
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++ }
      out.push(`<blockquote>${markdownToHtml(buf.join('\n'))}</blockquote>`)
      continue
    }

    if (/^[-*+]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) { items.push(lines[i].replace(/^[-*+]\s+/, '')); i++ }
      out.push('<ul>' + items.map(it => `<li>${inline(escapeHtml(it))}</li>`).join('') + '</ul>')
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, '')); i++ }
      out.push('<ol>' + items.map(it => `<li>${inline(escapeHtml(it))}</li>`).join('') + '</ol>')
      continue
    }

    if (/^\s*$/.test(line)) { i++; continue }

    const buf = [line]
    i++
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !BLOCK_START.test(lines[i])) {
      buf.push(lines[i]); i++
    }
    out.push(`<p>${inline(escapeHtml(buf.join(' ')))}</p>`)
  }

  return out.join('\n')
}
