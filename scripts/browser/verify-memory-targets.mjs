import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { withOwnedMemoryBrowser } from './owned-memory-browser.mjs'
import { installWorkspaceFixtures } from './workspace-fixtures.mjs'
import { installMemoryTargetsFixture } from './memory-targets-fixture.mjs'

await withOwnedMemoryBrowser(async ({ browser, baseURL, output, event }) => {
  const captures = [],
    checks = []
  for (const [locale, mode, mobile] of [
    ['en-US', 'light', false],
    ['zh-CN', 'dark', false],
    ['en-US', 'light', true],
    ['zh-CN', 'dark', true],
  ]) {
    const en = locale === 'en-US',
      viewport = mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1100 }
    const context = await browser.newContext({
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
      const fixture = await installMemoryTargetsFixture(context, (message) =>
          event('fixture-error', { message }),
        ),
        page = await context.newPage(),
        errors = []
      page.setDefaultTimeout(10000)
      page.on('pageerror', (error) => errors.push(error.message))
      const button = (a, b) =>
          page.getByRole('button', { name: en ? a : b, exact: true }),
        label = (a, b) => page.getByLabel(en ? a : b, { exact: true })
      const capture = async (surface) => {
        const file = `targets-${mobile ? 'mobile' : 'desktop'}-${surface}-${mode}-${locale}.png`
        event('reserve-capture', {
          file: `${output}/${file}`,
          route: new URL(page.url()).pathname,
          viewport,
        })
        await page.screenshot({ path: `${output}/${file}` })
        captures.push({
          file,
          route: new URL(page.url()).pathname,
          viewport: `${viewport.width}x${viewport.height}`,
          surface,
          locale,
          mode,
          mobile,
        })
      }
      const fit = async () =>
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          'No horizontal viewport overflow',
        )
      const request = () => button('Suggest targets explicitly', '显式推荐目标')
      const apply = () =>
        button('Use selected entries as targets', '将勾选条目用作目标')
      const boxes = () =>
        page.getByRole('checkbox', {
          name: en
            ? 'Include as a possible correction target'
            : '纳入可提出修订的目标',
          exact: true,
        })
      await page.goto(`${baseURL}/memory/owned-memory/maintenance`)
      await label('RAW source IDs', 'RAW 来源 ID').fill(fixture.input)
      await label('Exact user subject ID', '精确用户主体 ID').fill(' alpha ')
      assert.equal(fixture.calls.recommend.length, 0)
      await request().click()
      await boxes().first().waitFor()
      assert.equal(await boxes().count(), 2)
      assert.equal(await boxes().first().isChecked(), false)
      assert.equal(await apply().isDisabled(), true)
      assert.equal(
        await page.evaluate(() => window.untrustedTargetExecuted),
        undefined,
      )
      await page
        .getByText(en ? 'Source dependencies' : '来源依赖', { exact: true })
        .first()
        .click()
      await boxes().first().scrollIntoViewIfNeeded()
      await fit()
      await capture('recommendations')
      assert.ok(
        await page
          .locator('article')
          .first()
          .evaluate((article) => {
            const boundary = article.getBoundingClientRect()
            return [...article.querySelectorAll('pre,p,dd')].every(
              (element) => {
                const r = document.createRange()
                r.selectNodeContents(element)
                return [...r.getClientRects()].every(
                  (rect) =>
                    !rect.width ||
                    (rect.left >= boundary.left - 1 &&
                      rect.right <= boundary.right + 1),
                )
              },
            )
          }),
        'Long identifiers and source metadata wrap inside the recommendation card',
      )
      await boxes().first().click()
      await apply().click()
      await button('Create input snapshot', '创建输入快照').click()
      await page.waitForURL(
        (url) => url.searchParams.get('job') === 'a'.repeat(32),
      )
      assert.equal(fixture.calls.create.length, 1)
      assert.equal(fixture.calls.recommend.length, 1)
      await page.reload()
      await button('Submit background analysis', '提交后台分析').waitFor()
      assert.equal(fixture.calls.recommend.length, 1)
      assert.equal(fixture.calls.run, 0)
      await page.goto(`${baseURL}/memory/owned-memory/maintenance/batches`)
      await button('Preview sources and coverage', '预览来源与覆盖').waitFor()
      assert.equal(await request().isDisabled(), true)
      for (const id of ['user', 'agent']) {
        await page.locator(`#incremental-scope-${id}-match`).click()
        await page
          .getByRole('option', {
            name: en ? 'Exact value' : '精确值',
            exact: true,
          })
          .click()
      }
      await page.locator('#incremental-scope-user').fill(' alpha ')
      await label(
        'RAW source IDs for this recommendation (up to 8)',
        '本次推荐使用的 RAW 来源 ID（最多 8 个）',
      ).fill(fixture.input)
      await request().click()
      await boxes().first().waitFor()
      await boxes().first().click()
      await apply().click()
      await button('Preview sources and coverage', '预览来源与覆盖').click()
      await button('Save batch plan', '保存批次计划').waitFor()
      assert.equal(fixture.calls.preview.at(-1).scope.session_id, null)
      assert.equal(
        fixture.calls.preview.at(-1).target_preconditions.targets.length,
        1,
      )
      await button('Save batch plan', '保存批次计划').scrollIntoViewIfNeeded()
      await fit()
      await capture('bound-preview')
      fixture.makeStale()
      await button('Preview sources and coverage', '预览来源与覆盖').click()
      await page
        .getByText(
          en
            ? 'The sources, scope or target versions changed. Request new suggestions and preview again; the saved text is not silently replaced.'
            : '来源、范围或目标版本已变更。请重新推荐并预览；不会静默换成新的正文。',
          { exact: true },
        )
        .waitFor()
      assert.equal(
        await button(
          'Preview sources and coverage',
          '预览来源与覆盖',
        ).isDisabled(),
        true,
      )
      assert.equal(await boxes().first().isDisabled(), true)
      assert.equal(fixture.calls.recommend.length, 2)
      assert.equal(fixture.calls.run, 0)
      assert.equal(fixture.calls.publish, 0)
      await request().scrollIntoViewIfNeeded()
      await fit()
      await capture('stale')
      assert.deepEqual(errors, [])
      assert.deepEqual(fixture.errors, [])
      checks.push({
        locale,
        mode,
        viewport,
        passed: true,
        explicitZeroDefaultSelection: true,
        exactSubjectPreserved: true,
        closureBoundToSelectedTargets: true,
        readonlyRefresh: true,
        noAutomaticModelRetry: true,
        staleRequiresNewRecommendation: true,
        automaticAnalysisOrPublication: false,
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
