import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const fallbackApiBase = env.VITE_API_BASE_URL || 'http://localhost:8000'

  let adminTarget = 'http://localhost:8130'
  try {
    const apiUrl = new URL(fallbackApiBase)
    apiUrl.port = '8130'
    adminTarget = apiUrl.toString().replace(/\/$/, '')
  } catch {
    adminTarget = 'http://localhost:8130'
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0', // 允许外部访问
      port: 5173, // 默认端口
      proxy: {
        '/admin-api': {
          target: adminTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/admin-api/, '/api/v1/admin'),
        },
      },
    },
    // 修复 pdfjs-dist 版本冲突问题
    optimizeDeps: {
      include: ['pdfjs-dist'],
    },
  }
})
