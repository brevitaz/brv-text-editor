// brv-text-editor – library entry point
// The CSS is bundled automatically; Vite extracts it to dist/style.css.
// In your app, import it once:  import 'brv-text-editor/dist/style.css'

import './index.css'

export { default as RichTextEditor, RTE_THEMES, createTheme, DEFAULT_TOOLBAR } from './components/RichTextEditor.jsx'
export { default as RichTextPreview } from './components/RichTextPreview.jsx'
export { default as Callout, CALLOUT_TYPES } from './extensions/Callout.js'
export { markdownToHtml, markdownToInlineHtml } from './utils/markdown.js'
