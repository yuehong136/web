import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { chromium } from 'playwright'
import { corpus, framesFor } from './corpus.mjs'
import { createExperimentServer } from './serve.mjs'
import { repository, scratch } from './prepare.mjs'

const output = path.join(repository, 'output/playwright/round2/renderer')
await mkdir(output, { recursive: true })
const sourceFiles = [
  'src/components/chat/streaming-x-markdown.tsx',
  'src/components/chat/MarkdownCodeBlock.tsx',
  'src/components/chat/CodeBlock.tsx',
  'src/components/chat/ReferenceMarker.tsx',
  'src/components/chat/MarkdownArtifact.tsx',
]
const sourceHashes = async () =>
  Object.fromEntries(
    await Promise.all(
      sourceFiles.map(async (file) => [
        file,
        createHash('sha256')
          .update(await readFile(path.join(repository, file)))
          .digest('hex'),
      ]),
    ),
  )
const before = await sourceHashes()
await cp(path.join(repository, 'src'), path.join(scratch, 'source/src'), {
  recursive: true,
})
if (JSON.stringify(before) !== JSON.stringify(await sourceHashes()))
  throw new Error('Current source changed while freezing; retry the snapshot')
const server = await createExperimentServer()
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const results = []
const rounds = Number(process.env.RENDERER_ROUNDS || 3)
try {
  console.log(
    `Chrome ${browser.version()}, ${rounds} rounds, identical 16ms chunk cadence`,
  )
  for (let round = 0; round < rounds; round++) {
    for (const fixture of corpus) {
      for (const renderer of round % 2
        ? ['streamdown', 'current']
        : ['current', 'streamdown']) {
        const context = await browser.newContext({
          viewport: { width: 1365, height: 900 },
        })
        const page = await context.newPage()
        await page.addInitScript(() => {
          const raf = window.requestAnimationFrame.bind(window)
          const cancel = window.cancelAnimationFrame.bind(window)
          const pending = new Set()
          window.requestAnimationFrame = (callback) => {
            const id = raf((timestamp) => {
              pending.delete(id)
              callback(timestamp)
            })
            pending.add(id)
            return id
          }
          window.cancelAnimationFrame = (id) => {
            pending.delete(id)
            cancel(id)
          }
          window.__rendererPendingFrames = () => pending.size
        })
        const errors = []
        page.on('pageerror', (error) => errors.push(error.message))
        await page.route('**/*', (route) => {
          const url = new URL(route.request().url())
          return url.hostname === '127.0.0.1' || url.hostname === 'localhost'
            ? route.continue()
            : route.abort()
        })
        await page.goto(`http://127.0.0.1:5194/?renderer=${renderer}`, {
          waitUntil: 'domcontentloaded',
        })
        await page.waitForFunction(() => Boolean(window.rendererExperiment), {
          timeout: 90000,
        })
        const frames = framesFor(fixture.text)
        const streaming = page.evaluate(async (chunks) => {
          const article = document.querySelector('#renderer')
          const sample = (window.__rendererSample = {
            started: performance.now(),
            firstContentMs: null,
            framesSent: 0,
            longTasks: [],
          })
          const mutations = new MutationObserver(() => {
            if (sample.firstContentMs === null && article.textContent.trim())
              sample.firstContentMs = performance.now() - sample.started
          })
          mutations.observe(article, {
            childList: true,
            subtree: true,
            characterData: true,
          })
          const longTasks = new PerformanceObserver((list) => {
            for (const item of list.getEntries())
              if (item.startTime >= sample.started)
                sample.longTasks.push({
                  start: item.startTime - sample.started,
                  duration: item.duration,
                })
          })
          longTasks.observe({ type: 'longtask' })
          for (const chunk of chunks) {
            window.rendererExperiment.push(chunk, true)
            sample.framesSent += 1
            await new Promise((resolve) => setTimeout(resolve, 16))
          }
          window.rendererExperiment.push(chunks.at(-1), false)
          sample.streamEndMs = performance.now() - sample.started
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          )
          mutations.disconnect()
          longTasks.disconnect()
          return { ...sample, owner: window.rendererExperiment.state() }
        }, frames)
        await page.waitForFunction(
          (midpoint) => window.__rendererSample?.framesSent >= midpoint,
          Math.ceil(frames.length / 2),
        )
        const clickStarted = await page.evaluate(() => performance.now())
        await page.locator('#interaction').click()
        await page.waitForFunction(
          () => document.querySelector('#click-count')?.textContent === '1',
        )
        const clickLatencyMs = await page.evaluate(
          (started) => performance.now() - started,
          clickStarted,
        )
        const metrics = await streaming
        await page
          .waitForFunction(
            (text) =>
              document.querySelector('#renderer')?.textContent?.includes(text),
            fixture.expect.text,
            { timeout: 10000 },
          )
          .catch(() => undefined)
        if (fixture.expect.diagram)
          await page
            .locator('#renderer svg[id]')
            .first()
            .waitFor({ state: 'visible', timeout: 12000 })
            .catch(() => undefined)
        if (fixture.expect.math)
          await page
            .waitForFunction(
              (count) =>
                document.querySelectorAll('#renderer .katex').length >= count,
              fixture.expect.math,
              { timeout: 3000 },
            )
            .catch(() => undefined)
        const finalDom = await page.locator('#renderer').evaluate((node) => ({
          text: node.textContent,
          code: node.querySelectorAll('code, .code-block').length,
          strong: node.querySelectorAll('strong, [data-streamdown="strong"]')
            .length,
          tableRows: node.querySelectorAll('tr').length,
          math: node.querySelectorAll('.katex').length,
          diagram: node.querySelectorAll('svg[id]').length,
          citationButtons: node.querySelectorAll('sup button').length,
          unsafeNodes: node.querySelectorAll(
            'script, iframe, object, embed, [onerror], [onclick], a[href^="javascript:"], a[href^="data:"]',
          ).length,
          executedProbe: window.__rendererProbe ?? null,
          html: node.innerHTML,
        }))
        const passed = Object.entries(fixture.expect).every(
          ([key, expected]) =>
            key === 'safe'
              ? finalDom.unsafeNodes === 0 && finalDom.executedProbe === null
              : key === 'text'
                ? finalDom.text.includes(expected)
                : finalDom[key] >= expected,
        )
        let citationPopover = null
        if (fixture.expect.citationButtons && finalDom.citationButtons) {
          await page.locator('#renderer sup button').first().click()
          citationPopover = await page
            .getByText('同语料引用片段', { exact: true })
            .isVisible()
            .catch(() => false)
          await page.keyboard.press('Escape')
        }
        if (round === 0)
          await page.screenshot({
            path: path.join(output, `${renderer}-${fixture.id}.png`),
            fullPage: true,
          })
        const leave = await page.evaluate(async () => {
          window.rendererExperiment.push('late after leaving', true)
          window.rendererExperiment.leave()
          const before = {
            ...window.rendererExperiment.state(),
            pendingFrames: window.__rendererPendingFrames(),
          }
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          )
          window.rendererExperiment.push('ignored late frame', false)
          return {
            before,
            after: {
              ...window.rendererExperiment.state(),
              pendingFrames: window.__rendererPendingFrames(),
            },
            remainingRendererNodes:
              document.querySelector('#renderer').childElementCount,
          }
        })
        await writeFile(
          path.join(output, `${round}-${renderer}-${fixture.id}.html.txt`),
          finalDom.html,
        )
        const { html, ...dom } = finalDom
        results.push({
          round,
          renderer,
          fixture: fixture.id,
          passed,
          citationPopover,
          clickLatencyMs,
          metrics,
          finalDom: dom,
          leave,
          errors,
        })
        console.log(
          `${round + 1}/${rounds} ${renderer} ${fixture.id}: ${passed ? 'pass' : 'FAIL'}; first=${metrics.firstContentMs?.toFixed(1)}ms; click=${clickLatencyMs.toFixed(1)}ms; longtasks=${metrics.longTasks.length}`,
        )
        await context.close()
      }
    }
  }
} finally {
  await browser.close()
  await server.close()
}
const report = {
  measuredAt: new Date().toISOString(),
  browser: browser.version(),
  node: process.version,
  rounds,
  cadenceMs: 16,
  sourceHashesBefore: before,
  sourceHashesAfter: await sourceHashes(),
  registry: JSON.parse(
    await readFile(path.join(scratch, 'registry.json'), 'utf8'),
  ),
  results,
}
await writeFile(
  path.join(output, 'results.json'),
  JSON.stringify(report, null, 2),
)
await writeFile(
  path.join(repository, 'experiments/markdown-renderer/evidence-summary.jsonl'),
  results
    .map(
      ({
        round,
        renderer,
        fixture,
        passed,
        citationPopover,
        clickLatencyMs,
        metrics,
        finalDom,
        leave,
        errors,
      }) =>
        JSON.stringify({
          round,
          renderer,
          fixture,
          passed,
          citationPopover,
          firstContentMs: metrics.firstContentMs,
          clickLatencyMs,
          streamEndMs: metrics.streamEndMs,
          longTasks: metrics.longTasks,
          finalDom: { ...finalDom, text: undefined },
          leave,
          errors,
        }),
    )
    .join('\n') + '\n',
)
console.log(`Raw evidence: ${output}/results.json`)
