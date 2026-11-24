import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { withOwnedMemoryBrowser } from './owned-memory-browser.mjs'
import { installWorkspaceFixtures } from './workspace-fixtures.mjs'
import { installMemoryStartupFixture } from './memory-startup-fixture.mjs'
import { memoryStartupMessages as enMessages } from '../../src/locales/en-US/memory-startup.ts'
import { memoryStartupMessages as zhMessages } from '../../src/locales/zh-CN/memory-startup.ts'
await withOwnedMemoryBrowser(async ({ browser, baseURL, output, event }) => {
  const captures = [],
    checks = []
  for (const [locale, mode, mobile] of [
    ['en-US', 'light', false],
    ['zh-CN', 'dark', false],
    ['en-US', 'light', true],
    ['zh-CN', 'dark', true],
  ]) {
    if (process.argv.includes('--mobile-only') && !mobile) continue
    if (process.argv.includes('--statistics-only') && mobile) continue
    const messages = locale === 'en-US' ? enMessages : zhMessages,
      viewport = mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1100 },
      context = await browser.newContext({
        viewport,
        locale,
        reducedMotion: 'reduce',
      })
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
      const fixture = await installMemoryStartupFixture(context, (message) =>
          event('fixture-error', { message }),
        ),
        page = await context.newPage(),
        errors = []
      page.setDefaultTimeout(10000)
      page.on('pageerror', (error) => errors.push(error.message))
      const button = (key) =>
          page.getByRole('button', { name: messages[key], exact: true }),
        region = (key) =>
          page.getByRole('region', { name: messages[key], exact: true })
      const fit = async () => {
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        )
        const escaped = await page
          .locator('main button, main pre, main article')
          .evaluateAll((nodes) =>
            nodes
              .filter((n) => {
                const parent =
                  n.closest('section[aria-label]') ?? n.parentElement
                if (!parent) return false
                const rect = n.getBoundingClientRect(),
                  outer = parent.getBoundingClientRect()
                return (
                  rect.width > 0 &&
                  (rect.right > outer.right + 1 || rect.left < outer.left - 1)
                )
              })
              .map((n) => n.textContent?.slice(0, 80)),
          )
        assert.deepEqual(escaped, [])
      }
      const capture = async (surface) => {
        const file = `startup-${mobile ? 'mobile' : 'desktop'}-${surface}-${mode}-${locale}.png`
        event('reserve-capture', {
          file: `${output}/${file}`,
          route: new URL(page.url()).pathname,
          viewport,
        })
        await page.screenshot({ path: `${output}/${file}` })
        captures.push({
          file,
          route: new URL(page.url()).pathname,
          viewport,
          surface,
          locale,
          mode,
        })
      }
      await page.goto(`${baseURL}/memory/owned-memory/startup`)
      await button('preview').waitFor()
      assert.equal(fixture.calls.preview.length, 0)
      assert.equal(fixture.calls.source.length, 0)
      await page.getByLabel(messages.user, { exact: true }).fill(' alpha ')
      await button('preview').click()
      await region('result').waitFor()
      assert.equal(fixture.calls.preview.length, 1)
      assert.equal(await page.evaluate(() => window.startupInjected), undefined)
      if (process.argv.includes('--statistics-only')) {
        await region('omitted').scrollIntoViewIfNeeded()
        await page
          .getByText(
            messages.selectionCounts
              .replace('{{scanned}}', '4')
              .replace('{{limit}}', '64')
              .replace('{{reads}}', '256'),
            { exact: true },
          )
          .waitFor()
        await fit()
        await capture('selection')
        assert.deepEqual(errors, [])
        assert.deepEqual(fixture.errors, [])
        checks.push({
          locale,
          mode,
          viewport,
          passed: true,
          boundedSelectionStatistics: true,
        })
        event('scenario', checks.at(-1))
        continue
      }
      await region('result').scrollIntoViewIfNeeded()
      await fit()
      await capture('preview')
      await region('items').scrollIntoViewIfNeeded()
      await fit()
      await capture('entries')
      await button('readSource').click()
      await button('first').click()
      const source = region('sourceTitle')
      await source.locator('pre').waitFor()
      await button('next').click()
      await page.waitForFunction(
        () => document.querySelector('section[aria-label] pre') !== null,
      )
      await source.locator('pre').filter({ hasText: '原文' }).waitFor()
      await source.scrollIntoViewIfNeeded()
      await fit()
      await capture('source')
      assert.equal(fixture.calls.source.at(-1).offset, '512')
      await button('first').click()
      await source.locator('pre').waitFor()
      fixture.changeSource()
      await button('next').click()
      await page.getByText(messages.stale, { exact: true }).waitFor()
      assert.equal(await page.locator('main pre').count(), 0)
      const posted = fixture.calls.preview.length
      await page.reload()
      await button('preview').waitFor()
      assert.equal(fixture.calls.preview.length, posted)
      assert.equal(await page.locator('main pre').count(), 0)
      assert.deepEqual(errors, [])
      assert.deepEqual(fixture.errors, [])
      checks.push({
        locale,
        mode,
        viewport,
        passed: true,
        explicitOnly: true,
        unicodeContinuation: true,
        staleReadClearsBody: true,
        refreshDoesNotGenerate: true,
        plaintext: true,
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
