import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),  // Tailwind v4 Vite plugin — handles CSS natively, no PostCSS needed
    react(),
  ],
})
