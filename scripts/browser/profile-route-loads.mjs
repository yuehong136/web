import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { installWorkspaceFixtures } from './workspace-fixtures.mjs'

const apiEnvelope = (data) => JSON.stringify({ code: 0, message: '', data })
const assetTrackers = new WeakMap()
const isAsset = (request) =>
  /\.(?:m?js|css|woff2?|ttf|otf)$/.test(new URL(request.url()).pathname)

function trackAssets(page) {
  const tracker = { pending: new Set(), changed: new Set() }
  const notify = () => tracker.changed.forEach((listener) => listener())
  page.on('request', (request) => {
    if (isAsset(request)) {
      tracker.pending.add(request)
      notify()
    }
  })
  const finished = (request) => {
    if (tracker.pending.delete(request)) notify()
  }
  page.on('requestfinished', finished)
  page.on('requestfailed', finished)
  assetTrackers.set(page, tracker)
}
const reference = {
  id: 'profile-chunk',
  chunk_id: 'profile-chunk',
  document_id: 'profile-doc',
  doc_id: 'profile-doc',
  dataset_id: 'fixture-kb',
  kb_id: 'fixture-kb',
  document_name: 'Profile notes.pdf',
  docnm_kwd: 'Profile notes.pdf',
  content: '原文证据：受控资源测量。Keep evidence beside the answer. '.repeat(
    60,
  ),
  similarity: 0,
}
const answers = {
  plain:
    'RESOURCE_PROFILE_BASE. [ID:0]\n\n[Research report](/api/v1/documents/artifact/report.html)',
  typescript:
    'RESOURCE_PROFILE_TS\n\n```typescript\nconst PROFILE_TS: number = 42\nconsole.log(PROFILE_TS)\n```',
  python:
    'RESOURCE_PROFILE_PY\n\n```python\ndef PROFILE_PY(value: int) -> str:\n    return f"Evidence {value}"\n```',
}

async function installProfileOverrides(context) {
  const state = { answer: 'plain', agentRequests: [] }
  await context.route(
    /\/(?:api\/)?v1\/.*(?:completion(?:s)?|chat_service_sse|enhanced_chat_sse)$/,
    async (route) => {
      const frames = [
        {
          retcode: 0,
          data: {
            answer: answers[state.answer],
            reference: { chunks: [reference] },
            final: true,
          },
        },
        { retcode: 0, data: true },
      ]
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: frames
          .map((frame) => `data: ${JSON.stringify(frame)}\n\n`)
          .join(''),
      })
    },
  )
  await context.route(
    /\/(?:api\/)?v1\/agents\/profile-agent(?:\/|\?|$)/,
    async (route) => {
      const url = new URL(route.request().url())
      state.agentRequests.push({
        method: route.request().method(),
        path: url.pathname,
      })
      let data = []
      if (/\/agents\/profile-agent$/.test(url.pathname))
        data = {
          id: 'profile-agent',
          title: 'Controlled profile agent',
          description: 'Resource loading only',
          tenant_id: 'fixture',
          canvas_type: 'agent',
          release: false,
          dsl: {
            components: {
              begin: {
                obj: {
                  component_name: 'Begin',
                  params: { prologue: 'Controlled start', inputs: {} },
                },
                upstream: [],
                downstream: [],
              },
            },
            graph: {
              nodes: [
                {
                  id: 'begin',
                  type: 'beginNode',
                  position: { x: 0, y: 0 },
                  data: {
                    label: 'Begin',
                    name: 'Begin',
                    form: { prologue: 'Controlled start', inputs: {} },
                  },
                },
              ],
              edges: [],
            },
            history: [],
            path: [],
            messages: [],
            reference: [],
            globals: {},
            variables: {},
            retrieval: [],
          },
        }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: apiEnvelope(data),
      })
    },
  )
  return state
}

async function settleResources(page) {
  await page.evaluate(() => document.fonts.ready)
  const tracker = assetTrackers.get(page)
  await new Promise((resolve, reject) => {
    let quietTimer
    const cleanup = () => {
      clearTimeout(deadline)
      clearTimeout(quietTimer)
      tracker.changed.delete(check)
    }
    const check = () => {
      clearTimeout(quietTimer)
      if (!tracker.pending.size)
        quietTimer = setTimeout(() => {
          cleanup()
          resolve()
        }, 350)
    }
    const deadline = setTimeout(() => {
      cleanup()
      reject(new Error('JS/CSS/font resources did not settle'))
    }, 15000)
    tracker.changed.add(check)
    check()
  })
}

