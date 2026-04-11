import { Extension } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import { Suggestion } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import SuggestionDropdown from './SuggestionDropdown.jsx'

/**
 * createSuggestionPlugin
 *
 * Factory: given a TriggerConfig, returns a TipTap Extension that registers
 * a @tiptap/suggestion ProseMirror plugin for that trigger character.
 *
 * @param {object} triggerConfig
 * @param {string} triggerConfig.char             – trigger character, e.g. '@'
 * @param {function} triggerConfig.items           – (query) => Item[] | Promise<Item[]>
 * @param {function} [triggerConfig.onSelect]      – called after item is inserted (only on success)
 * @param {number} [triggerConfig.minChars=0]      – min chars after trigger to show popup
 * @param {number} [triggerConfig.debounce]        – override auto debounce (ms)
 * @param {function} [triggerConfig.renderItem]    – custom per-row renderer
 * @param {function} [triggerConfig.renderList]    – custom full-list renderer
 */
export default function createSuggestionPlugin(triggerConfig) {
  const {
    char,
    items: fetchItems,
    onSelect,
    minChars = 0,
    debounce: debounceOverride,
    renderItem,
    renderList,
  } = triggerConfig

  const pluginKey = new PluginKey(`suggestion-${char}`)

  // Cached after first call so we don't probe on every keystroke.
  // null = undetermined, false = sync, true = async.
  let isAsyncSource = null

  return Extension.create({
    name: `suggestion-trigger-${char}`,

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char,
          pluginKey,
          allowSpaces: false,
          // Only activate after minChars characters are typed after the trigger
          allow: ({ state, range }) => {
            try {
              const text = state.doc.textBetween(range.from, range.to, '')
              // text includes the trigger char, so query length = text.length - 1
              return (text.length - 1) >= minChars
            } catch (error) {
              console.error(`[brv-text-editor] Suggestion allow() failed for trigger "${char}"`, error)
              return false
            }
          },

          // items() feeds @tiptap/suggestion's internal state (used for command resolution).
          // The render layer manages its own item state via resolveItems() below.
          // For async sources we return [] here; resolveItems handles the actual fetching.
          items: ({ query }) => {
            if (isAsyncSource === false) return fetchItems(query)
            if (isAsyncSource === true) return []

            // First call — probe to determine sync vs async
            const result = fetchItems(query)
            if (Array.isArray(result)) {
              isAsyncSource = false
              return result
            }
            isAsyncSource = true
            // Suppress the unhandled rejection on this probe call;
            // the render lifecycle will issue its own debounced fetch.
            result.catch(() => {})
            return []
          },

          command: ({ editor, range, props: item }) => {
            if (!editor || editor.isDestroyed) {
              console.error(`[brv-text-editor] Suggestion command() called on destroyed editor (trigger "${char}")`)
              return
            }
            try {
              const success = editor
                .chain()
                .focus()
                .deleteRange(range)
                .insertContent({
                  type: 'suggestion',
                  attrs: {
                    id: item.id,
                    label: item.label,
                    trigger: char,
                  },
                })
                .insertContent(' ')  // space after token for continued typing
                .run()

              if (success) onSelect?.(item)
            } catch (error) {
              console.error(`[brv-text-editor] Suggestion command() failed for trigger "${char}"`, error)
            }
          },

          render: () => {
            let renderer = null
            let debounceTimer = null
            let querySeq = 0

            const resolveItems = (query, props) => {
              if (isAsyncSource === false) {
                // Known sync source — fetch and render immediately
                const items = fetchItems(query)
                renderer.updateProps({ ...props, items, loading: false })
                return
              }

              // Async (or undetermined) — show loading, debounce the fetch,
              // discard stale responses via querySeq
              renderer.updateProps({ ...props, items: [], loading: true })

              const seq = ++querySeq
              const delay = debounceOverride ?? 250

              clearTimeout(debounceTimer)
              debounceTimer = setTimeout(() => {
                const result = fetchItems(query)

                if (Array.isArray(result)) {
                  // First debounced call revealed this is a sync source
                  isAsyncSource = false
                  if (seq === querySeq && renderer) {
                    renderer.updateProps({ ...props, items: result, loading: false })
                  }
                  return
                }

                isAsyncSource = true
                result
                  .then(items => {
                    if (seq === querySeq && renderer) {
                      renderer.updateProps({ ...props, items, loading: false })
                    }
                  })
                  .catch((error) => {
                    if (seq === querySeq && renderer) {
                      console.error(`[brv-text-editor] Suggestion items() failed for trigger "${char}"`, error)
                      renderer.updateProps({ ...props, items: [], loading: false })
                    }
                  })
              }, delay)
            }

            return {
              onStart: (props) => {
                renderer = new ReactRenderer(SuggestionDropdown, {
                  props: {
                    ...props,
                    items: [],
                    loading: isAsyncSource !== false,
                    renderItem,
                    renderList,
                  },
                  editor: props.editor,
                })
                resolveItems(props.query, props)
              },

              onUpdate: (props) => {
                if (!renderer) return
                renderer.updateProps({ ...props, renderItem, renderList })
                resolveItems(props.query, props)
              },

              onKeyDown: (props) => {
                if (props.event.key === 'Escape') {
                  return true
                }
                return renderer?.ref?.onKeyDown?.(props) ?? false
              },

              onExit: () => {
                clearTimeout(debounceTimer)
                renderer?.destroy()
                renderer = null
                querySeq = 0
              },
            }
          },
        }),
      ]
    },
  })
}
