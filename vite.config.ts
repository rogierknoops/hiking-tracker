import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      manifest: {
        name: 'Hiking Trail Progress Tracker',
        short_name: 'Hiking Tracker',
        description: 'Track hiking progress vs planned time on trail segments',
        theme_color: '#059669',
        background_color: '#18181b',
      },
    }),
  ],
})