async function resourceSnapshot(page, since = 0) {
  return page.evaluate((since) => {
    const classify = (pathname) =>
      /\.m?js$/.test(pathname)
        ? 'js'
        : /\.css$/.test(pathname)
          ? 'css'
          : /\.(woff2?|ttf|otf)$/.test(pathname)
            ? 'font'
            : null
    const entries = performance
      .getEntriesByType('resource')
      .flatMap((entry) => {
        const pathname = new URL(entry.name).pathname
        const kind = classify(pathname)
        return kind && entry.startTime >= since
          ? [
              {
                path: pathname,
                kind,
                initiatorType: entry.initiatorType,
                startTime: entry.startTime,
                encodedBodyBytes: entry.encodedBodySize,
                decodedBodyBytes: entry.decodedBodySize,
                transferBytes: entry.transferSize,
              },
            ]
          : []
      })
    const groups = Object.fromEntries(
      ['js', 'css', 'font'].map((kind) => {
        const rows = entries.filter((entry) => entry.kind === kind)
        return [
          kind,
          {
            requests: rows.length,
            uniquePaths: new Set(rows.map((entry) => entry.path)).size,
            encodedBodyBytes: rows.reduce(
              (sum, entry) => sum + entry.encodedBodyBytes,
              0,
            ),
            decodedBodyBytes: rows.reduce(
              (sum, entry) => sum + entry.decodedBodyBytes,
              0,
            ),
            transferBytes: rows.reduce(
              (sum, entry) => sum + entry.transferBytes,
              0,
            ),
          },
        ]
      }),
    )
    return {
      since,
      capturedAt: performance.now(),
      totalResourceEntries: performance.getEntriesByType('resource').length,
      groups,
      entries,
    }
  }, since)
}

async function measurePhase(page, name, phases, action) {
  const start = await page.evaluate(() => performance.now())
  await action()
  await settleResources(page)
  phases[name] = await resourceSnapshot(page, start)
}

async function selectApp(page) {
  await page
    .getByRole('button', { name: 'Select skills or apps', exact: true })
    .click()
  await page.getByRole('button', { name: 'Apps', exact: true }).click()
  await page
    .getByRole('button', { name: /^Research assistant(?:\s|$)/ })
    .first()
    .click()
}

async function send(page, text, sentinel) {
  const input = page.locator('textarea').first()
  await input.fill(text)
  await input.press('Enter')
  await page.getByText(sentinel, { exact: false }).last().waitFor()
  if (new URL(page.url()).pathname.startsWith('/search/'))
    await page
      .locator('section[aria-busy="false"]')
      .filter({ hasText: sentinel })
      .getByRole('status')
      .filter({ hasText: /^Completed$/ })
      .last()
      .waitFor()
  else await page.locator('[data-run-phase="completed"]').last().waitFor()
}

async function measureIncrements(page, name, state, phases) {
  await measurePhase(page, 'plainAnswer', phases, async () => {
    if (name === 'Home') await selectApp(page)
    await send(page, 'Measure plain answer resources', 'RESOURCE_PROFILE_BASE')
  })
  await measurePhase(page, 'firstEvidence', phases, async () => {
    await page
      .getByRole('button', { name: /Sources.*citation/i })
      .first()
      .click()
    await page
      .getByRole('button', { name: /原文证据/ })
      .first()
      .click()
    await page
      .locator('[data-workspace-detail] [data-context-panel-body]')
      .waitFor()
  })
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  if (name === 'Home') {
    await measurePhase(page, 'firstArtifact', phases, async () => {
      await page
        .locator('[data-artifact-card]')
        .filter({ hasText: 'report.html' })
        .first()
        .click()
      await page
        .frameLocator('[data-artifact-panel] iframe')
        .getByRole('heading', { name: 'Research artifact' })
        .waitFor()
    })
    await page
      .getByRole('button', { name: 'Return to answer', exact: true })
      .click()
  }
  for (const [language, sentinel, code] of [
    ['typescript', 'RESOURCE_PROFILE_TS', 'const PROFILE_TS: number = 42'],
    ['python', 'RESOURCE_PROFILE_PY', 'def PROFILE_PY(value: int)'],
  ]) {
    state.answer = language
    await measurePhase(
      page,
      language === 'typescript' ? 'firstTypeScript' : 'firstPython',
      phases,
      async () => {
        await send(page, `Measure ${language} grammar`, sentinel)
        await page
          .locator('.code-block')
          .filter({ hasText: code })
          .last()
          .locator('pre code span[style]')
          .first()
          .waitFor({ timeout: 30000 })
      },
    )
  }
}

