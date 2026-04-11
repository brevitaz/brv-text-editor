import { useState } from 'react'
import { RTE_THEMES } from './RichTextEditor'

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
 *   - Optional emoji reactions row
 *
 * Props
 * ─────
 * html           {string}   – Raw HTML string to display
 * variant        {string}   – 'default' | 'bare'. 'bare' removes the card border,
 *                             shadow, background and side padding so the content
 *                             renders flush inside any custom container (default: 'default')
 * showReactions  {boolean}  – Show emoji reactions (default: true)
 * reactions      {string[]} – Emoji list (default: ['👍','❤️','🎉','🙌'])
 * theme          {string}   – Built-in preset: 'unleashteams' | 'classic'
 * themeVars      {object}   – CSS variable overrides
 * onSuggestionClick {function} – (trigger, id, label) => void. When provided,
 *                                suggestion tokens become clickable in the preview.
 */
export default function RichTextPreview({
  html          = '',
  variant       = 'default',
  showReactions = true,
  reactions     = ['👍', '❤️', '🎉', '🙌'],
  theme         = 'unleashteams',
  themeVars     = {},
  onSuggestionClick,
}) {
  // Merge preset vars + instance overrides
  const presetVars   = RTE_THEMES[theme] ?? {}
  const resolvedVars = { ...presetVars, ...themeVars }
  const isBare       = variant === 'bare'

  const handleContentClick = (e) => {
    if (!onSuggestionClick) return
    const el = e.target.closest('.rte-suggestion')
    if (el) {
      const trigger = el.dataset.trigger
      const id = el.dataset.id
      // Skip elements missing data attributes (e.g. sanitized or hand-authored HTML)
      if (!trigger || !id) return
      const rawText = el.textContent
      // Strip the leading trigger character so label matches the original item label
      const label = rawText.startsWith(trigger) ? rawText.slice(trigger.length) : rawText
      onSuggestionClick(trigger, id, label)
    }
  }

  // Guard against null being passed explicitly (prop default only covers undefined)
  const safeHtml = html ?? ''

  return (
    <div
      className="rte-root"
      data-rte-theme={theme}
      data-rte-variant={variant}
      style={{
        width: '100%',
        ...(isBare ? {} : {
          maxWidth: 720,
          marginTop: 20,
          background: 'var(--rte-surface)',
          borderRadius: 'var(--rte-radius-lg)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          animation: 'rtp-slideDown 0.22s ease',
          border: '1px solid var(--rte-border)',
        }),
        ...resolvedVars,
      }}
    >
      {/* Content */}
      <div
        className={`rtp-content${onSuggestionClick ? ' rtp-suggestions-clickable' : ''}`}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
        onClick={handleContentClick}
        style={{ padding: isBare ? '0' : '14px 22px 20px' }}
      />

      {/* Emoji reactions */}
      {showReactions && reactions.length > 0 && (
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
