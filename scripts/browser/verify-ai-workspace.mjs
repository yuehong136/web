import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { mkdirSync, rmSync, writeFileSync, createWriteStream } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { installWorkspaceFixtures } from './workspace-fixtures.mjs'
import { verifyWorkspacePaths } from './workspace-paths.mjs'
import { profileRouteLoads } from './profile-route-loads.mjs'

const production = process.argv.includes('--production')
const output = `output/playwright/round2/${production ? 'browser' : 'browser-dev'}`
mkdirSync(output, { recursive: true })
for (const file of [
  'results.json',
  'failure.png',
  'failure.txt',
  'route-loads.json',
])
  rmSync(`${output}/${file}`, { force: true })
const port = await new Promise((resolve, reject) => {
  const server = createServer()
  server.on('error', reject)
  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port
    server.close(() => resolve(port))
  })
})
const baseURL = `http://127.0.0.1:${port}`
const log = createWriteStream(`${output}/server.log`)
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    ...(production ? ['preview'] : []),
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--strictPort',
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] },
)
server.stdout.pipe(log)
server.stderr.pipe(log)
let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null)
      throw new Error('Fixture server exited before startup')
    try {
      ready = (await fetch(baseURL)).ok
    } catch {
      /* Wait for the owned server. */
    }
    if (ready) break
    await delay(100)
  }
  assert.ok(ready, 'Fixture server did not become ready')
  browser = await chromium.launch({
    headless: true,
    channel:
      process.env.BROWSER_CHANNEL ||
      (process.platform === 'darwin' ? 'chrome' : undefined),
  })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    reducedMotion: 'reduce',
  })
  const state = await installWorkspaceFixtures(context)
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await context.tracing.start({ screenshots: true, snapshots: true })
  try {
    const result = await verifyWorkspacePaths(page, { baseURL, output, state })
    assert.deepEqual(errors, [], 'Browser page errors')
    const routeLoads = production
      ? await profileRouteLoads(browser, { baseURL, output })
      : null
    writeFileSync(
      `${output}/results.json`,
      `${JSON.stringify({ production, browser: browser.version(), checks: result, routeLoads, pageErrors: errors }, null, 2)}\n`,
    )
    console.log(
      JSON.stringify(
        { production, checks: result.checks, pageErrors: errors, output },
        null,
        2,
      ),
    )
  } catch (error) {
    await page.screenshot({ path: `${output}/failure.png` }).catch(() => {})
    writeFileSync(
      `${output}/failure.txt`,
      `${error.stack}\n${await page
        .locator('body')
        .innerText()
        .catch(() => '')}`,
    )
    throw error
  } finally {
    await context.tracing.stop({ path: `${output}/trace.zip` })
    await context.close()
  }
} finally {
  await browser?.close()
  server.kill('SIGTERM')
  log.end()
}
