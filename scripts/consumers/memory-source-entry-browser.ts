import assert from 'node:assert/strict'
import { createServer as netServer } from 'node:net'
import {
  existsSync,
  mkdirSync,
  openSync,
  closeSync,
  writeSync,
  fsyncSync,
  writeFileSync,
  readFileSync,
  symlinkSync,
} from 'node:fs'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createServer, type ViteDevServer } from 'vite'
import { chromium, type Browser, type BrowserServer } from 'playwright'
import type { AddressInfo } from 'node:net'
import type { MemorySourceEntryConsumerConfig } from './memory-source-entry'
import { memorySourceEntryMessages as labels } from '../../src/locales/en-US/memory-source-entry'
import { memorySourceMessages as sourceLabels } from '../../src/locales/en-US/memory-sources'
const web = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
/** The parent owns this real API bank, exact operation identity, and SQL/Milvus cleanup. */
export async function runMemorySourceEntryBrowserConsumer(
  config: MemorySourceEntryConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  assert.ok(
    process.env.MULTIRAG_RUN_JOURNAL && process.env.REST_DOCUMENT_RESOURCE_DIR,
    'A registered resource owner is required',
  )
  const id = randomUUID().replaceAll('-', ''),
    casePath = join(process.env.REST_DOCUMENT_RESOURCE_DIR!, id + '.jsonl')
  function append(
    file: string,
    event: string,
    fields: Record<string, unknown> = {},
  ) {
    const fd = openSync(file, 'a', 0o600)
    try {
      writeSync(
        fd,
        JSON.stringify({
          event,
          case_id: id,
          parent_run_id: process.env.MULTIRAG_RUN_ID,
          ...fields,
        }) + '\n',
      )
      fsyncSync(fd)
    } finally {
      closeSync(fd)
    }
  }
  append(process.env.MULTIRAG_RUN_JOURNAL!, 'reserve-case-journal', {
    path: casePath,
    case: 'real-source-entry-browser',
  })
  mkdirSync(dirname(casePath), { recursive: true })
  closeSync(openSync(casePath, 'wx', 0o600))
  const event = (name: string, fields: Record<string, unknown> = {}) =>
    append(casePath, name, fields)
  const root = join(tmpdir(), 'source-entry-' + id)
  event('reserve-source-entry-harness', {
    path: root,
    borrowed_node_modules: join(web, 'node_modules'),
  })
  assert.ok(!existsSync(root))
  mkdirSync(root)
  symlinkSync(join(web, 'node_modules'), join(root, 'node_modules'), 'dir')
  async function freePort() {
    const server = netServer()
    event('reserve-port-selection', { host: '127.0.0.1', requested_port: 0 })
    await new Promise<void>((yes, no) => {
      server.once('error', no)
      server.listen(0, '127.0.0.1', () => yes())
    })
    const port = (server.address() as AddressInfo).port
    await new Promise<void>((yes) => server.close(() => yes()))
    return port
  }
  const port = await freePort(),
    browserPort = await freePort(),
    origin = `http://127.0.0.1:${port}`
  event('reserve-browser-runtime', {
    vite_port: port,
    browser_port: browserPort,
    temporary_root: tmpdir(),
    proxy_target_identity: 'owned backend HTTP fixture',
  })
  writeFileSync(
    join(root, 'index.html'),
    '<html><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>',
  )
  writeFileSync(
    join(root, 'main.tsx'),
    `import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import '${web}/src/index.css';import{MemorySourceEntry}from'${web}/src/components/memory/memory-source-entry';import{ensureLocaleLoaded,setProductLanguage}from'${web}/src/locales/i18n';import{useAuthStore}from'${web}/src/stores/auth';await ensureLocaleLoaded('en-US',['common','memory']);await setProductLanguage('en-US');useAuthStore.setState({token:localStorage.getItem('auth_token'),user:JSON.parse(localStorage.getItem('user_info')||'null'),isAuthenticated:true});createRoot(document.getElementById('root')!).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><BrowserRouter><MemorySourceEntry memoryId={${JSON.stringify(config.memoryId)}} operationIdFactory={()=>${JSON.stringify(config.operationId)}}/></BrowserRouter></QueryClientProvider>);`,
  )
  let server: ViteDevServer | undefined,
    launcher: BrowserServer | undefined,
    browser: Browser | undefined
  let browserPid: number | undefined
  try {
    server = await createServer({
      root,
      configFile: join(web, 'vite.config.ts'),
      configLoader: 'runner',
      cacheDir: join(root, 'vite-cache'),
      define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify(origin) },
      server: {
        host: '127.0.0.1',
        port,
        strictPort: true,
        fs: { allow: [root, web] },
        proxy: { '/api': { target: config.baseURL, changeOrigin: true } },
      },
    })
    await server.listen()
    event('listener-bound', { host: '127.0.0.1', port })
    launcher = await chromium.launchServer({
      channel: 'chrome',
      headless: true,
      port: browserPort,
    })
    browserPid = launcher.process().pid!
    const pgid = Number(
      execFileSync('ps', ['-o', 'pgid=', '-p', String(browserPid)])
        .toString()
        .trim(),
    )
    event('browser-process', { pid: browserPid, pgid })
    event('listener-bound', { host: '127.0.0.1', port: browserPort })
    browser = await chromium.connect(launcher.wsEndpoint())
    const context = await browser.newContext({
      viewport: { width: 1100, height: 900 },
    })
    // This is an egress guard, not an API mock: owned-origin requests continue unchanged.
    await context.route('**/*', (route) =>
      new URL(route.request().url()).origin === origin
        ? route.continue()
        : route.abort(),
    )
    await context.addInitScript(
      ({ token, userId }) => {
        const user = { id: userId, nickname: 'Owned member' }
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user_info', JSON.stringify(user))
        // Hydration checks this snapshot against auth_token before any component mounts.
        localStorage.setItem(
          'auth-storage',
          JSON.stringify({
            state: { user, tenant: null, token, isAuthenticated: true },
            version: 0,
          }),
        )
      },
      { token: config.token, userId: config.userId },
    )
    const page = await context.newPage(),
      errors: string[] = [],
      posts: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        new URL(request.url()).pathname.endsWith('/sources')
      )
        posts.push(request.url())
    })
    await page.goto(origin)
    await page.getByRole('button', { name: labels.title, exact: true }).click()
    await page.getByLabel(labels.agent, { exact: true }).fill(config.agentId)
    await page
      .getByLabel(labels.session, { exact: true })
      .fill(config.sessionId)
    if (config.eventTime !== null) {
      await page
        .getByRole('combobox', { name: labels.eventTime, exact: true })
        .click()
      await page
        .getByRole('option', { name: labels.declaredTime, exact: true })
        .click()
      await page
        .getByLabel(labels.timestamp, { exact: true })
        .fill(config.eventTime)
    }
    for (let index = 0; index < config.segments.length; index++) {
      if (index)
        await page
          .getByRole('button', { name: labels.add, exact: true })
          .click()
      const field = page.locator('fieldset').nth(index)
      await field.getByRole('combobox').click()
      await page
        .getByRole('option', {
          name: sourceLabels.roles[config.segments[index].role],
          exact: true,
        })
        .click()
      await field
        .getByLabel(labels.content, { exact: true })
        .fill(config.segments[index].content)
    }
    const accepted = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/sources'),
    )
    await page.getByRole('button', { name: labels.submit, exact: true }).click()
    const response = await accepted
    assert.equal(response.status(), 200)
    const receipt = (await response.json()).data
    const sourceId = receipt.raw_source_id
    assert.equal(typeof sourceId, 'string')
    assert.match(sourceId, /^[1-9][0-9]*$/)
    await page.getByText(labels.recorded, { exact: true }).waitFor()
    assert.equal(
      new URL(page.url()).searchParams.get('source_operation'),
      config.operationId,
    )
    assert.equal(posts.length, 1)
    const storage = await page.evaluate(() =>
      JSON.stringify([
        location.search,
        { ...localStorage },
        { ...sessionStorage },
      ]),
    )
    for (const segment of config.segments)
      assert.ok(
        !storage.includes(segment.content),
        'Source text must not enter URL/storage',
      )
    await page.reload()
    await page.getByText(labels.recorded, { exact: true }).waitFor()
    assert.equal(posts.length, 1)
    await page
      .getByRole('button', { name: sourceLabels.inspect, exact: true })
      .click()
    await page.getByText(sourceLabels.structured, { exact: true }).waitFor()
    assert.deepEqual(errors, [])
    await context.close()
    return {
      passed: true,
      operationId: config.operationId,
      sourceId,
      sourcePosts: posts.length,
      refreshDidNotResubmit: true,
      metadataRead: true,
      bodyPersisted: false,
      noAutomaticTask:
        receipt.extraction_task_id === null &&
        receipt.queue_state === 'not_required',
      routeMocks: false,
    }
  } finally {
    const closeErrors: unknown[] = []
    for (const close of [
      () => browser?.close(),
      () => launcher?.close(),
      () => server?.close(),
    ]) {
      try {
        await close()
      } catch (error) {
        closeErrors.push(error)
      }
    }
    if (browserPid) {
      let present = false
      try {
        process.kill(browserPid, 0)
        present = true
      } catch {
        // An absent owned Chrome PID is the expected cleanup result.
      }
      event('browser-runtime-cleaned', {
        pid: browserPid,
        pid_absent: !present,
      })
      assert.equal(present, false)
    }
    event('source-entry-browser-cleaned', {
      vite_closed: !closeErrors.length,
      browser_closed: !closeErrors.length,
      close_errors: closeErrors.length,
    })
    assert.equal(closeErrors.length, 0, 'Owned browser cleanup failed')
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const config: MemorySourceEntryConsumerConfig = JSON.parse(
    readFileSync(process.argv[2], 'utf8'),
  )
  const result = await runMemorySourceEntryBrowserConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n', {
      mode: 0o600,
      flag: 'wx',
    })
  else console.log(JSON.stringify(result))
}
