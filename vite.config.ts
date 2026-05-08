import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

function readPackageVersion(): string {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'),
    ) as { version?: string }
    return packageJson.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function readGitCommitSha(): string {
  try {
    return (
      execSync('git rev-parse --short HEAD', {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim() || 'unknown'
    )
  } catch {
    return 'unknown'
  }
}

function monacoStaticAssetsPlugin(): Plugin {
  const sourceDir = path.resolve(__dirname, 'node_modules/monaco-editor/min/vs')
  const outputDir = path.resolve(__dirname, 'dist/vs')

  return {
    name: 'monaco-static-assets',
    configureServer(server) {
      server.middlewares.use('/vs', (req, res, next) => {
        const requestUrl = new URL(req.url || '/', 'http://localhost')
        const relativePath = decodeURIComponent(
          requestUrl.pathname.replace(/^\/+/, ''),
        )
        const filePath = path.resolve(sourceDir, relativePath)

        if (!filePath.startsWith(sourceDir)) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }

        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          next()
          return
        }

        const contentTypes: Record<string, string> = {
          '.css': 'text/css',
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.json': 'application/json',
          '.ttf': 'font/ttf',
          '.wasm': 'application/wasm',
        }
        res.setHeader(
          'Content-Type',
          contentTypes[path.extname(filePath)] ?? 'application/octet-stream',
        )
        fs.createReadStream(filePath).pipe(res)
      })
    },
    closeBundle() {
      fs.rmSync(outputDir, { recursive: true, force: true })
      fs.mkdirSync(path.dirname(outputDir), { recursive: true })
      fs.cpSync(sourceDir, outputDir, { recursive: true })
    },
  }
}

function normalizeModuleId(id: string): string {
  return id.replaceAll('\\', '/')
}

function isPackage(id: string, packageName: string): boolean {
  const normalized = normalizeModuleId(id)
  return (
    normalized.includes(`/node_modules/${packageName}/`) ||
    normalized.endsWith(`/node_modules/${packageName}`)
  )
}

function isPackagePrefix(id: string, packagePrefix: string): boolean {
  return normalizeModuleId(id).includes(`/node_modules/${packagePrefix}`)
}

function isAnyPackage(id: string, packageNames: string[]): boolean {
  return packageNames.some((packageName) => isPackage(id, packageName))
}

