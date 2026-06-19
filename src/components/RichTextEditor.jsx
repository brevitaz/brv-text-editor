import { useState, useRef, useEffect, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import Code from '@tiptap/extension-code'
import CodeBlock from '@tiptap/extension-code-block'
import Heading from '@tiptap/extension-heading'
import { BulletList, OrderedList, ListItem, TaskList, TaskItem } from '@tiptap/extension-list'
import Blockquote from '@tiptap/extension-blockquote'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import HardBreak from '@tiptap/extension-hard-break'
import { UndoRedo } from '@tiptap/extensions/undo-redo'
import { Placeholder } from '@tiptap/extensions/placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { TableKit } from '@tiptap/extension-table'
import Callout, { CALLOUT_TYPES } from '../extensions/Callout'
import SuggestionNode from '../extensions/suggestion/SuggestionNode'
import createSuggestionPlugin from '../extensions/suggestion/createSuggestionPlugin'
import { markdownToHtml, markdownToInlineHtml } from '../utils/markdown'

import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough,
  Code as CodeIcon,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Type,
  ChevronDown,
  MessageSquareWarning,
  Table as TableIcon,
  Maximize2,
  Minimize2,
} from 'lucide-react'

// ─── Default toolbar group config ──────────────────────────────────────────
/**
 * All available toolbar groups and their default enabled state.
 * Pass a partial object to override, e.g.:
 *   <RichTextEditor toolbar={{ callouts: false, alignment: false }} />
 */
export const DEFAULT_TOOLBAR = {
  headings:   true,
  formatting: true,
  alignment:  true,
  lists:      true,
  blocks:     true,
  callouts:   true,
  tables:     true,
  media:      true,
  history:    true,
  fullscreen: true,
}

// ─── Theme presets ──────────────────────────────────────────────────────────
/**
 * Built-in theme presets.  Pass the key as the `theme` prop, e.g.:
 *   <RichTextEditor theme="classic" />
 *
 * Or spread individual token overrides via `themeVars`, e.g.:
 *   <RichTextEditor themeVars={{ '--rte-color-primary': '#7c3aed' }} />
 */
export const RTE_THEMES = {
  /** Default — Teal palette */
  unleashteams: {},

  /** Warm earthy palette */
  classic: {
    '--rte-color-primary':       '#1a6b3c',
    '--rte-color-primary-hover': '#f0fdf4',
    '--rte-btn-active-bg':       '#e0ddd8',
    '--rte-btn-active-color':    '#1d1d1f',
    '--rte-color-link':          '#1569c7',
    '--rte-surface-toolbar':     '#faf9f7',
    '--rte-surface-subtle':      '#f0ede8',
    '--rte-border':              '#d8d5d0',
    '--rte-border-toolbar':      '#eceae6',
    '--rte-border-subtle':       '#ddd9d4',
    '--rte-text':                '#1d1d1f',
    '--rte-text-muted':          '#888888',
    '--rte-text-placeholder':    '#aaaaaa',
    '--rte-btn-hover-bg':        '#eceae6',
    '--rte-btn-disabled-color':  '#c5c2bc',
    '--rte-focus-border':        '#aac8f5',
    '--rte-focus-ring':          'rgba(90, 156, 248, 0.18)',
    '--rte-code-bg':             '#f0ede8',
    '--rte-code-color':          '#d04a4a',
    '--rte-blockquote-border':   '#c2c2bf',
    '--rte-blockquote-color':    '#6a6a6a',
    '--rte-selection-bg':        '#b3d4fc',
    '--rte-checkbox-accent':     '#1a6b3c',
    '--rte-hr-color':            '#e8e5e0',
    '--rte-font-family':         "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  },
}

/**
 * Helper to build a `themeVars` object.
 * Useful for type-hinted token overrides in TypeScript projects.
 *
 * @example
 * const purple = createTheme({ '--rte-color-primary': '#7c3aed' })
 * <RichTextEditor themeVars={purple} />
 */
export function createTheme(vars) {
  return vars
}

// ─── Tooltip ────────────────────────────────────────────────────────────────
function Tooltip({ text, children }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }} className="tooltip-wrapper">
      {children}
      <span
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a202c',
          color: '#fff',
          fontSize: '11px',
          padding: '3px 7px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.15s',
          zIndex: 100,
        }}
        className="tooltip-label"
      >
        {text}
      </span>
    </span>
  )
}

// ─── Toolbar Button ──────────────────────────────────────────────────────────
function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <Tooltip text={title}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 28,
          border: 'none',
          borderRadius: 'var(--rte-radius-sm)',
          background: active ? 'var(--rte-btn-active-bg)' : 'transparent',
          color: disabled
            ? 'var(--rte-btn-disabled-color)'
            : active
              ? 'var(--rte-btn-active-color)'
              : 'var(--rte-text)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: 0,
          transition: 'background 0.1s, color 0.1s',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          if (!disabled && !active) e.currentTarget.style.background = 'var(--rte-btn-hover-bg)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = active ? 'var(--rte-btn-active-bg)' : 'transparent'
        }}
      >
        {children}
      </button>
    </Tooltip>
  )
}

// ─── Toolbar Divider ─────────────────────────────────────────────────────────
function Divider() {
  return (
    <span
      style={{
        width: 1,
        height: 18,
        background: 'var(--rte-border-subtle)',
        margin: '0 4px',
        flexShrink: 0,
      }}
    />
  )
}

// ─── Link Dialog ─────────────────────────────────────────────────────────────
function LinkDialog({ onConfirm, onCancel, initialUrl = '' }) {
  const [url, setUrl] = useState(initialUrl)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleKeyDown = e => {
    if (e.key === 'Enter') onConfirm(url)
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        zIndex: 200,
        background: 'var(--rte-surface)',
        border: '1px solid var(--rte-border)',
        borderRadius: 'var(--rte-radius-lg)',
        boxShadow: 'var(--rte-dropdown-shadow)',
        padding: '12px 14px',
        minWidth: 300,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--rte-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Insert link
      </div>
      <input
        ref={inputRef}
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="https://example.com"
        style={{
          width: '100%',
          padding: '7px 10px',
          border: '1px solid var(--rte-border)',
          borderRadius: 'var(--rte-radius-sm)',
          fontSize: 13,
          fontFamily: 'var(--rte-font-family)',
          outline: 'none',
          marginBottom: 10,
          color: 'var(--rte-text)',
          background: 'var(--rte-surface)',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--rte-focus-border)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--rte-border)' }}
      />
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '5px 14px',
            border: '1px solid var(--rte-border)',
            borderRadius: 'var(--rte-radius-sm)',
            background: 'var(--rte-surface)',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'var(--rte-font-family)',
            color: 'var(--rte-text-muted)',
            fontWeight: 500,
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(url)}
          style={{
            padding: '5px 14px',
            border: 'none',
            borderRadius: 'var(--rte-radius-sm)',
            background: 'var(--rte-color-primary)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'var(--rte-font-family)',
            fontWeight: 600,
          }}
        >
          Insert
        </button>
      </div>
    </div>
  )
}

