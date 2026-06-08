import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split large, rarely-changing vendor libs into their own chunks so they
        // download in parallel and stay cached across app deploys (repeat loads
        // only refetch the small app chunk).
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-vendor/') || id.includes('/internmap/')) return 'recharts'
          if (id.includes('/@supabase/')) return 'supabase'
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) return 'react'
        },
      },
    },
  },
})
