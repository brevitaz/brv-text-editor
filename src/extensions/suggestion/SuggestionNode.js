import { Node, mergeAttributes } from '@tiptap/core'

/**
 * SuggestionNode
 *
 * A single generic inline node for all suggestion triggers (@mentions, #hashtags, etc.).
 * Stores the trigger character, item id, and display label as attributes.
 *
 * HTML output:
 *   <span data-trigger="@" data-id="user-123" class="rte-suggestion">@Jane Doe</span>
 */
const SuggestionNode = Node.create({
  name: 'suggestion',

  group: 'inline',
  inline: true,
  atom: true,       // non-editable leaf — cursor skips over, backspace deletes whole token

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: el => el.getAttribute('data-id'),
        renderHTML: attrs => ({ 'data-id': attrs.id }),
      },
      label: {
        default: null,
        parseHTML: el => el.textContent.replace(/^./, ''),  // strip leading trigger char
        renderHTML: () => ({}),  // rendered as text content, not an attribute
      },
      trigger: {
        default: '@',
        parseHTML: el => el.getAttribute('data-trigger'),
        renderHTML: attrs => ({ 'data-trigger': attrs.trigger }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-trigger][data-id].rte-suggestion',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({ class: 'rte-suggestion' }, HTMLAttributes),
      `${node.attrs.trigger}${node.attrs.label}`,
    ]
  },

  renderText({ node }) {
    return `${node.attrs.trigger}${node.attrs.label}`
  },
})

export default SuggestionNode