// ─── Image Dialog ─────────────────────────────────────────────────────────────
function ImageDialog({ onConfirm, onCancel }) {
  const [url, setUrl] = useState('')
  const [alt, setAlt] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleKeyDown = e => {
    if (e.key === 'Escape') onCancel()
  }

  const inputStyle = {
    width: '100%',
    padding: '7px 10px',
    border: '1px solid var(--rte-border)',
    borderRadius: 'var(--rte-radius-sm)',
    fontSize: 13,
    fontFamily: 'var(--rte-font-family)',
    outline: 'none',
    color: 'var(--rte-text)',
    background: 'var(--rte-surface)',
    transition: 'border-color 0.15s',
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        zIndex: 200,
        background: 'var(--rte-surface)',
        border: '1px solid var(--rte-border)',
        borderRadius: 'var(--rte-radius-lg)',
        boxShadow: 'var(--rte-dropdown-shadow)',
        padding: '12px 14px',
        minWidth: 300,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--rte-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Insert image
      </div>
      <input
        ref={inputRef}
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Image URL (https://...)"
        style={{ ...inputStyle, marginBottom: 8 }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--rte-focus-border)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--rte-border)' }}
      />
      <input
        value={alt}
        onChange={e => setAlt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Alt text (optional)"
        style={{ ...inputStyle, marginBottom: 10 }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--rte-focus-border)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--rte-border)' }}
      />
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '5px 14px',
            border: '1px solid var(--rte-border)',
            borderRadius: 'var(--rte-radius-sm)',
            background: 'var(--rte-surface)',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'var(--rte-font-family)',
            color: 'var(--rte-text-muted)',
            fontWeight: 500,
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => url && onConfirm(url, alt)}
          disabled={!url}
          style={{
            padding: '5px 14px',
            border: 'none',
            borderRadius: 'var(--rte-radius-sm)',
            background: url ? 'var(--rte-color-primary)' : 'var(--rte-btn-disabled-color)',
            color: '#fff',
            cursor: url ? 'pointer' : 'not-allowed',
            fontSize: 13,
            fontFamily: 'var(--rte-font-family)',
            fontWeight: 600,
          }}
        >
          Insert
        </button>
      </div>
    </div>
  )
}

// ─── Heading Dropdown ────────────────────────────────────────────────────────
function HeadingDropdown({ editor, onClose }) {
  const options = [
    { label: 'Normal text', action: () => editor.chain().focus().setParagraph().run(), active: editor.isActive('paragraph') },
    { label: 'Heading 1',   action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
    { label: 'Heading 2',   action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
    { label: 'Heading 3',   action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
  ]

  const sizes = ['14px', '20px', '17px', '15px']

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        zIndex: 200,
        background: 'var(--rte-surface)',
        border: '1px solid var(--rte-border)',
        borderRadius: 'var(--rte-radius-lg)',
        boxShadow: 'var(--rte-dropdown-shadow)',
        padding: '4px 0',
        minWidth: 180,
      }}
    >
      {options.map((opt, i) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => { opt.action(); onClose() }}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '7px 14px',
            border: 'none',
            background: opt.active ? 'var(--rte-btn-active-bg)' : 'transparent',
            cursor: 'pointer',
            fontSize: sizes[i],
            fontFamily: 'var(--rte-font-family)',
            fontWeight: i > 0 ? 700 : 400,
            color: opt.active ? 'var(--rte-btn-active-color)' : 'var(--rte-text)',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => { if (!opt.active) e.currentTarget.style.background = 'var(--rte-btn-hover-bg)' }}
          onMouseLeave={e => { e.currentTarget.style.background = opt.active ? 'var(--rte-btn-active-bg)' : 'transparent' }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Callout Dropdown ────────────────────────────────────────────────────────
function CalloutDropdown({ editor, onClose }) {
  const activeType = CALLOUT_TYPES.find(ct => editor.isActive('callout', { type: ct.key }))

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        zIndex: 200,
        background: 'var(--rte-surface)',
        border: '1px solid var(--rte-border)',
        borderRadius: 'var(--rte-radius-lg)',
        boxShadow: 'var(--rte-dropdown-shadow)',
        padding: '4px 0',
        minWidth: 180,
      }}
    >
      {CALLOUT_TYPES.map(ct => {
        const isActive = activeType?.key === ct.key
        return (
          <button
            key={ct.key}
            type="button"
            onClick={() => {
              editor.chain().focus().toggleCallout(ct.key).run()
              onClose()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              textAlign: 'left',
              padding: '8px 14px',
              border: 'none',
              background: isActive ? 'var(--rte-btn-active-bg)' : 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'var(--rte-font-family)',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--rte-btn-active-color)' : 'var(--rte-text)',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--rte-btn-hover-bg)' }}
            onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'var(--rte-btn-active-bg)' : 'transparent' }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: 4,
                background: ct.color + '18',
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {ct.icon}
            </span>
            <span>{ct.label}</span>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: ct.color,
                marginLeft: 'auto',
                flexShrink: 0,
              }}
            />
          </button>
        )
      })}

      {/* Remove callout option — only show when inside a callout */}
      {activeType && (
        <>
          <div style={{ height: 1, background: 'var(--rte-border-subtle)', margin: '4px 0' }} />
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetCallout().run()
              onClose()
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '8px 14px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'var(--rte-font-family)',
              fontWeight: 400,
              color: 'var(--rte-text-muted)',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--rte-btn-hover-bg)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            Remove callout
          </button>
        </>
      )}
    </div>
  )
}

// ─── Table Dropdown ──────────────────────────────────────────────────────────
const TABLE_GRID_COLS = 10
const TABLE_GRID_ROWS = 8
const TABLE_GRID_CELL = 18

