import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the build works at the bucket root, in a sub-folder
  // or behind CloudFront without changes.
  base: './',
  test: { environment: 'node' },
})
