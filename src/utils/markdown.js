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

const BLOCK_START = /^(#{1,6}\s|>\s?|[-*+]\s+|\d+\.\s+|```|---\s*$|\*\*\*\s*$|___\s*$|\|)/

const TABLE_ALIGN_ROW = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/
const TABLE_ROW       = /^\s*\|.*\|\s*$/

function splitTableRow(line) {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|'))   s = s.slice(0, -1)
  return s.split('|').map(c => c.trim())
}

function alignmentsFromSeparator(line) {
  return splitTableRow(line).map(seg => {
    const left  = seg.startsWith(':')
    const right = seg.endsWith(':')
    if (left && right) return 'center'
    if (right)         return 'right'
    if (left)          return 'left'
    return null
  })
}

// Inline-only renderer for single-line contexts (e.g. titles). No block
// constructs — just the inline tokens (bold, italic, code, links, etc.).
export function markdownToInlineHtml(md) {
  return inline(escapeHtml(String(md ?? '')))
}

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

    // GFM table: header row, alignment row, then 1+ body rows
    if (TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_ALIGN_ROW.test(lines[i + 1])) {
      const headers = splitTableRow(line)
      const aligns  = alignmentsFromSeparator(lines[i + 1])
      i += 2
      const rows = []
      while (i < lines.length && TABLE_ROW.test(lines[i])) {
        rows.push(splitTableRow(lines[i]))
        i++
      }
      const styleFor = idx => aligns[idx] ? ` style="text-align:${aligns[idx]}"` : ''
      const thead = '<thead><tr>' +
        headers.map((h, idx) => `<th${styleFor(idx)}>${inline(escapeHtml(h))}</th>`).join('') +
        '</tr></thead>'
      const tbody = '<tbody>' +
        rows.map(r => '<tr>' +
          headers.map((_, idx) => `<td${styleFor(idx)}>${inline(escapeHtml(r[idx] ?? ''))}</td>`).join('') +
          '</tr>'
        ).join('') +
        '</tbody>'
      out.push(`<table>${thead}${tbody}</table>`)
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
