import { Node } from '@tiptap/core'

export const CALLOUT_TYPES = [
  { key: 'info',    label: 'Info',    color: '#3182ce' },
  { key: 'success', label: 'Success', color: '#38a169' },
  { key: 'warning', label: 'Warning', color: '#d69e2e' },
  { key: 'danger',  label: 'Danger',  color: '#e53e3e' },
  { key: 'tip',     label: 'Tip',     color: '#805ad5' },
  { key: 'note',    label: 'Note',    color: '#718096' },
]

const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      type: { default: 'info' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, 'data-callout': node.attrs.type, class: `rte-callout rte-callout-${node.attrs.type}` }, 0]
  },

  addCommands() {
    return {
      toggleCallout: (type) => ({ commands }) => commands.toggleWrap('callout', { type }),
      unsetCallout: () => ({ commands }) => commands.lift('callout'),
    }
  },
})

export default Callout
