import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { withOwnedMemoryBrowser } from './owned-memory-browser.mjs'
import { installWorkspaceFixtures } from './workspace-fixtures.mjs'
import { installMemoryIncrementalFixture } from './memory-incremental-fixture.mjs'

await withOwnedMemoryBrowser(async ({ browser, baseURL, output, event }) => {
  const captures = [],
    checks = []
  for (const [locale, mode, mobile] of [
    ['en-US', 'light', false],
    ['zh-CN', 'dark', false],
    ['en-US', 'light', true],
    ['zh-CN', 'dark', true],
  ]) {
    const viewport = mobile
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
      const fixture = await installMemoryIncrementalFixture(
        context,
        (message) => event('fixture-error', { message }),
      )
      const page = await context.newPage(),
        errors = [],
        en = locale === 'en-US'
      page.setDefaultTimeout(10000)
      page.on('pageerror', (error) => errors.push(error.message))
      const button = (english, chinese) =>
        page.getByRole('button', { name: en ? english : chinese, exact: true })
      const capture = async (surface) => {
        const file = `incremental-${mobile ? 'mobile' : 'desktop'}-${surface}-${mode}-${locale}.png`
        event('reserve-capture', {
          file: `${output}/${file}`,
          route: new URL(page.url()).pathname,
          viewport,
        })
        await page.screenshot({ path: `${output}/${file}` })
        captures.push({
          file,
          route: new URL(page.url()).pathname,
          url: page.url(),
          viewport: `${viewport.width}x${viewport.height}`,
          surface,
          mobile,
          locale,
          mode,
        })
      }
      const fitWidth = async () =>
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          'No horizontal viewport overflow',
        )
      if (mobile) {
        fixture.primeMixed()
        await page.goto(
          `${baseURL}/memory/owned-memory/maintenance/batches?batch=${fixture.discoveryId}`,
        )
        await page
          .getByText(en ? 'Deferred / blocked' : '延期或受阻', { exact: true })
          .last()
          .waitFor()
        await page
          .getByRole('heading', {
            name: en ? 'Selected plan and child jobs' : '当前计划与子任务',
            exact: true,
          })
          .scrollIntoViewIfNeeded()
        await fitWidth()
        const titleBox = await page
          .getByRole('heading', { level: 1 })
          .boundingBox()
        assert.ok(
          titleBox.width >= viewport.width * 0.6,
          'Mobile heading must retain readable width beside actions',
        )
        const profileButton = button(
          'Read current coverage with this plan’s settings',
          '按此计划配置读取当前覆盖',
        )
        assert.ok(
          await profileButton.evaluate((element) => {
            const own = element.getBoundingClientRect(),
              parent = element.parentElement.getBoundingClientRect()
            return own.right <= parent.right + 1 && own.left >= parent.left - 1
          }),
          'Long action must fit inside its card',
        )
        await capture('mixed')
        await page
          .getByText(
            en ? 'Coverage settings and provenance' : '覆盖配置与来源依据',
            { exact: true },
          )
          .click()
        await page
          .getByText(en ? 'Coverage profile fingerprint' : '覆盖配置指纹', {
            exact: true,
          })
          .scrollIntoViewIfNeeded()
        await fitWidth()
        await capture('profile')
        assert.equal(fixture.commands.create.length, 0)
        assert.equal(fixture.commands.runs.length, 0)
        assert.deepEqual(fixture.errors, [])
        checks.push({
          locale,
          mode,
          viewport,
          passed: true,
          readOnlyMobileRecovery: true,
          horizontalOverflow: false,
        })
        continue
      }
      await page.goto(`${baseURL}/memory/owned-memory/maintenance`)
      await page
        .getByRole('link', {
          name: en ? 'Incremental batches' : '增量批次',
          exact: true,
        })
        .click()
      await button('Preview sources and coverage', '预览来源与覆盖').waitFor()
      for (const dimension of ['User subject ID', 'Agent ID']) {
        const label =
          dimension === 'User subject ID'
            ? en
              ? dimension
              : '用户主体 ID'
            : 'Agent ID'
        await page.getByRole('combobox', { name: label, exact: true }).click()
        await page
          .getByRole('option', {
            name: en ? 'Exact value' : '精确值',
            exact: true,
          })
          .click()
      }
      await page
        .getByRole('textbox', { name: 'Agent ID', exact: true })
        .fill(' agent ')
      await page
        .getByLabel(en ? 'Source slots per child' : '每个子任务的来源槽位', {
          exact: true,
        })
        .fill('1')
      await page
        .getByLabel(en ? 'Primary version limit' : '本次主来源版本上限', {
          exact: true,
        })
        .fill('3')
      await button('Preview sources and coverage', '预览来源与覆盖').click()
      await button('Save batch plan', '保存批次计划').waitFor()
      assert.deepEqual(fixture.commands.preview[0].scope, {
        user_id: '',
        agent_id: ' agent ',
        session_id: null,
      })
      await page
        .getByRole('heading', {
          name: en
            ? 'Source preview and current coverage'
            : '来源预览与当前覆盖',
          exact: true,
        })
        .scrollIntoViewIfNeeded()
      await capture('preview')
      await button('Save batch plan', '保存批次计划').click()
      await button('Find original request', '查找原请求').first().waitFor()
      assert.ok(new URL(page.url()).searchParams.get('request'))
      fixture.revealPlan()
      // Reload is a read-only recovery action; lookup polling may already have found the plan.
      await page.reload()
      await page.waitForURL(
        (url) => url.searchParams.get('batch') === fixture.discoveryId,
      )
      assert.equal(
        await page
          .getByRole('link', {
            name: en ? 'Review original job' : '审核原任务',
            exact: true,
          })
          .count(),
        0,
      )
      await page.reload()
      await button('Submit bounded child jobs', '提交有界子任务').waitFor()
      assert.equal(fixture.commands.create.length, 1)
      assert.equal(fixture.commands.runs.length, 0)
      await page
        .getByRole('heading', {
          name: en ? 'Selected plan and child jobs' : '当前计划与子任务',
          exact: true,
        })
        .scrollIntoViewIfNeeded()
      await capture('restored')
      await button('Submit bounded child jobs', '提交有界子任务').click()
      await button('Retry original submission', '重试原推进请求').waitFor()
      const original = fixture.commands.runs[0]
      assert.equal(
        new URL(page.url()).searchParams.get('run'),
        original.operation_id,
      )
      assert.equal(new URL(page.url()).searchParams.get('run_limit'), '1')
      await page.reload()
      await button('Retry original submission', '重试原推进请求').waitFor()
      assert.equal(fixture.commands.runs.length, 1)
      assert.equal(
        await page
          .getByLabel(
            en ? 'Children per explicit submission' : '每次显式提交的子任务数',
            { exact: true },
          )
          .isDisabled(),
        true,
      )
      await button(
        'Retry original submission',
        '重试原推进请求',
      ).scrollIntoViewIfNeeded()
      await capture('unknown')
      await button('Retry original submission', '重试原推进请求').click()
      await button('Submit bounded child jobs', '提交有界子任务').waitFor()
      assert.deepEqual(fixture.commands.runs[1], original)
      await page
        .getByLabel(
          en ? 'Children per explicit submission' : '每次显式提交的子任务数',
          { exact: true },
        )
        .fill('2')
      await button('Submit bounded child jobs', '提交有界子任务').click()
      await page
        .getByText('maintenance_input_budget_exceeded', { exact: false })
        .waitFor()
      fixture.setMixed()
      await button('Read latest status', '读取最新状态').first().click()
      await page
        .getByText('fixture_analysis_failed', { exact: false })
        .waitFor()
      await page
        .getByRole('heading', {
          name: en ? 'Selected plan and child jobs' : '当前计划与子任务',
          exact: true,
        })
        .scrollIntoViewIfNeeded()
      await capture('mixed')
      await button(
        'Read current coverage with this plan’s settings',
        '按此计划配置读取当前覆盖',
      ).click()
      await page
        .getByRole('heading', {
          name: en
            ? 'Source preview and current coverage'
            : '来源预览与当前覆盖',
          exact: true,
        })
        .scrollIntoViewIfNeeded()
      assert.deepEqual(fixture.commands.preview.at(-1).scope, {
        user_id: '',
        agent_id: ' agent ',
        session_id: null,
      })
      await capture('coverage')
      await page
        .getByRole('link', {
          name: en ? 'Review original job' : '审核原任务',
          exact: true,
        })
        .first()
        .click()
      await page
        .getByText('Controlled proposal waiting for human review.', {
          exact: true,
        })
        .waitFor()
      await page
        .getByText('Controlled proposal waiting for human review.', {
          exact: true,
        })
        .scrollIntoViewIfNeeded()
      await capture('review')
      assert.equal(fixture.commands.create.length, 1)
      assert.equal(fixture.commands.runs.length, 3)
      assert.equal(fixture.distinctRunCommands, 2)
      assert.equal(fixture.commands.cancel.length, 0)
      assert.equal(fixture.commands.review, 0)
      assert.equal(fixture.commands.publish, 0)
      assert.deepEqual(errors, [])
      assert.deepEqual(fixture.errors, [])
      checks.push({
        locale,
        mode,
        viewport,
        passed: true,
        preservedExactEmptyScope: true,
        serverCreationRecovery: true,
        refreshDidNotSubmit: true,
        unknownRunReplayedOriginalLimit: true,
        boundedSubmissions: [1, 2],
        deferredWholeSource: true,
        failedChildNotCovered: true,
        frozenCountsSeparateFromCurrentCoverage: true,
        manualChildReviewLink: true,
        automaticReviewOrPublication: false,
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
