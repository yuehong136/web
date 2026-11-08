import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { installWorkspaceFixtures } from './workspace-fixtures.mjs'

/** localhost is a secure context; use a routed HTTP host to exercise real limits. */
export async function verifyHttpHome(browser, { baseURL, output }) {
  const origin = 'http://web-fixture.invalid'
  const context = await browser.newContext({ locale: 'en-US' })
  const state = await installWorkspaceFixtures(context)
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.origin !== origin) return route.abort()
    if (/^\/(api\/)?v1\//.test(url.pathname)) return route.fallback()
    const response = await route.fetch({
      url: `${baseURL}${url.pathname}${url.search}`,
    })
    return route.fulfill({ response })
  })
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await page.goto(`${origin}/home`)
    const capabilities = await page.evaluate(() => ({
      secureContext: window.isSecureContext,
      nativeRandomUUID: typeof crypto.randomUUID,
      getRandomValues: typeof crypto.getRandomValues,
    }))
    assert.equal(capabilities.secureContext, false)
    assert.equal(capabilities.nativeRandomUUID, 'undefined')
    assert.equal(capabilities.getRandomValues, 'function')
    const input = page.locator('textarea[aria-label]').first()
    await input.waitFor()
    await page
      .getByRole('button', { name: 'Select skills or apps', exact: true })
      .click()
    await page.getByRole('button', { name: 'Apps', exact: true }).click()
    await page
      .getByRole('button', { name: /Research assistant/ })
      .first()
      .click()
    await input.fill('Check HTTP conversation IDs')
    await input.press('Enter')
    await page.locator('[data-run-phase="completed"]').last().waitFor()
    assert.equal(state.completions, 1)
    assert.match(
      await page.locator('[data-message-role="assistant"]').last().innerText(),
      /Evidence-backed answer/,
    )
    assert.deepEqual(errors, [])
    const result = {
      capabilities,
      checks: [
        'Authenticated Home renders on ordinary HTTP',
        'Scope reset and message IDs work without native randomUUID',
        'Controlled app completion reaches completed state',
      ],
      pageErrors: errors,
    }
    writeFileSync(
      `${output}/http-home.json`,
      `${JSON.stringify(result, null, 2)}\n`,
    )
    return result
  } catch (error) {
    await page
      .screenshot({ path: `${output}/http-home-failure.png` })
      .catch(() => {})
    writeFileSync(
      `${output}/http-home-failure.txt`,
      `${error.stack}\n${await page
        .locator('body')
        .innerText()
        .catch(() => '')}`,
    )
    throw error
  } finally {
    await context.close()
  }
}
