import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Callout extension for Tiptap
 *
 * Renders a styled callout block with 6 themed variants.
 * Stored as:  <div data-callout="info"> ... </div>
 *
 * Variants: info | success | warning | danger | tip | note
 */

export const CALLOUT_TYPES = [
  { key: 'info',    label: 'Info',    icon: 'ℹ️',  color: '#2563eb' },
  { key: 'success', label: 'Success', icon: '✅',  color: '#16a34a' },
  { key: 'warning', label: 'Warning', icon: '⚠️',  color: '#d97706' },
  { key: 'danger',  label: 'Danger',  icon: '🚨',  color: '#dc2626' },
  { key: 'tip',     label: 'Tip',     icon: '💡',  color: '#7c3aed' },
  { key: 'note',    label: 'Note',    icon: '📝',  color: '#64748b' },
]

const Callout = Node.create({
  name: 'callout',

  group: 'block',

  content: 'block+',

  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: el => el.getAttribute('data-callout') || 'info',
        renderHTML: attrs => ({ 'data-callout': attrs.type }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: `rte-callout rte-callout--${HTMLAttributes['data-callout'] || 'info'}` }),
      0,
    ]
  },

  addCommands() {
    return {
      setCallout:
        (type = 'info') =>
        ({ commands }) => {
          return commands.wrapIn(this.name, { type })
        },
      toggleCallout:
        (type = 'info') =>
        ({ commands, editor }) => {
          // If already inside a callout of the same type, lift it out
          if (editor.isActive(this.name, { type })) {
            return commands.lift(this.name)
          }
          // If inside a different callout type, update the attribute
          if (editor.isActive(this.name)) {
            return commands.updateAttributes(this.name, { type })
          }
          // Otherwise wrap in a new callout
          return commands.wrapIn(this.name, { type })
        },
      unsetCallout:
        () =>
        ({ commands }) => {
          return commands.lift(this.name)
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      // Allow backspace at the start to unwrap the callout
      Backspace: ({ editor }) => {
        const { $anchor } = editor.state.selection
        if ($anchor.parentOffset !== 0) return false
        // Only unwrap if we're at depth > 1 (inside a callout)
        if (!editor.isActive(this.name)) return false
        return editor.commands.lift(this.name)
      },
    }
  },
})

export default Callout
