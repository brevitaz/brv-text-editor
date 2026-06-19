import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  define: {
    // Strip development-only code from bundled dependencies (e.g.
    // use-sync-external-store shim) so their dev-time error messages
    // don't leak into the library output.
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'BrvTextEditor',
      // Produces:
      //   dist/brv-text-editor.es.js   (ES module)
      //   dist/brv-text-editor.umd.js  (UMD / CJS-compatible)
      fileName: format => `brv-text-editor.${format}.js`,
    },
    rollupOptions: {
      // React must be provided by the host application — don't bundle it.
      // react/jsx-runtime must also be external: pre-compiled deps (e.g. Tiptap)
      // use the automatic JSX transform internally, and bundling it would pull
      // in a duplicate copy of React's jsx-runtime, causing runtime errors.
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJsxRuntime',
        },
      },
    },
    // Keep the CSS extraction so users can do:
    //   import 'brv-text-editor/dist/style.css'
    cssCodeSplit: false,
    // Don't minify by default so tree-shaking works better in the host
    minify: false,
    sourcemap: true,
  },
})
