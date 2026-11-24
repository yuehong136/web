import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { withOwnedMemoryBrowser } from './owned-memory-browser.mjs'
import { installWorkspaceFixtures } from './workspace-fixtures.mjs'
import { installMemoryIncrementalFixture } from './memory-incremental-fixture.mjs'
import {
  compactionCapability,
  compactionResult,
  compactionList,
} from '../../src/components/memory/__tests__/memory-compaction-fixtures.ts'
import {
  retentionCapability,
  retentionInventory,
  retentionPreview,
  retirementReceipt,
} from '../../src/components/memory/__tests__/memory-compaction-retention-fixtures.ts'

const memoryId = 'owned-memory'
const initial = compactionResult()
const operationId = initial.operation.operation_id
const artifactId = initial.artifact.artifact_id
initial.operation.memory_id = initial.artifact.memory_id = memoryId
for (const source of [
  ...initial.artifact.sources,
  ...initial.artifact.package.lineage,
])
  source.locator.memory_id = memoryId
const routePath = `/memory/${memoryId}/compaction`

await withOwnedMemoryBrowser(async ({ browser, baseURL, output, event }) => {
  const checks = [],
    captures = []
  for (const [locale, mode, viewport] of [
    ['en-US', 'light', { width: 1440, height: 1100 }],
    ['zh-CN', 'dark', { width: 390, height: 844 }],
  ]) {
    const context = await browser.newContext({
      viewport,
      locale,
      reducedMotion: 'reduce',
    })
    const english = locale === 'en-US',
      errors = []
    let current = initial,
      previewReads = 0,
      confirmations = 0,
      operationReads = 0
    try {
      await installWorkspaceFixtures(context)
      await context.addInitScript(
        ({ locale, mode }) => {
          localStorage.setItem('i18n_language', locale)
          localStorage.setItem(
            'appearance',
            JSON.stringify({
              preset: 'studio',
              mode,
              density: 'comfortable',
              textScale: 1,
              motion: 'reduced',
            }),
          )
        },
        { locale, mode },
      )
      const base = await installMemoryIncrementalFixture(context, (message) =>
        errors.push(message),
      )
      await context.route(
        `**/api/v1/memories/${memoryId}/**`,
        async (route) => {
          const request = route.request(),
            path = new URL(request.url()).pathname
          if (
            !path.endsWith('/capabilities') &&
            !path.includes('/context-compaction')
          )
            return route.fallback()
          try {
            let data,
              status = 200
            const method = request.method(),
              retired = !!current.artifact.retired_at
            if (path.endsWith('/retirements')) {
              assert.equal(method, 'POST')
              assert.ok(path.endsWith(`/${artifactId}/retirements`))
              assert.equal(++confirmations, 1)
              assert.deepEqual(request.postDataJSON(), {
                expected_preview_sha256:
                  retentionPreview(current).preview_sha256,
              })
              current = retirementReceipt(current)
              status = english ? 200 : 503
              data = english ? current : { operation_id: operationId }
            } else {
              assert.equal(method, 'GET')
              if (path.endsWith('/capabilities'))
                data = {
                  ...base.capabilities,
                  context_compactions: {
                    ...compactionCapability,
                    retention: retentionCapability,
                  },
                }
              else if (path.endsWith('/inventory'))
                data = retentionInventory(memoryId, retired)
              else if (path.endsWith('/retention-preview')) {
                assert.ok(path.endsWith(`/${artifactId}/retention-preview`))
                previewReads++
                data = retentionPreview(current)
              } else if (
                path.endsWith(`/context-compaction-operations/${operationId}`)
              ) {
                operationReads++
                data = current
              } else if (path.endsWith('/context-compactions')) {
                data = compactionList()
                Object.assign(data.items[0], {
                  memory_id: memoryId,
                  state: current.artifact.state,
                  retired_at: current.artifact.retired_at,
                })
              } else throw new Error('Unexpected compaction endpoint')
            }
            await route.fulfill({
              status,
              json: { retcode: status === 200 ? 0 : status, data },
            })
          } catch (error) {
            errors.push(String(error))
            await route.fulfill({ status: 500, json: { retcode: 500 } })
          }
        },
      )
      const page = await context.newPage()
      page.setDefaultTimeout(15000)
      page.on('pageerror', (error) => errors.push(error.message))
      const button = (en, zh) =>
        page.getByRole('button', { name: english ? en : zh, exact: true })
      const preview = button('Preview artifact cleanup', '预览产物清理范围')
      const confirm = button('Confirm artifact cleanup', '确认清理此产物')
      const recover = button('Read original cleanup receipt', '读取原清理回执')
      const summary = page.getByText('Owned summary', { exact: false })
      const capture = async (surface) => {
        const file = `retention-${surface}-${mode}-${locale}.png`
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        event('reserve-capture', {
          file: `${output}/${file}`,
          route: routePath,
          viewport,
        })
        await page.screenshot({ path: `${output}/${file}` })
        captures.push({ file, route: routePath, viewport, mode, locale })
      }
      await page.goto(
        `${baseURL}${routePath}?compaction_operation=${operationId}`,
      )
      await preview.waitFor()
      await summary.waitFor()
      assert.equal(previewReads, 0)
      assert.equal(confirmations, 0)
      assert.equal(await page.evaluate(() => window.__unsafe), undefined)
      await preview.click()
      await confirm.waitFor()
      assert.equal(await confirm.isDisabled(), true)
      assert.equal(previewReads, 1)
      const checkbox = page.getByRole('checkbox')
      await checkbox.focus()
      await page.keyboard.press('Space')
      assert.equal(await checkbox.getAttribute('aria-checked'), 'true')
      assert.equal(await confirm.isEnabled(), true)
      await confirm.scrollIntoViewIfNeeded()
      await capture('preview')
      await confirm.click()
      if (!english) {
        await page.getByText('清理结果尚未确认', { exact: false }).waitFor()
        await recover.click()
      }
      await page
        .getByText(
          english ? 'Artifact content has been cleared.' : '产物正文已清除。',
          { exact: false },
        )
        .first()
        .waitFor()
      await summary.waitFor({ state: 'hidden' })
      assert.equal(
        new URL(page.url()).searchParams.get('compaction_operation'),
        operationId,
      )
      const beforeReload = operationReads
      await page.reload()
      await recover.waitFor()
      assert.ok(operationReads > beforeReload)
      assert.equal(confirmations, 1)
      assert.equal(previewReads, 1)
      assert.equal(await preview.count(), 0)
      assert.equal(await summary.count(), 0)
      await recover.scrollIntoViewIfNeeded()
      await capture('receipt')
      assert.deepEqual(errors, [])
      checks.push({
        locale,
        mode,
        viewport,
        keyboardAcknowledgment: true,
        noMutationOnRefresh: true,
        unknownRecovery: !english,
        confirmations,
      })
      event('scenario', checks.at(-1))
    } finally {
      await context.close()
    }
  }
  event('reserve-result', { path: `${output}/results.json` })
  writeFileSync(
    `${output}/results.json`,
    JSON.stringify({ captures, checks }, null, 2),
  )
  console.log(JSON.stringify({ passed: true, output, checks }))
})
