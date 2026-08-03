import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this as a project site (github.io/<repo>/), so
  // assets need that path prefix there. The Android/Capacitor build loads
  // from the app's local asset root and must keep base at '/', so this
  // only changes when the Pages workflow sets GITHUB_PAGES=true.
  base: process.env.GITHUB_PAGES ? '/the-awakened/' : '/',
})
