import { useCallback, useState, useRef, useEffect } from 'react'
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
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Blockquote from '@tiptap/extension-blockquote'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import HardBreak from '@tiptap/extension-hard-break'
import History from '@tiptap/extension-history'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'

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
} from 'lucide-react'

// ─── Theme presets ──────────────────────────────────────────────────────────
/**
 * Built-in theme presets.  Pass the key as the `theme` prop, e.g.:
 *   <RichTextEditor theme="classic" />
 *
 * Or spread individual token overrides via `themeVars`, e.g.:
 *   <RichTextEditor themeVars={{ '--rte-color-primary': '#7c3aed' }} />
 */
export const RTE_THEMES = {
  /** Default — UnleashTeams teal/cyan palette */
  unleashteams: {},

  /** Warm Basecamp-inspired palette */
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

// ─── Toolbar ─────────────────────────────────────────────────────────────────
function Toolbar({ editor }) {
  const [showLinkDialog, setShowLinkDialog]     = useState(false)
  const [showImageDialog, setShowImageDialog]   = useState(false)
  const [showHeadingMenu, setShowHeadingMenu]   = useState(false)
  const toolbarRef = useRef(null)

  useEffect(() => {
    const handler = e => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setShowLinkDialog(false)
        setShowImageDialog(false)
        setShowHeadingMenu(false)
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
        borderRadius: 'calc(var(--rte-radius) - 1px) calc(var(--rte-radius) - 1px) 0 0',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Heading picker */}
      <div style={{ position: 'relative' }}>
        <Tooltip text="Text style">
          <button
            type="button"
            onClick={() => { setShowHeadingMenu(v => !v); setShowLinkDialog(false); setShowImageDialog(false) }}
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

      <Divider />

      {/* Text formatting */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()}      active={editor.isActive('bold')}      title="Bold (⌘B)"><BoldIcon size={13} strokeWidth={2.5} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()}    active={editor.isActive('italic')}    title="Italic (⌘I)"><ItalicIcon size={13} strokeWidth={2.5} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (⌘U)"><UnderlineIcon size={13} strokeWidth={2.5} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()}    active={editor.isActive('strike')}    title="Strikethrough"><Strikethrough size={13} strokeWidth={2.5} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()}      active={editor.isActive('code')}      title="Inline code"><CodeIcon size={13} strokeWidth={2.5} /></ToolbarButton>

      <Divider />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()}   active={editor.isActive({ textAlign: 'left' })}   title="Align left"><AlignLeft size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center"><AlignCenter size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()}  active={editor.isActive({ textAlign: 'right' })}  title="Align right"><AlignRight size={13} /></ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive('bulletList')}  title="Bullet list"><List size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list"><ListOrdered size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()}    active={editor.isActive('taskList')}    title="Task list"><ListChecks size={13} /></ToolbarButton>

      <Divider />

      {/* Block elements */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()}  active={editor.isActive('codeBlock')}  title="Code block">
        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, lineHeight: 1, color: 'inherit' }}>{'<>'}</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule"><Minus size={13} /></ToolbarButton>

      <Divider />

      {/* Link */}
      <div style={{ position: 'relative' }}>
        <ToolbarButton
          onClick={() => { setShowLinkDialog(v => !v); setShowImageDialog(false); setShowHeadingMenu(false) }}
          active={editor.isActive('link') || showLinkDialog}
          title="Insert link"
        >
          <LinkIcon size={13} />
        </ToolbarButton>
        {showLinkDialog && (
          <LinkDialog onConfirm={handleLinkInsert} onCancel={() => setShowLinkDialog(false)} initialUrl={currentLink} />
        )}
      </div>

      {/* Image */}
      <div style={{ position: 'relative' }}>
        <ToolbarButton
          onClick={() => { setShowImageDialog(v => !v); setShowLinkDialog(false); setShowHeadingMenu(false) }}
          active={showImageDialog}
          title="Insert image"
        >
          <ImageIcon size={13} />
        </ToolbarButton>
        {showImageDialog && (
          <ImageDialog onConfirm={handleImageInsert} onCancel={() => setShowImageDialog(false)} />
        )}
      </div>

      <Divider />

      {/* History */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (⌘Z)"><Undo size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (⌘⇧Z)"><Redo size={13} /></ToolbarButton>
    </div>
  )
}

// ─── Editor Footer ───────────────────────────────────────────────────────────
function EditorFooter({ editor, onSubmit, onCancel, submitLabel, showActions }) {
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
        borderRadius: '0 0 calc(var(--rte-radius) - 1px) calc(var(--rte-radius) - 1px)',
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
 * autofocus       boolean  – Autofocus on mount (default: false)
 * className       string   – Extra class applied to the outermost wrapper
 * theme           string   – Built-in preset: 'unleashteams' | 'classic'
 * themeVars       object   – CSS variable overrides, e.g. { '--rte-color-primary': '#7c3aed' }
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
  autofocus      = false,
  className      = '',
  theme          = 'unleashteams',
  themeVars      = {},
}) {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      Strike,
      Code,
      CodeBlock,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      TaskList,
      TaskItem.configure({ nested: true }),
      Blockquote,
      HorizontalRule,
      HardBreak,
      History,
      Image,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialContent,
    autofocus,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML())
    },
  })

  // Merge preset theme vars with instance-level overrides
  const presetVars   = RTE_THEMES[theme] ?? {}
  const resolvedVars = { ...presetVars, ...themeVars }

  return (
    <div
      className={`rte-root editor-wrapper ${className}`.trim()}
      data-rte-theme={theme}
      style={{
        border: '1px solid var(--rte-border)',
        borderRadius: 'var(--rte-radius)',
        background: 'var(--rte-surface)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        ...resolvedVars,
      }}
    >
      <Toolbar editor={editor} />
      <div
        className="editor-content"
        style={{ minHeight, overflow: 'auto', cursor: 'text' }}
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} style={{ height: '100%' }} />
      </div>
      <EditorFooter
        editor={editor}
        onSubmit={onSubmit}
        onCancel={onCancel}
        submitLabel={submitLabel}
        showActions={showActions}
      />
    </div>
  )
}