function TableGridPicker({ editor, onClose }) {
  const [hover, setHover] = useState({ rows: 0, cols: 0 })

  const commit = (rows, cols) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    onClose()
  }

  const label = hover.rows && hover.cols
    ? `${hover.cols} × ${hover.rows}`
    : 'Insert table'

  return (
    <div style={{ padding: '8px 10px' }} onMouseLeave={() => setHover({ rows: 0, cols: 0 })}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${TABLE_GRID_COLS}, ${TABLE_GRID_CELL}px)`,
          gridAutoRows: `${TABLE_GRID_CELL}px`,
          gap: 3,
        }}
      >
        {Array.from({ length: TABLE_GRID_ROWS * TABLE_GRID_COLS }).map((_, i) => {
          const r = Math.floor(i / TABLE_GRID_COLS) + 1
          const c = (i % TABLE_GRID_COLS) + 1
          const active = r <= hover.rows && c <= hover.cols
          return (
            <div
              key={i}
              role="button"
              aria-label={`${c} × ${r}`}
              onMouseEnter={() => setHover({ rows: r, cols: c })}
              onClick={() => commit(r, c)}
              style={{
                width: TABLE_GRID_CELL,
                height: TABLE_GRID_CELL,
                borderRadius: 3,
                border: `1px solid ${active ? 'var(--rte-color-primary)' : 'var(--rte-border)'}`,
                background: active ? 'var(--rte-btn-active-bg)' : 'var(--rte-surface)',
                cursor: 'pointer',
                transition: 'background 0.05s, border-color 0.05s',
              }}
            />
          )
        })}
      </div>
      <div
        style={{
          marginTop: 8,
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--rte-text-muted)',
          fontFamily: 'var(--rte-font-family)',
          minHeight: 16,
        }}
      >
        {label}
      </div>
    </div>
  )
}

function TableDropdown({ editor, onClose }) {
  const inTable = editor.isActive('table')

  const item = (label, action, disabled = false) => (
    <button
      key={label}
      type="button"
      disabled={disabled}
      onClick={() => { action(); onClose() }}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '7px 14px',
        border: 'none',
        background: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13,
        fontFamily: 'var(--rte-font-family)',
        color: disabled ? 'var(--rte-btn-disabled-color)' : 'var(--rte-text)',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--rte-btn-hover-bg)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {label}
    </button>
  )

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        zIndex: 200,
        background: 'var(--rte-surface)',
        border: '1px solid var(--rte-border)',
        borderRadius: 'var(--rte-radius-lg)',
        boxShadow: 'var(--rte-dropdown-shadow)',
        padding: '4px 0',
        minWidth: 200,
      }}
    >
      {!inTable && <TableGridPicker editor={editor} onClose={onClose} />}
      {inTable && (
        <>
          {item('Add column before', () => editor.chain().focus().addColumnBefore().run())}
          {item('Add column after',  () => editor.chain().focus().addColumnAfter().run())}
          {item('Delete column',     () => editor.chain().focus().deleteColumn().run())}
          <div style={{ height: 1, background: 'var(--rte-border-subtle)', margin: '4px 0' }} />
          {item('Add row before', () => editor.chain().focus().addRowBefore().run())}
          {item('Add row after',  () => editor.chain().focus().addRowAfter().run())}
          {item('Delete row',     () => editor.chain().focus().deleteRow().run())}
          <div style={{ height: 1, background: 'var(--rte-border-subtle)', margin: '4px 0' }} />
          {item('Toggle header row',    () => editor.chain().focus().toggleHeaderRow().run())}
          {item('Toggle header column', () => editor.chain().focus().toggleHeaderColumn().run())}
          {item('Merge cells',  () => editor.chain().focus().mergeCells().run())}
          {item('Split cell',   () => editor.chain().focus().splitCell().run())}
          <div style={{ height: 1, background: 'var(--rte-border-subtle)', margin: '4px 0' }} />
          {item('Delete table', () => editor.chain().focus().deleteTable().run())}
        </>
      )}
    </div>
  )
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────
function Toolbar({ editor, groups, bare, fullscreen, onToggleFullscreen, onImageUpload, fileInputRef, uploadError, onFileSelect }) {
  const [showLinkDialog, setShowLinkDialog]     = useState(false)
  const [showImageDialog, setShowImageDialog]   = useState(false)
  const [showHeadingMenu, setShowHeadingMenu]   = useState(false)
  const [showCalloutMenu, setShowCalloutMenu]   = useState(false)
  const [showTableMenu, setShowTableMenu]       = useState(false)
  const toolbarRef = useRef(null)

  const closeAll = () => {
    setShowLinkDialog(false)
    setShowImageDialog(false)
    setShowHeadingMenu(false)
    setShowCalloutMenu(false)
    setShowTableMenu(false)
  }

  useEffect(() => {
    const handler = e => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        closeAll()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!editor) return null

  const getHeadingLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'H1'
    if (editor.isActive('heading', { level: 2 })) return 'H2'
    if (editor.isActive('heading', { level: 3 })) return 'H3'
    return <Type size={13} />
  }

  const handleLinkInsert = url => {
    if (!url) return
    const href = url.startsWith('http') ? url : `https://${url}`
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${href}">${href}</a>`).run()
    } else {
      editor.chain().focus().setLink({ href }).run()
    }
    setShowLinkDialog(false)
  }

  const handleImageInsert = (url, alt) => {
    editor.chain().focus().setImage({ src: url, alt: alt || '' }).run()
    setShowImageDialog(false)
  }

  const currentLink = editor.getAttributes('link').href || ''

  // Build visible section array with dividers between groups
  const sections = []
  let needsDivider = false

  const addSection = (key, content) => {
    if (!groups[key]) return
    if (needsDivider) sections.push(<Divider key={`div-${key}`} />)
    sections.push(content)
    needsDivider = true
  }

  // Headings
  addSection('headings', (
    <div key="headings" style={{ position: 'relative' }}>
      <Tooltip text="Text style">
        <button
          type="button"
          onClick={() => { setShowHeadingMenu(v => !v); setShowLinkDialog(false); setShowImageDialog(false); setShowCalloutMenu(false) }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            height: 28,
            padding: '0 8px',
            border: '1px solid var(--rte-border)',
            borderRadius: 'var(--rte-radius-sm)',
            background: showHeadingMenu ? 'var(--rte-btn-hover-bg)' : 'var(--rte-surface)',
            color: 'var(--rte-text)',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'var(--rte-font-family)',
            fontWeight: 600,
            minWidth: 52,
          }}
        >
          {getHeadingLabel()}
          <ChevronDown size={11} />
        </button>
      </Tooltip>
      {showHeadingMenu && (
        <HeadingDropdown editor={editor} onClose={() => setShowHeadingMenu(false)} />
      )}
    </div>
  ))

  // Formatting
  addSection('formatting', (
    <span key="formatting" style={{ display: 'inline-flex', gap: 2 }}>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()}      active={editor.isActive('bold')}      title="Bold (⌘B)"><BoldIcon size={13} strokeWidth={2.5} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()}    active={editor.isActive('italic')}    title="Italic (⌘I)"><ItalicIcon size={13} strokeWidth={2.5} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (⌘U)"><UnderlineIcon size={13} strokeWidth={2.5} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()}    active={editor.isActive('strike')}    title="Strikethrough"><Strikethrough size={13} strokeWidth={2.5} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()}      active={editor.isActive('code')}      title="Inline code"><CodeIcon size={13} strokeWidth={2.5} /></ToolbarButton>
    </span>
  ))

  // Alignment
  addSection('alignment', (
    <span key="alignment" style={{ display: 'inline-flex', gap: 2 }}>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()}   active={editor.isActive({ textAlign: 'left' })}   title="Align left"><AlignLeft size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center"><AlignCenter size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()}  active={editor.isActive({ textAlign: 'right' })}  title="Align right"><AlignRight size={13} /></ToolbarButton>
    </span>
  ))

  // Lists
  addSection('lists', (
    <span key="lists" style={{ display: 'inline-flex', gap: 2 }}>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive('bulletList')}  title="Bullet list"><List size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list"><ListOrdered size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()}    active={editor.isActive('taskList')}    title="Task list"><ListChecks size={13} /></ToolbarButton>
    </span>
  ))

  // Blocks
  addSection('blocks', (
    <span key="blocks" style={{ display: 'inline-flex', gap: 2 }}>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()}  active={editor.isActive('codeBlock')}  title="Code block">
        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, lineHeight: 1, color: 'inherit' }}>{'<>'}</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule"><Minus size={13} /></ToolbarButton>
    </span>
  ))

  // Callouts
  addSection('callouts', (
    <div key="callouts" style={{ position: 'relative' }}>
      <Tooltip text="Callout block">
        <button
          type="button"
          onClick={() => { setShowCalloutMenu(v => !v); setShowLinkDialog(false); setShowImageDialog(false); setShowHeadingMenu(false) }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            height: 28,
            padding: '0 8px',
            border: '1px solid var(--rte-border)',
            borderRadius: 'var(--rte-radius-sm)',
            background: showCalloutMenu || editor.isActive('callout') ? 'var(--rte-btn-hover-bg)' : 'var(--rte-surface)',
            color: editor.isActive('callout') ? 'var(--rte-btn-active-color)' : 'var(--rte-text)',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'var(--rte-font-family)',
            fontWeight: 600,
            minWidth: 36,
          }}
        >
          <MessageSquareWarning size={14} />
          <ChevronDown size={11} />
        </button>
      </Tooltip>
      {showCalloutMenu && (
        <CalloutDropdown editor={editor} onClose={() => setShowCalloutMenu(false)} />
      )}
    </div>
  ))

  // Tables
  addSection('tables', (
    <div key="tables" style={{ position: 'relative' }}>
      <Tooltip text="Table">
        <button
          type="button"
          onClick={() => { setShowTableMenu(v => !v); setShowLinkDialog(false); setShowImageDialog(false); setShowHeadingMenu(false); setShowCalloutMenu(false) }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            height: 28,
            padding: '0 8px',
            border: '1px solid var(--rte-border)',
            borderRadius: 'var(--rte-radius-sm)',
            background: showTableMenu || editor.isActive('table') ? 'var(--rte-btn-hover-bg)' : 'var(--rte-surface)',
            color: editor.isActive('table') ? 'var(--rte-btn-active-color)' : 'var(--rte-text)',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'var(--rte-font-family)',
            fontWeight: 600,
            minWidth: 36,
          }}
        >
          <TableIcon size={13} />
          <ChevronDown size={11} />
        </button>
      </Tooltip>
      {showTableMenu && (
        <TableDropdown editor={editor} onClose={() => setShowTableMenu(false)} />
      )}
    </div>
  ))

  // Media (links + images)
  addSection('media', (
    <span key="media" style={{ display: 'inline-flex', gap: 2 }}>
      <div style={{ position: 'relative' }}>
        <ToolbarButton
          onClick={() => { setShowLinkDialog(v => !v); setShowImageDialog(false); setShowHeadingMenu(false); setShowCalloutMenu(false) }}
          active={editor.isActive('link') || showLinkDialog}
          title="Insert link"
        >
          <LinkIcon size={13} />
        </ToolbarButton>
        {showLinkDialog && (
          <LinkDialog onConfirm={handleLinkInsert} onCancel={() => setShowLinkDialog(false)} initialUrl={currentLink} />
        )}
      </div>
      <div style={{ position: 'relative' }}>
        {onImageUpload ? (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileSelect} />
            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              title="Insert image from file"
            >
              <ImageIcon size={13} />
            </ToolbarButton>
            {uploadError && (
              <span style={{ position:'absolute',top:'100%',left:0,zIndex:201,background:'var(--rte-surface)',border:'1px solid var(--rte-border)',borderRadius:'var(--rte-radius-sm)',padding:'4px 8px',fontSize:11,color:'var(--rte-code-color)',whiteSpace:'nowrap',marginTop:4 }}>{uploadError}</span>
            )}
          </>
        ) : (
          <>
            <ToolbarButton
              onClick={() => { setShowImageDialog(v => !v); setShowLinkDialog(false); setShowHeadingMenu(false); setShowCalloutMenu(false) }}
              active={showImageDialog}
              title="Insert image"
            >
              <ImageIcon size={13} />
            </ToolbarButton>
            {showImageDialog && (
              <ImageDialog onConfirm={handleImageInsert} onCancel={() => setShowImageDialog(false)} />
            )}
          </>
        )}
      </div>
    </span>
  ))

  // History
  addSection('history', (
    <span key="history" style={{ display: 'inline-flex', gap: 2 }}>
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (⌘Z)"><Undo size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (⌘⇧Z)"><Redo size={13} /></ToolbarButton>
    </span>
  ))

  // Fullscreen
  if (groups.fullscreen && onToggleFullscreen) {
    if (needsDivider) sections.push(<Divider key="div-fullscreen" />)
    sections.push(
      <span key="fullscreen" style={{ display: 'inline-flex', gap: 2, marginLeft: 'auto' }}>
        <ToolbarButton
          onClick={onToggleFullscreen}
          active={fullscreen}
          title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
        >
          {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </ToolbarButton>
      </span>
    )
    needsDivider = false
  }

  return (
    <div
      ref={toolbarRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        padding: '5px 10px',
        borderBottom: '1px solid var(--rte-border-toolbar)',
        background: 'var(--rte-surface-toolbar)',
        borderRadius: bare ? 0 : 'calc(var(--rte-radius) - 1px) calc(var(--rte-radius) - 1px) 0 0',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {sections}
    </div>
  )
}

// ─── Editor Footer ───────────────────────────────────────────────────────────
function EditorFooter({ editor, onSubmit, onCancel, submitLabel, showActions, bare }) {
  if (!editor) return null
  const text       = editor.getText()
  const wordCount  = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount  = text.length

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 12px',
        borderTop: '1px solid var(--rte-border-toolbar)',
        background: 'var(--rte-surface-toolbar)',
        borderRadius: bare ? 0 : '0 0 calc(var(--rte-radius) - 1px) calc(var(--rte-radius) - 1px)',
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--rte-text-muted)', fontFamily: 'var(--rte-font-family)' }}>
        {wordCount} word{wordCount !== 1 ? 's' : ''} · {charCount} char{charCount !== 1 ? 's' : ''}
      </span>
      {showActions && (
        <div style={{ display: 'flex', gap: 6 }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '5px 14px',
                border: '1px solid var(--rte-border)',
                borderRadius: 'var(--rte-radius-sm)',
                background: 'var(--rte-surface)',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'var(--rte-font-family)',
                color: 'var(--rte-text-muted)',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
          )}
          {onSubmit && (
            <button
              type="button"
              onClick={() => onSubmit(editor.getHTML())}
              style={{
                padding: '5px 16px',
                border: 'none',
                borderRadius: 'var(--rte-radius-sm)',
                background: 'var(--rte-color-primary)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'var(--rte-font-family)',
                fontWeight: 600,
              }}
            >
              {submitLabel || 'Save'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Plain Text (markdown) Editor ────────────────────────────────────────────
function PlainTextEditor({
  initialContent, placeholder, onChange, onSubmit, onCancel, submitLabel,
  showActions, minHeight, maxHeight, autofocus, className,
  isBare, theme, variant, resolvedVars, inputMode, preview,
  enableFullscreen,
}) {
  const [value, setValue] = useState(initialContent ?? '')
  const [fullscreen, setFullscreen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!fullscreen) return
    const onKey = e => { if (e.key === 'Escape') setFullscreen(false) }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [fullscreen])

  useEffect(() => {
    if (autofocus) ref.current?.focus()
  }, [autofocus])

  const handleChange = e => {
    const v = e.target.value
    setValue(v)
    onChange?.(v)
  }

  // ── Markdown editing affordances (textarea only) ────────────────────────────
  // Use document.execCommand('insertText') when available so changes go through
  // the browser's native undo stack. Fall back to setRangeText otherwise.
  const insertText = (el, str) => {
    el.focus()
    if (document.execCommand && document.execCommand('insertText', false, str)) return
    const start = el.selectionStart
    const end   = el.selectionEnd
    el.setRangeText(str, start, end, 'end')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }

  // Toggle a symmetric wrapper around the selection. If the selection is
  // already wrapped (either inside or including the markers), unwrap. Otherwise
  // wrap. Used for **bold**, *italic*, `code`, etc.
  const toggleWrap = (el, marker) => {
    el.focus()
    const v   = el.value
    const len = marker.length
    const start = el.selectionStart
    const end   = el.selectionEnd
    const sel   = v.slice(start, end)

    // Selection includes the markers on both sides — strip them
    if (sel.length >= 2 * len && sel.startsWith(marker) && sel.endsWith(marker)) {
      const inner = sel.slice(len, -len)
      insertText(el, inner)
      requestAnimationFrame(() => {
        el.selectionStart = start
        el.selectionEnd   = start + inner.length
      })
      return
    }

    // Selection is the inner text, markers sit immediately outside — strip them
    if (start >= len && end + len <= v.length &&
        v.slice(start - len, start) === marker &&
        v.slice(end, end + len) === marker) {
      el.selectionStart = start - len
      el.selectionEnd   = end + len
      insertText(el, sel)
      requestAnimationFrame(() => {
        el.selectionStart = start - len
        el.selectionEnd   = start - len + sel.length
      })
      return
    }

    // Otherwise wrap
    insertText(el, marker + sel + marker)
    requestAnimationFrame(() => {
      el.selectionStart = start + len
      el.selectionEnd   = start + len + sel.length
    })
  }

  const URL_RE = /^(https?:\/\/|mailto:|tel:)\S+$/i

  const handleKeyDown = e => {
    const el = e.currentTarget
    const meta = e.metaKey || e.ctrlKey

    // Wrap shortcuts work for both textarea and input
    if (meta && !e.altKey) {
      const key = e.key.toLowerCase()
      if (key === 'b') { e.preventDefault(); toggleWrap(el, '**'); return }
      if (key === 'i') { e.preventDefault(); toggleWrap(el, '*');  return }
      if (key === 'e') { e.preventDefault(); toggleWrap(el, '`');  return }
      if (key === 'k') {
        e.preventDefault()
        const start = el.selectionStart, end = el.selectionEnd
        const sel = el.value.slice(start, end) || 'text'
        insertText(el, `[${sel}](url)`)
        requestAnimationFrame(() => {
          // Select the "url" placeholder so the user can immediately paste/type
          const urlStart = start + sel.length + 3 // [sel](
          el.selectionStart = urlStart
          el.selectionEnd   = urlStart + 3
        })
        return
      }
    }

    // List-aware Enter / Tab handling only makes sense in multi-line textareas.
    if (isInput) return

    if (e.key === 'Enter' && !e.shiftKey && !meta) {
      const v = el.value
      const start = el.selectionStart
      const lineStart = v.lastIndexOf('\n', start - 1) + 1
      const line = v.slice(lineStart, start)
      // Match list markers: "- ", "* ", "+ ", "- [ ] ", "1. ", with optional leading indent
      const m = /^(\s*)([-*+]|\d+\.)\s(\[[ xX]\]\s)?/.exec(line)
      if (m) {
        const [, indent, marker, task] = m
        const rest = line.slice(m[0].length)
        // Empty list item → exit the list (delete the marker)
        if (rest.length === 0) {
          e.preventDefault()
          el.selectionStart = lineStart
          el.selectionEnd   = start
          insertText(el, '')
          return
        }
        e.preventDefault()
        const nextMarker = /^\d+\./.test(marker)
          ? `${parseInt(marker, 10) + 1}.`
          : marker
        insertText(el, `\n${indent}${nextMarker} ${task ? '[ ] ' : ''}`)
        return
      }
    }

    if (e.key === 'Tab') {
      const v = el.value
      const start = el.selectionStart
      const lineStart = v.lastIndexOf('\n', start - 1) + 1
      const line = v.slice(lineStart, v.indexOf('\n', start) === -1 ? v.length : v.indexOf('\n', start))
      const inList = /^\s*([-*+]|\d+\.)\s/.test(line)
      if (inList) {
        e.preventDefault()
        if (e.shiftKey) {
          if (v.slice(lineStart, lineStart + 2) === '  ') {
            el.selectionStart = lineStart
            el.selectionEnd   = lineStart + 2
            insertText(el, '')
            // Restore caret roughly where it was
            requestAnimationFrame(() => {
              el.selectionStart = el.selectionEnd = Math.max(lineStart, start - 2)
            })
          }
        } else {
          el.selectionStart = el.selectionEnd = lineStart
          insertText(el, '  ')
          requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = start + 2
          })
        }
        return
      }
    }
  }

  const handlePaste = e => {
    const el = e.currentTarget
    const start = el.selectionStart
    const end   = el.selectionEnd
    if (start === end) return // no selection → default paste
    const pasted = e.clipboardData?.getData('text/plain') ?? ''
    if (!URL_RE.test(pasted.trim())) return
    e.preventDefault()
    const sel = el.value.slice(start, end)
    insertText(el, `[${sel}](${pasted.trim()})`)
  }

  const text = value ?? ''
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length

  const isInput = inputMode === 'input'
  const Field = isInput ? 'input' : 'textarea'
  const previewMode = preview || 'none'
  const renderedHtml = useMemo(
    () => isInput ? markdownToInlineHtml(value) : markdownToHtml(value),
    [value, isInput]
  )

  // In `bare` variant, hand styling control to the consumer's wrapper class.
  // We only emit structural props (sizing, resize behaviour) — no padding,
  // typography, or surface colors.
  const fieldStyle = isBare
    ? {
        width: '100%',
        boxSizing: 'border-box',
        border: 'none',
        outline: 'none',
        resize: isInput ? undefined : 'vertical',
        background: 'transparent',
        minHeight: isInput ? undefined : minHeight,
        maxHeight: isInput
          ? undefined
          : (maxHeight === null || maxHeight === 0
              ? undefined
              : typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight),
        flex: '1 1 auto',
        overflow: 'auto',
      }
    : {
        width: '100%',
        boxSizing: 'border-box',
        border: 'none',
        outline: 'none',
        resize: isInput ? undefined : 'vertical',
        padding: '12px 16px',
        fontFamily: 'var(--rte-font-family)',
        fontSize: 14,
        lineHeight: 1.6,
        color: 'var(--rte-text)',
        background: 'transparent',
        minHeight: isInput ? undefined : minHeight,
        maxHeight: isInput
          ? undefined
          : (maxHeight === null || maxHeight === 0
              ? undefined
              : typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight),
        flex: '1 1 auto',
        overflow: 'auto',
      }

  const previewPaneStyleSplit = isBare
    ? {
        flex: '1 1 50%',
        display: isInput ? 'flex' : undefined,
        alignItems: isInput ? 'center' : undefined,
        overflow: 'auto',
        minWidth: 0,
        minHeight: isInput ? undefined : minHeight,
        maxHeight: isInput
          ? undefined
          : (maxHeight === null || maxHeight === 0
              ? undefined
              : typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight),
      }
    : {
        flex: '1 1 50%',
        padding: '12px 16px',
        display: isInput ? 'flex' : undefined,
        alignItems: isInput ? 'center' : undefined,
        overflow: 'auto',
        minWidth: 0,
        minHeight: isInput ? undefined : minHeight,
        maxHeight: isInput
          ? undefined
          : (maxHeight === null || maxHeight === 0
              ? undefined
              : typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight),
        background: 'var(--rte-surface-subtle)',
      }

  const previewPaneStyleInline = isBare
    ? {
        overflow: 'auto',
        maxHeight: isInput
          ? undefined
          : (maxHeight === null || maxHeight === 0
              ? undefined
              : typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight),
      }
    : {
        padding: isInput ? '8px 16px' : '12px 16px',
        borderTop: '1px solid var(--rte-border-subtle)',
        background: 'var(--rte-surface-subtle)',
        overflow: 'auto',
        maxHeight: isInput
          ? undefined
          : (maxHeight === null || maxHeight === 0
              ? undefined
              : typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight),
      }

  const fsStyle = fullscreen
    ? { position: 'fixed', inset: 0, zIndex: 9999, borderRadius: 0, border: 'none' }
    : null

  return (
    <div
      className={`rte-root editor-wrapper${fullscreen ? ' rte-fullscreen' : ''} ${className}`.trim()}
      data-rte-theme={theme}
      data-rte-variant={variant}
      data-rte-format="markdown"
      style={{
        ...(isBare && !fullscreen ? {} : {
          border: '1px solid var(--rte-border)',
          borderRadius: 'var(--rte-radius)',
          background: 'var(--rte-surface)',
          overflow: 'hidden',
          transition: 'box-shadow 0.15s, border-color 0.15s',
        }),
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        ...resolvedVars,
        ...fsStyle,
      }}
    >
      {enableFullscreen && (
        <button
          type="button"
          onClick={() => setFullscreen(v => !v)}
          title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 1,
            width: 26,
            height: 26,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--rte-border)',
            borderRadius: 'var(--rte-radius-sm)',
            background: 'var(--rte-surface)',
            color: 'var(--rte-text-muted)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      )}
      {previewMode === 'split' ? (
        <div style={{ display: 'flex', flex: '1 1 auto', minHeight: 0, alignItems: isInput ? 'stretch' : undefined }}>
          <div style={{ flex: '1 1 50%', display: 'flex', borderRight: '1px solid var(--rte-border-subtle)', minWidth: 0 }}>
            <Field
              ref={ref}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder}
              rows={isInput ? undefined : 6}
              style={fieldStyle}
            />
          </div>
          <div
            className="rtp-content"
            dangerouslySetInnerHTML={{ __html: renderedHtml || '<span style="color:var(--rte-text-placeholder)">Preview</span>' }}
            style={previewPaneStyleSplit}
          />
        </div>
      ) : (
        <>
          <Field
            ref={ref}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            rows={isInput ? undefined : 6}
            style={fieldStyle}
          />
          {previewMode === 'inline' && (
            <div
              className="rtp-content"
              dangerouslySetInnerHTML={{ __html: renderedHtml || '<span style="color:var(--rte-text-placeholder)">Preview</span>' }}
              style={previewPaneStyleInline}
            />
          )}
        </>
      )}
      {showActions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 12px',
            borderTop: '1px solid var(--rte-border-toolbar)',
            background: 'var(--rte-surface-toolbar)',
            borderRadius: isBare ? 0 : '0 0 calc(var(--rte-radius) - 1px) calc(var(--rte-radius) - 1px)',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--rte-text-muted)', fontFamily: 'var(--rte-font-family)' }}>
            {wordCount} word{wordCount !== 1 ? 's' : ''} · {charCount} char{charCount !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '5px 14px',
                  border: '1px solid var(--rte-border)',
                  borderRadius: 'var(--rte-radius-sm)',
                  background: 'var(--rte-surface)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'var(--rte-font-family)',
                  color: 'var(--rte-text-muted)',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
            )}
            {onSubmit && (
              <button
                type="button"
                onClick={() => onSubmit(value)}
                style={{
                  padding: '5px 16px',
                  border: 'none',
                  borderRadius: 'var(--rte-radius-sm)',
                  background: 'var(--rte-color-primary)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'var(--rte-font-family)',
                  fontWeight: 600,
                }}
              >
                {submitLabel || 'Save'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * RichTextEditor
 *
 * Props
 * ─────
 * initialContent  string   – Initial HTML content
 * placeholder     string   – Placeholder text
 * onChange        fn       – Called with HTML on every change
 * onSubmit        fn       – Called with HTML when Save is clicked
 * onCancel        fn       – Called when Cancel is clicked
 * submitLabel     string   – Label for Save button (default: 'Save')
 * showActions     boolean  – Show the footer action buttons (default: true)
 * minHeight       number   – Minimum editor content height in px (default: 140)
 * maxHeight       number|string|null
 *                          – Maximum editor content height. Number is treated
 *                            as px, strings are passed through as a CSS value
 *                            (e.g. '60vh', '32rem'). Pass `null` or `0` to
 *                            disable the cap and let the editor grow freely.
 *                            When set, the toolbar and footer stay pinned while
 *                            the content area scrolls (default: 420)
 * autofocus       boolean  – Autofocus on mount (default: false)
 * className       string   – Extra class applied to the outermost wrapper
 * variant         string   – 'default' | 'bare'. 'bare' removes the outer border,
 *                            border-radius and background so the editor embeds flush
 *                            inside any custom container (default: 'default')
 * theme           string   – Built-in preset: 'unleashteams' | 'classic'
 * themeVars       object   – CSS variable overrides, e.g. { '--rte-color-primary': '#7c3aed' }
 * toolbar         object   – Toggle toolbar groups. Keys: headings, formatting, alignment,
 *                            lists, blocks, callouts, media, history  (default: all true)
 * triggers       array    – Suggestion trigger configs. Each entry:
 *                            { char, items, onSelect?, minChars?, debounce?,
 *                              renderItem?, renderList? }
 * onImageUpload  fn       – Consumer-supplied upload handler. When provided,
 *                            the image toolbar button opens a native file picker
 *                            instead of the URL dialog. Called with the selected
 *                            File; must return Promise<{ url, attachmentId? }>.
 *                            Paste and drop handlers also invoke this callback.
 *                            On resolve the editor inserts <img src={url}
 *                            data-attachment-id={attachmentId}>. On reject it
 *                            surfaces the error and removes any placeholder.
 */
export default function RichTextEditor({
  initialContent = '',
  placeholder    = 'Write something…',
  onChange,
  onSubmit,
  onCancel,
  submitLabel    = 'Save',
  showActions    = true,
  minHeight      = 140,
  maxHeight      = 420,
  autofocus      = false,
  className      = '',
  variant        = 'default',
  theme          = 'unleashteams',
  themeVars      = {},
  toolbar        = {},
  triggers,
  format         = 'html',
  inputMode      = 'textarea',
  preview        = 'none',
  onImageUpload,
}) {
  const presetVars   = RTE_THEMES[theme] ?? {}
  const resolvedVars = { ...presetVars, ...themeVars }
  const isBare = variant === 'bare'

  if (format === 'markdown') {
    const mdToolbar = { ...DEFAULT_TOOLBAR, ...toolbar }
    return (
      <PlainTextEditor
        initialContent={initialContent}
        placeholder={placeholder}
        onChange={onChange}
        onSubmit={onSubmit}
        onCancel={onCancel}
        submitLabel={submitLabel}
        showActions={showActions}
        minHeight={minHeight}
        maxHeight={maxHeight}
        autofocus={autofocus}
        className={className}
        isBare={isBare}
        theme={theme}
        variant={variant}
        resolvedVars={resolvedVars}
        inputMode={inputMode}
        preview={preview}
        enableFullscreen={mdToolbar.fullscreen && inputMode !== 'input'}
      />
    )
  }

  // Resolve toolbar groups — merge defaults with consumer overrides
  const resolvedToolbar = useMemo(
    () => ({ ...DEFAULT_TOOLBAR, ...toolbar }),
    [toolbar]
  )

  // Keep latest triggers accessible in the extensions memo without making every
  // inline array literal cause a rebuild. The extensions only need to rebuild
  // when the set of trigger characters changes.
  const triggersRef = useRef(triggers)
  triggersRef.current = triggers
  const triggersKey = triggers?.map(t => t?.char).join(',') ?? ''

  // Build extensions list based on which toolbar groups are enabled.
  // Core extensions (Document, Paragraph, Text, HardBreak) are always loaded
  // so the editor can function even with everything toggled off.
  const extensions = useMemo(() => {
    const exts = [
      Document,
      Paragraph,
      Text,
      HardBreak,
      Placeholder.configure({ placeholder }),
    ]

    // Headings
    if (resolvedToolbar.headings) {
      exts.push(Heading.configure({ levels: [1, 2, 3] }))
    }

    // Formatting  — always load these since they're core inline marks,
    // but the toolbar buttons will be hidden.  This keeps keyboard shortcuts
    // and pasted content working even when toolbar is hidden.
    exts.push(Bold, Italic, Underline, Strike, Code)

    // Alignment
    if (resolvedToolbar.alignment) {
      exts.push(TextAlign.configure({ types: ['heading', 'paragraph'] }))
    }

    // Lists
    if (resolvedToolbar.lists) {
      exts.push(BulletList, OrderedList, ListItem, TaskList, TaskItem.configure({ nested: true }))
    }

    // Blocks
    if (resolvedToolbar.blocks) {
      exts.push(Blockquote, CodeBlock, HorizontalRule)
    }

    // Callouts
    if (resolvedToolbar.callouts) {
      exts.push(Callout)
    }

    // Tables
    if (resolvedToolbar.tables) {
      exts.push(TableKit.configure({ table: { resizable: true } }))
    }

    // Media
    if (resolvedToolbar.media) {
      exts.push(
        Image,
        Link.configure({
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        }),
      )
    }

    // History (renamed to UndoRedo in v3)
    if (resolvedToolbar.history) {
      exts.push(UndoRedo)
    }

    // Suggestion triggers (@mentions, #hashtags, etc.)
    if (triggersRef.current?.length) {
      exts.push(SuggestionNode)
      triggersRef.current.forEach((t, i) => {
        if (!t || typeof t !== 'object') {
          console.error(`[brv-text-editor] triggers[${i}] must be an object, got ${typeof t}`)
          return
        }
        if (typeof t.char !== 'string' || t.char.length === 0) {
          console.error(`[brv-text-editor] triggers[${i}].char must be a non-empty string, got ${JSON.stringify(t.char)}`)
          return
        }
        if (typeof t.items !== 'function') {
          console.error(`[brv-text-editor] triggers[${i}].items must be a function, got ${typeof t.items}`)
          return
        }
        exts.push(createSuggestionPlugin(t))
      })
    }

    return exts
    // triggersKey (not triggers) is used so inline array literals don't rebuild
    // extensions on every render. Extensions rebuild only when the set of trigger
    // characters changes. If you need to swap items() without changing chars,
    // wrap triggers in useMemo in the consumer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedToolbar, placeholder, triggersKey])

  const editor = useEditor({
    extensions,
    content: initialContent,
    autofocus,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML())
    },
  })

  const [fullscreen, setFullscreen] = useState(false)

  // Image upload state and handlers live here (not in Toolbar) so that
  // paste/drop on the editor content div can reference them in scope
  const fileInputRef = useRef(null)
  const uploadErrorTimeoutRef = useRef(null)
  const [uploadError, setUploadError] = useState(null)

  // Cleanup error timeout on unmount
  useEffect(() => {
    return () => {
      if (uploadErrorTimeoutRef.current) {
        clearTimeout(uploadErrorTimeoutRef.current)
      }
    }
  }, [])

  const handleImageUploadStart = (file) => {
    if (!onImageUpload) return Promise.reject(new Error('No upload handler'))
    setUploadError(null)

    return onImageUpload(file)
      .then(({ url }) => {
        const filename = file.name || 'image'
        editor.chain().focus()
          .setImage({ src: url, alt: filename })
          .insertContent(` <a href="${url}" target="_blank" rel="noopener noreferrer">${filename}</a>`)
          .run()
      })
      .catch((err) => {
        setUploadError(err?.message || 'Image upload failed')
        if (uploadErrorTimeoutRef.current) {
          clearTimeout(uploadErrorTimeoutRef.current)
        }
        uploadErrorTimeoutRef.current = setTimeout(() => setUploadError(null), 5000)
        throw err
      })
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleImageUploadStart(file).catch((err) => { console.error('[brv-text-editor] Image upload failed:', err) })
    e.target.value = ''
  }

  const handleEditorPaste = (e) => {
    if (!onImageUpload) return
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (!file) {
          console.warn('[brv-text-editor] Clipboard item has image MIME type but getAsFile() returned null')
          continue
        }
        e.preventDefault()
        handleImageUploadStart(file).catch((err) => { console.error('[brv-text-editor] Image upload failed:', err) })
        return
      }
    }
  }

  const handleEditorDrop = (e) => {
    if (!onImageUpload) return
    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return
    e.preventDefault()
    imageFiles.reduce(
      (chain, file) => chain.then(() => handleImageUploadStart(file).catch((err) => { console.error('[brv-text-editor] Image upload failed:', err) })),
      Promise.resolve()
    )
  }

  useEffect(() => {
    if (!fullscreen) return
    const onKey = e => { if (e.key === 'Escape') setFullscreen(false) }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [fullscreen])

  const fsStyle = fullscreen
    ? { position: 'fixed', inset: 0, zIndex: 9999, borderRadius: 0, border: 'none', maxHeight: 'none' }
    : null

  return (
    <div
      className={`rte-root editor-wrapper${fullscreen ? ' rte-fullscreen' : ''} ${className}`.trim()}
      data-rte-theme={theme}
      data-rte-variant={variant}
      style={{
        ...(isBare && !fullscreen ? {} : {
          border: '1px solid var(--rte-border)',
          borderRadius: 'var(--rte-radius)',
          background: 'var(--rte-surface)',
          overflow: 'hidden',
          transition: 'box-shadow 0.15s, border-color 0.15s',
        }),
        display: 'flex',
        flexDirection: 'column',
        ...resolvedVars,
        ...fsStyle,
      }}
    >
      <Toolbar
        editor={editor}
        groups={resolvedToolbar}
        bare={isBare && !fullscreen}
        fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen(v => !v)}
        onImageUpload={onImageUpload}
        fileInputRef={fileInputRef}
        uploadError={uploadError}
        onFileSelect={handleFileSelect}
      />
      <div
        className="editor-content"
        style={{
          minHeight: fullscreen ? 0 : minHeight,
          maxHeight: fullscreen
            ? 'none'
            : (maxHeight === null || maxHeight === 0
                ? undefined
                : typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight),
          overflow: 'auto',
          cursor: 'text',
          flex: '1 1 auto',
        }}
        onClick={() => editor?.commands.focus()}
        onPaste={handleEditorPaste}
        onDrop={handleEditorDrop}
        onDragOver={(e) => {
          if (!onImageUpload) return
          const files = e.dataTransfer?.files
          if (!files || files.length === 0) return
          if (Array.from(files).some(f => f.type.startsWith('image/'))) {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
          }
        }}
      >
        <EditorContent editor={editor} style={{ height: '100%' }} />
      </div>
      <EditorFooter
        editor={editor}
        onSubmit={onSubmit}
        onCancel={onCancel}
        submitLabel={submitLabel}
        showActions={showActions}
        bare={isBare && !fullscreen}
      />
    </div>
  )
}
