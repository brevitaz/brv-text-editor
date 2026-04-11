import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * SuggestionDropdown
 *
 * Renders the suggestion popup positioned near the cursor.
 * Supports keyboard navigation (ArrowUp/Down, Enter, Escape).
 *
 * Props:
 *   items          SuggestionItem[]         – current filtered items
 *   command        (item) => void           – call to insert the selected item
 *   clientRect     () => DOMRect | null     – positioning callback from @tiptap/suggestion
 *   loading        boolean                  – true while async items() is pending
 *   renderItem     (item, selected) => ReactNode  – optional per-row override
 *   renderList     ({ items, selectedIndex, command }) => ReactNode – optional full override
 */
const SuggestionDropdown = forwardRef((props, ref) => {
  const { items, command, clientRect, loading, renderItem, renderList } = props
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Reset selection when items change
  useEffect(() => setSelectedIndex(0), [items])

  // Expose keyboard handlers to the parent ReactRenderer so
  // createSuggestionPlugin can forward editor keydown events into the dropdown.
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex(i => (i + items.length - 1) % items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex(i => (i + 1) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        if (items[selectedIndex]) {
          command(items[selectedIndex])
        }
        return true
      }
      return false
    },
  }))

  // Position the dropdown below the cursor
  const rect = clientRect?.()
  if (!rect) return null

  const left = rect.left
  const top = rect.bottom + 6

  // Guard against NaN values (e.g. editor in a hidden container not yet laid out)
  if (!isFinite(left) || !isFinite(top)) return null

  // Fallback values are needed because the portal renders on document.body,
  // outside the .rte-root element where CSS variables are defined.
  const style = {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 200,
    background: 'var(--rte-surface, #ffffff)',
    border: '1px solid var(--rte-border, #cbd5e0)',
    borderRadius: 'var(--rte-radius-lg, 8px)',
    boxShadow: 'var(--rte-dropdown-shadow, 0 4px 20px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06))',
    maxHeight: 240,
    minWidth: 200,
    overflowY: 'auto',
    padding: '4px 0',
    fontFamily: "var(--rte-font-family, 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
    fontSize: 'var(--rte-font-size, 14px)',
  }

  // Render the dropdown content
  let content

  if (loading) {
    content = (
      <div style={{ padding: '8px 12px', color: 'var(--rte-text-muted, #718096)', fontSize: 13 }}>
        Loading...
      </div>
    )
  } else if (items.length === 0) {
    content = (
      <div style={{ padding: '8px 12px', color: 'var(--rte-text-muted, #718096)', fontSize: 13 }}>
        No results
      </div>
    )
  } else if (renderList) {
    content = renderList({ items, selectedIndex, command })
  } else {
    content = items.map((item, index) => {
      const isSelected = index === selectedIndex
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => command(item)}
          onMouseEnter={() => setSelectedIndex(index)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '8px 12px',
            border: 'none',
            background: isSelected
              ? 'var(--rte-suggestion-item-selected, var(--rte-color-primary-hover, #f0fbff))'
              : 'transparent',
            color: isSelected
              ? 'var(--rte-suggestion-color, var(--rte-color-primary, #065666))'
              : 'var(--rte-text, #1a202c)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            lineHeight: 1.4,
          }}
        >
          {renderItem ? renderItem(item, isSelected) : item.label}
        </button>
      )
    })
  }

  // document.body may not exist in SSR environments (Next.js, Gatsby, Remix).
  const portalTarget = typeof document !== 'undefined' ? document.body : null
  if (!portalTarget) return null

  return createPortal(
    <div className="rte-suggestion-dropdown" style={style}>
      {content}
    </div>,
    portalTarget,
  )
})

SuggestionDropdown.displayName = 'SuggestionDropdown'

export default SuggestionDropdown
