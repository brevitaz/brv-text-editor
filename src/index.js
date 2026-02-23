// brv-text-editor – library entry point
// The CSS is bundled automatically; Vite extracts it to dist/style.css.
// In your app, import it once:  import 'brv-text-editor/dist/style.css'

import './index.css'

export { default as RichTextEditor, RTE_THEMES, createTheme } from './components/RichTextEditor.jsx'
export { default as RichTextPreview } from './components/RichTextPreview.jsx'
