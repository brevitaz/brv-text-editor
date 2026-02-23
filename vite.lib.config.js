import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
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