function isAnyPackagePrefix(id: string, packagePrefixes: string[]): boolean {
  return packagePrefixes.some((packagePrefix) =>
    isPackagePrefix(id, packagePrefix),
  )
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const fallbackApiBase = env.VITE_API_BASE_URL || 'http://localhost:8000'
  const shouldAnalyze = env.VITE_ANALYZE === 'true' || mode === 'analyze'
  const appVersion = readPackageVersion()
  const appCommitSha = env.VITE_COMMIT_SHA || readGitCommitSha()
  const appBuildTime = new Date().toISOString()

  let adminTarget = 'http://localhost:8130'
  try {
    const apiUrl = new URL(fallbackApiBase)
    apiUrl.port = '8130'
    adminTarget = apiUrl.toString().replace(/\/$/, '')
  } catch {
    adminTarget = 'http://localhost:8130'
  }

  return {
    plugins: [
      react(),
      monacoStaticAssetsPlugin(),
      ...(shouldAnalyze
        ? [
            visualizer({
              filename: 'dist/stats.html',
              template: 'treemap',
              gzipSize: true,
              brotliSize: true,
            }) as unknown as Plugin,
          ]
        : []),
    ],

    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __APP_COMMIT_SHA__: JSON.stringify(appCommitSha),
      __APP_BUILD_TIME__: JSON.stringify(appBuildTime),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
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
      ],
      // pdfjs-dist ships its own worker — pre-bundling breaks worker URL resolution.
      exclude: ['pdfjs-dist'],
    },

    worker: {
      format: 'es',
    },

    // ---------------------------------------------------------------------------
    // Production build
    // ---------------------------------------------------------------------------
    build: {
      // Match tsconfig target — modern syntax = smaller output
      target: 'es2023',

      // 'hidden' = sourcemaps are generated but not referenced from bundles,
      // so they don't get served to the browser. Upload them to your error
      // tracker (Sentry/Datadog) and exclude .map files from public dist deploys.
      sourcemap: 'hidden',
      cssCodeSplit: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 500,

      rolldownOptions: {
        output: {
          // Organized output paths
          entryFileNames: 'js/[name]-[hash].js',
          chunkFileNames: 'js/chunks/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',

          codeSplitting: {
            minSize: 20 * 1024,
            includeDependenciesRecursively: true,
            groups: [
              {
                name: 'vendor-core',
                priority: 100,
                test: (id: string) =>
                  isAnyPackage(id, [
                    'react',
                    'react-dom',
                    'react-is',
                    'react-router',
                    'react-router-dom',
                    'scheduler',
                    'use-sync-external-store',
                  ]),
              },
              {
                name: 'vendor-antdx',
                priority: 95,
                test: (id: string) =>
                  isAnyPackage(id, [
                    '@ant-design/x',
                    '@ant-design/x-card',
                    '@ant-design/x-markdown',
                    '@ant-design/x-sdk',
                  ]),
              },
              {
                name: 'vendor-markdown',
                priority: 90,
                entriesAware: true,
                maxSize: 1024 * 1024,
                test: (id: string) =>
                  isAnyPackage(id, [
                    '@uiw/react-md-editor',
                    'highlight.js',
                    'hastscript',
                    'html-url-attributes',
                    'inline-style-parser',
                    'lowlight',
                    'markdown-it',
                    'markdown-it-container',
                    'markdown-it-highlightjs',
                    'markdown-it-mathjax3',
                    'prismjs',
                    'property-information',
                    'react-markdown',
                    'react-property',
                    'react-syntax-highlighter',
                    'rehype',
                    'space-separated-tokens',
                    'style-to-js',
                    'style-to-object',
                    'unified',
                    'vfile',
                    'zwitch',
                  ]) ||
                  isAnyPackagePrefix(id, [
                    'comma-separated-tokens',
                    'hast-',
                    'mdast-',
                    'micromark',
                    'rehype-',
                    'remark-',
                    'unist-',
                  ]),
              },
              {
                name: 'vendor-ui',
                priority: 80,
                test: (id: string) =>
                  isAnyPackage(id, [
                    'class-variance-authority',
                    'clsx',
                    'cmdk',
                    'embla-carousel',
                    'embla-carousel-react',
                    'input-otp',
                    'next-themes',
                    'react-day-picker',
                    'sonner',
                    'tailwind-merge',
                    'vaul',
                  ]) || isPackagePrefix(id, '@radix-ui/'),
              },
              {
                name: 'vendor-antd',
                priority: 75,
                test: (id: string) =>
                  isPackage(id, 'antd') || isPackagePrefix(id, '@ant-design/'),
              },
              {
                name: 'vendor-state',
                priority: 70,
                test: (id: string) =>
                  isAnyPackage(id, [
                    '@hookform/resolvers',
                    'react-hook-form',
                    'zod',
                    'zustand',
                  ]) || isPackagePrefix(id, '@tanstack/'),
              },
              {
                name: 'vendor-graph',
                priority: 65,
                entriesAware: true,
                maxSize: 1024 * 1024,
                test: (id: string) =>
                  isPackagePrefix(id, '@antv/') ||
                  isPackagePrefix(id, '@xyflow/') ||
                  isPackagePrefix(id, 'cytoscape'),
              },
              {
                name: 'vendor-editor',
                priority: 60,
                entriesAware: true,
                maxSize: 1024 * 1024,
                test: (id: string) =>
                  isPackage(id, 'monaco-editor') ||
                  isPackagePrefix(id, '@monaco-editor/') ||
                  isPackage(id, 'lexical') ||
                  isPackagePrefix(id, '@lexical/'),
              },
              {
                name: 'vendor-doc-preview',
                priority: 55,
                entriesAware: true,
                maxSize: 1024 * 1024,
                test: (id: string) =>
                  isAnyPackage(id, [
                    '@js-preview/excel',
                    'docx-preview',
                    'mammoth',
                    'papaparse',
                    'pdfjs-dist',
                    'pptx-preview',
                    'react-draggable',
                    'react-pdf-highlighter',
                    'react-rnd',
                    're-resizable',
                  ]) || isPackagePrefix(id, 'react-pdf'),
              },
              {
                name: 'vendor-chart',
                priority: 50,
                entriesAware: true,
                maxSize: 1024 * 1024,
                test: (id: string) =>
                  isPackage(id, 'recharts') || isPackagePrefix(id, 'd3'),
              },
              {
                name: 'vendor-icons',
                priority: 45,
                test: (id: string) => isPackage(id, 'lucide-react'),
              },
              {
                name: 'vendor-i18n',
                priority: 40,
                test: (id: string) =>
                  isAnyPackage(id, ['i18next', 'react-i18next']),
              },
              {
                name: 'vendor-dnd',
                priority: 35,
                test: (id: string) => isPackagePrefix(id, '@dnd-kit/'),
              },
              {
                name: 'vendor-security',
                priority: 30,
                test: (id: string) =>
                  isAnyPackage(id, ['dompurify', 'jsencrypt']),
              },
              {
                name: 'vendor-immer',
                priority: 25,
                test: (id: string) => isPackage(id, 'immer'),
              },
              {
                name: 'vendor-utils',
                priority: 20,
                test: (id: string) =>
                  isAnyPackage(id, [
                    'eventsource-parser',
                    'human-id',
                    'lodash',
                    'uuid',
                  ]),
              },
            ],
          },
        },
      },
    },
  }
})
