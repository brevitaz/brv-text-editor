import { useState } from 'react'
import { RTE_THEMES } from './RichTextEditor'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Naive HTML pretty-printer for the "HTML source" tab */
function formatHtml(html) {
  let indent = 0
  return html
    .replace(/></g, '>\n<')
    .split('\n')
    .map(line => {
      const closing   = line.match(/^<\//)
      const selfClose = line.match(/\/>$/) || line.match(/^<(br|hr|img|input)/)
      if (closing) indent = Math.max(0, indent - 2)
      const result = ' '.repeat(indent) + line.trim()
      if (!closing && !selfClose && line.match(/^<[^/]/)) indent += 2
      return result
    })
    .join('\n')
}

// ─── EmojiReaction ────────────────────────────────────────────────────────────

function EmojiReaction({ emoji }) {
  const [count, setCount]   = useState(0)
  const [active, setActive] = useState(false)

  const toggle = () => {
    setActive(v => !v)
    setCount(c => (active ? c - 1 : c + 1))
  }

  return (
    <button
      type="button"
      onClick={toggle}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 9px',
        borderRadius: 20,
        border: `1px solid ${active ? 'var(--rte-blockquote-border)' : 'var(--rte-border)'}`,
        background: active ? 'var(--rte-color-primary-hover)' : 'var(--rte-surface-toolbar)',
        cursor: 'pointer',
        fontSize: 14,
        fontFamily: 'var(--rte-font-family)',
        color: active ? 'var(--rte-color-primary)' : 'var(--rte-text-muted)',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.15s',
      }}
    >
      <span>{emoji}</span>
      {count > 0 && <span style={{ fontSize: 12 }}>{count}</span>}
    </button>
  )
}

// ─── RichTextPreview ──────────────────────────────────────────────────────────

/**
 * RichTextPreview
 *
 * Renders saved rich-text HTML in a card with:
 *   - Author header (avatar initials, name, timestamp)
 *   - Preview / HTML source tabs
 *   - Optional emoji reactions row
 *   - Dismiss button
 *
 * Props
 * ─────
 * html           {string}   – Raw HTML string to display
 * author         {object}   – { name, initials, avatarColor? }
 * timestamp      {string}   – Human-readable timestamp string
 * onDismiss      {function} – Called when × is clicked
 * showReactions  {boolean}  – Show emoji reactions (default: true)
 * reactions      {string[]} – Emoji list (default: ['👍','❤️','🎉','🙌'])
 * theme          {string}   – Built-in preset: 'unleashteams' | 'classic'
 * themeVars      {object}   – CSS variable overrides
 */
export default function RichTextPreview({
  html          = '',
  author        = { name: 'Anonymous', initials: 'A', avatarColor: '#065666' },
  timestamp     = '',
  onDismiss,
  showReactions = true,
  reactions     = ['👍', '❤️', '🎉', '🙌'],
  theme         = 'unleashteams',
  themeVars     = {},
}) {
  const [tab, setTab] = useState('preview')

  // Merge preset vars + instance overrides
  const presetVars   = RTE_THEMES[theme] ?? {}
  const resolvedVars = { ...presetVars, ...themeVars }

  const tabStyle = active => ({
    padding: '6px 14px',
    border: 'none',
    borderBottom: active ? '2px solid var(--rte-color-primary)' : '2px solid transparent',
    background: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'var(--rte-font-family)',
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--rte-color-primary)' : 'var(--rte-text-muted)',
    transition: 'color 0.15s, border-color 0.15s',
    marginBottom: -1,
  })

  return (
    <div
      className="rte-root"
      data-rte-theme={theme}
      style={{
        width: '100%',
        maxWidth: 720,
        marginTop: 20,
        background: 'var(--rte-surface)',
        borderRadius: 'var(--rte-radius-lg)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        animation: 'rtp-slideDown 0.22s ease',
        border: '1px solid var(--rte-border)',
        ...resolvedVars,
      }}
    >
      {/* Author header */}
      <div
        style={{
          padding: '14px 18px 0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: author.avatarColor ?? 'var(--rte-color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
              fontFamily: 'var(--rte-font-family)',
            }}
          >
            {author.initials}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rte-text)', lineHeight: 1.3, fontFamily: 'var(--rte-font-family)' }}>
              {author.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--rte-text-muted)', fontFamily: 'var(--rte-font-family)' }}>{timestamp}</div>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            title="Dismiss"
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--rte-btn-disabled-color)',
              fontSize: 20,
              lineHeight: 1,
              padding: '2px 4px',
              borderRadius: 'var(--rte-radius-sm)',
              transition: 'color 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--rte-text-muted)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--rte-btn-disabled-color)')}
          >
            ×
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          padding: '10px 18px 0',
          borderBottom: '1px solid var(--rte-border-toolbar)',
        }}
      >
        <button style={tabStyle(tab === 'preview')} onClick={() => setTab('preview')}>Preview</button>
        <button style={tabStyle(tab === 'source')}  onClick={() => setTab('source')}>HTML source</button>
      </div>

      {/* Tab content */}
      {tab === 'preview' ? (
        <div
          className="rtp-content"
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ padding: '18px 22px 20px' }}
        />
      ) : (
        <pre
          style={{
            margin: 0,
            padding: '16px 18px',
            fontSize: 12,
            fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: 'var(--rte-text-muted)',
            background: 'var(--rte-surface-subtle)',
            maxHeight: 320,
            overflowY: 'auto',
            lineHeight: 1.6,
          }}
        >
          {formatHtml(html)}
        </pre>
      )}

      {/* Emoji reactions */}
      {tab === 'preview' && showReactions && reactions.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px 14px',
            borderTop: '1px solid var(--rte-border-toolbar)',
          }}
        >
          {reactions.map(emoji => (
            <EmojiReaction key={emoji} emoji={emoji} />
          ))}
          <span style={{ marginLeft: 4, fontSize: 12, color: 'var(--rte-text-muted)', fontFamily: 'var(--rte-font-family)' }}>
            Add a reaction
          </span>
        </div>
      )}
    </div>
  )
}
