import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset paths relative so the same build works on
// Vercel (web) AND when loaded from file:// inside Electron/Tauri (Phase 2).
export default defineConfig({
  plugins: [react()],
  base: './',
})
