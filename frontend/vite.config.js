import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildTime = new Date().toLocaleString('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit',
})

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
  },
  server: {
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3002',
        ws: true,
      },
    },
  },
})
