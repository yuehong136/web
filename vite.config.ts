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
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: fallbackApiBase,
          changeOrigin: true,
        },
        '/v1': {
          target: fallbackApiBase,
          changeOrigin: true,
        },
        '/admin-api': {
          target: adminTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/admin-api/, '/api/v1/admin'),
        },
      },
    },

    // ---------------------------------------------------------------------------
    // Dev: pre-bundle heavy deps for faster cold start
    // ---------------------------------------------------------------------------
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'zustand',
        'immer',
        '@tanstack/react-query',
        'i18next',
        'react-i18next',
        'lodash',
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
        'lucide-react',
        'pdfjs-dist',
      ],
    },

    // ---------------------------------------------------------------------------
    // Production build
    // ---------------------------------------------------------------------------
    build: {
      // Match tsconfig target — modern syntax = smaller output
      target: 'es2022',

      // Terser produces ~5-8 % smaller output than esbuild and strips console
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        format: {
          comments: false,
        },
      },

      sourcemap: true,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 500,

      rollupOptions: {
        output: {
          // Organized output paths
          entryFileNames: 'js/[name]-[hash].js',
          chunkFileNames: 'js/chunks/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',

          // Merge tiny chunks (< 20 KB) to reduce HTTP request count
          experimentalMinChunkSize: 20 * 1024,

          // ---------------------------------------------------------------
          // Manual chunk splitting — grouped by update frequency & load priority
          //
          // Strategy:
          //   1. vendor-core   — React runtime, almost never changes → long-term cache
          //   2. vendor-ui     — Radix + shadcn primitives, stable
          //   3. vendor-antd   — Ant Design, heavy, used in mixed pages
          //   4. vendor-state  — Zustand / TanStack / forms / validation
          //   5. vendor-graph  — AntV G6 / XYFlow / Cytoscape, page-specific
          //   6. vendor-editor — Monaco / Lexical / MD editor, page-specific
          //   7. vendor-markdown — Markdown-it / highlight.js / syntax
          //   8. vendor-doc-preview — PDF / DOCX / PPTX / Excel / CSV
          //   9. vendor-chart  — Recharts + D3 ecosystem
          //  10. vendor-icons  — Lucide icons (tree-shake boundary)
          //  11. vendor-i18n   — i18next ecosystem
          //  12. vendor-dnd    — dnd-kit drag & drop
          //  13. vendor-utils  — lodash, uuid, misc utilities
          // ---------------------------------------------------------------
          manualChunks(id) {
            if (!id.includes('node_modules')) return

            // 1. React core runtime
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/react-router/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'vendor-core'
            }

            // 2. Radix UI + shadcn/ui primitives
            if (
              id.includes('node_modules/@radix-ui/') ||
              id.includes('node_modules/class-variance-authority/') ||
              id.includes('node_modules/clsx/') ||
              id.includes('node_modules/tailwind-merge/') ||
              id.includes('node_modules/cmdk/') ||
              id.includes('node_modules/sonner/') ||
              id.includes('node_modules/vaul/') ||
              id.includes('node_modules/embla-carousel') ||
              id.includes('node_modules/input-otp/') ||
              id.includes('node_modules/react-day-picker/') ||
              id.includes('node_modules/next-themes/')
            ) {
              return 'vendor-ui'
            }

            // 3. Ant Design ecosystem
            if (
              id.includes('node_modules/antd/') ||
              id.includes('node_modules/@ant-design/')
            ) {
              return 'vendor-antd'
            }

            // 4. State management + data fetching + forms
            if (
              id.includes('node_modules/zustand/') ||
              id.includes('node_modules/immer/') ||
              id.includes('node_modules/@tanstack/') ||
              id.includes('node_modules/react-hook-form/') ||
              id.includes('node_modules/@hookform/') ||
              id.includes('node_modules/zod/')
            ) {
              return 'vendor-state'
            }

            // 5. Graph & flow visualization
            if (
              id.includes('node_modules/@antv/') ||
              id.includes('node_modules/@xyflow/') ||
              id.includes('node_modules/cytoscape')
            ) {
              return 'vendor-graph'
            }

            // 6. Code & rich-text editors
            if (
              id.includes('node_modules/monaco-editor/') ||
              id.includes('node_modules/@monaco-editor/') ||
              id.includes('node_modules/lexical/') ||
              id.includes('node_modules/@lexical/') ||
              id.includes('node_modules/@uiw/')
            ) {
              return 'vendor-editor'
            }

            // 7. Markdown rendering & syntax highlighting
            if (
              id.includes('node_modules/markdown-it') ||
              id.includes('node_modules/react-markdown/') ||
              id.includes('node_modules/remark-') ||
              id.includes('node_modules/rehype-') ||
              id.includes('node_modules/unified/') ||
              id.includes('node_modules/highlight.js/') ||
              id.includes('node_modules/react-syntax-highlighter/')
            ) {
              return 'vendor-markdown'
            }

            // 8. Document preview (lazy-loaded pages)
            if (
              id.includes('node_modules/docx-preview/') ||
              id.includes('node_modules/pptx-preview/') ||
              id.includes('node_modules/@js-preview/') ||
              id.includes('node_modules/mammoth/') ||
              id.includes('node_modules/react-pdf') ||
              id.includes('node_modules/pdfjs-dist/') ||
              id.includes('node_modules/papaparse/')
            ) {
              return 'vendor-doc-preview'
            }

            // 9. Charts & D3 ecosystem
            if (
              id.includes('node_modules/recharts/') ||
              id.includes('node_modules/d3/') ||
              id.includes('node_modules/d3-')
            ) {
              return 'vendor-chart'
            }

            // 10. Icons
            if (id.includes('node_modules/lucide-react/')) {
              return 'vendor-icons'
            }

            // 11. i18n
            if (
              id.includes('node_modules/i18next') ||
              id.includes('node_modules/react-i18next/')
            ) {
              return 'vendor-i18n'
            }

            // 12. Drag & drop
            if (id.includes('node_modules/@dnd-kit/')) {
              return 'vendor-dnd'
            }

            // 13. Security / crypto
            if (
              id.includes('node_modules/jsencrypt/') ||
              id.includes('node_modules/dompurify/')
            ) {
              return 'vendor-security'
            }

            // 14. Remaining utilities
            if (
              id.includes('node_modules/lodash') ||
              id.includes('node_modules/uuid/') ||
              id.includes('node_modules/eventsource-parser/') ||
              id.includes('node_modules/human-id/')
            ) {
              return 'vendor-utils'
            }
          },
        },
      },
    },
  }
})
