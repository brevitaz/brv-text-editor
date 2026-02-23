import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Keep demo app output separate from the publishable library output (dist/)
    outDir: 'demo-dist',
  },
})