/** Every route gets a fresh context. Fixture routing disables HTTP cache. */
export async function profileRouteLoads(browser, { baseURL, output }) {
  await mkdir(output, { recursive: true })
  const routes = {}
  for (const [name, pathname] of Object.entries({
    Home: '/home',
    Search: '/search/fixture-search',
    Agent: '/agent/profile-agent',
  })) {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })
    await installWorkspaceFixtures(context)
    await context.addInitScript(() =>
      performance.setResourceTimingBufferSize(10000),
    )
    const state = await installProfileOverrides(context)
    const page = await context.newPage()
    trackAssets(page)
    page.setDefaultTimeout(15000)
    const pageErrors = []
    const failedRequests = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('requestfailed', (request) =>
      failedRequests.push({
        path: new URL(request.url()).pathname,
        failure: request.failure()?.errorText,
      }),
    )
    const phases = {}
    let ready = false
    let readyEvidence = null
    let limitation = null
    try {
      await page.goto(new URL(pathname, baseURL).href, {
        waitUntil: 'domcontentloaded',
      })
      if (name === 'Agent') {
        await page
          .locator('.react-flow__node[data-id="begin"]')
          .waitFor({ timeout: 30000 })
        assert.ok(
          (await page
            .getByText('Controlled profile agent', { exact: true })
            .count()) ||
            (await page
              .locator('input[value="Controlled profile agent"]')
              .count()),
        )
        readyEvidence = {
          kind: 'persisted-agent-canvas',
          nodeIds: await page
            .locator('.react-flow__node')
            .evaluateAll((nodes) => nodes.map((node) => node.dataset.id)),
          title: 'Controlled profile agent',
        }
      } else await page.locator('textarea').first().waitFor({ timeout: 30000 })
      await settleResources(page)
      ready = true
      phases.coldRoute = await resourceSnapshot(page)
      await page.screenshot({
        path: path.join(output, `cold-${name.toLowerCase()}.png`),
      })
      if (name !== 'Agent') await measureIncrements(page, name, state, phases)
    } catch (error) {
      limitation = error.message
      phases.partial = await resourceSnapshot(page).catch(() => null)
      await page
        .screenshot({
          path: path.join(
            output,
            `profile-${name.toLowerCase()}-limitation.png`,
          ),
        })
        .catch(() => {})
    } finally {
      routes[name] = {
        pathname,
        freshContext: true,
        ready,
        readyEvidence,
        scopeNotes:
          name === 'Search'
            ? [
                'Search summary renders artifact URLs as ordinary links; preview increment measured through the existing Home card path only.',
              ]
            : [],
        limitation,
        phases,
        agentRequests: state.agentRequests,
        pageErrors,
        failedRequests,
      }
      await context.close()
    }
    console.log(
      `Profile ${name}: ${ready ? 'route ready' : 'partial'}; phases=${Object.keys(phases).join(',')}${limitation ? `; ${limitation.split('\n')[0]}` : ''}`,
    )
  }
  let manifestSha256 = null
  try {
    manifestSha256 = createHash('sha256')
      .update(await readFile('dist/.vite/manifest.json'))
      .digest('hex')
  } catch {}
  const report = {
    measuredAt: new Date().toISOString(),
    browser: browser.version(),
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    context: {
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      deviceScaleFactor: 1,
      throttling: 'none',
    },
    baseURL,
    manifestSha256,
    routes,
    limitations: [
      'Fresh contexts reset route, module, storage and browser cache state; they do not flush OS/disk/server caches.',
      'context.route for controlled APIs disables HTTP cache. Counts are fixture-route requests, not normal production repeat visits.',
      'ResourceTiming measures completed JS/CSS/font entries. transferSize includes HTTP overhead; zero sizes can mean TAO/cache restrictions.',
      'Preview server compression may differ from production. encodedBodySize is observed HTTP body size, not a calculated gzip estimate.',
      'API/SSE responses are controlled fixtures. Measurements do not establish real backend/provider latency, FCP or INP.',
      'Agent exercises a minimal persisted Begin canvas only; editor dialogs/runtime execution are outside this cold route measurement.',
      'Incremental phases follow coldRoute in the same context. Python follows TypeScript and therefore shares already-loaded Shiki core/themes.',
    ],
  }
  await writeFile(
    path.join(output, 'route-loads.json'),
    JSON.stringify(report, null, 2) + '\n',
  )
  for (const [name, route] of Object.entries(routes)) {
    assert.equal(route.ready, true, `${name}: route did not render`)
    assert.equal(route.limitation, null, `${name}: ${route.limitation}`)
    assert.deepEqual(route.pageErrors, [], `${name}: browser runtime errors`)
  }
  return report
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { chromium } = await import('playwright')
  const { preview } = await import('vite')
  const output =
    process.env.PROFILE_OUTPUT || 'output/playwright/round2/route-profile'
  const server = process.env.PROFILE_BASE_URL
    ? null
    : await preview({
        configFile: false,
        preview: { host: '127.0.0.1', port: 4195, strictPort: true },
      })
  const browser = await chromium.launch({
    channel:
      process.env.BROWSER_CHANNEL ||
      (process.platform === 'darwin' ? 'chrome' : undefined),
    headless: true,
  })
  try {
    const result = await profileRouteLoads(browser, {
      baseURL: process.env.PROFILE_BASE_URL || 'http://127.0.0.1:4195',
      output,
    })
    console.log(
      JSON.stringify(
        {
          output,
          manifestSha256: result.manifestSha256,
          routes: Object.fromEntries(
            Object.entries(result.routes).map(([name, route]) => [
              name,
              { ready: route.ready, limitation: route.limitation },
            ]),
          ),
        },
        null,
        2,
      ),
    )
  } finally {
    await browser.close()
    if (server) await new Promise((resolve) => server.httpServer.close(resolve))
  }
}
