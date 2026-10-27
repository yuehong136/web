import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { candidates, repository, scratch } from './prepare.mjs'

export async function createExperimentServer() {
  const frozenSource = path.join(scratch, 'source/src')
  const server = await createServer({
    configFile: false,
    root: scratch,
    cacheDir: path.join(scratch, '.vite'),
    plugins: [
      {
        name: 'preserve-current-source-package-resolution',
        enforce: 'pre',
        resolveId(source, importer) {
          if (
            !importer?.startsWith(frozenSource) ||
            source.startsWith('.') ||
            source.startsWith('/') ||
            source.startsWith('@/')
          )
            return null
          // Resolve direct imports as the current source does, without overriding
          // nested dependency versions used by other packages (e.g. lowlight).
          return this.resolve(
            source,
            path.join(repository, 'src', path.relative(frozenSource, importer)),
            { skipSelf: true },
          )
        },
      },
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: [
        { find: '@', replacement: path.join(scratch, 'source/src') },
        ...Object.keys(candidates).map((name) => ({
          find: name,
          replacement: path.join(scratch, 'node_modules', name),
        })),
      ],
      dedupe: ['react', 'react-dom'],
    },
    server: {
      host: '127.0.0.1',
      port: 5194,
      strictPort: true,
      hmr: false,
      watch: { ignored: ['**/*'] },
      fs: { allow: [repository] },
    },
  })
  await server.listen()
  return server
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await createExperimentServer()
  console.log('Renderer experiment: http://127.0.0.1:5194')
}
