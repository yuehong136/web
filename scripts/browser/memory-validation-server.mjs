import assert from 'node:assert/strict'
import { resolve } from 'node:path'

assert.ok(process.env.MULTIRAG_RUN_ID, 'Use the registered validation runner')
assert.ok(process.env.XDG_CACHE_HOME)
const { createServer } = await import('vite')
const server = await createServer({
  configLoader: 'native',
  cacheDir: resolve(process.env.XDG_CACHE_HOME, 'vite'),
  server: {
    host: '127.0.0.1',
    port: Number(process.argv[2]),
    strictPort: true,
  },
})
await server.listen()
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.once(signal, async () => {
    await server.close()
    process.exit(0)
  })
}
