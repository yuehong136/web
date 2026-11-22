import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { withOwnedMemoryBrowser } from './owned-memory-browser.mjs'
import { installWorkspaceFixtures } from './workspace-fixtures.mjs'
import { installMemoryVerificationFixture } from './memory-verification-fixture.mjs'
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
      const fixture = await installMemoryVerificationFixture(
          context,
          (message) => event('fixture-error', { message }),
        ),
        page = await context.newPage(),
        errors = []
      page.setDefaultTimeout(10000)
      page.on('pageerror', (error) => errors.push(error.message))
      const button = (a, b) =>
          page.getByRole('button', { name: en ? a : b, exact: true }),
        label = (a, b) => page.getByLabel(en ? a : b, { exact: true })
      const capture = async (surface) => {
        const file = `verification-${mobile ? 'mobile' : 'desktop'}-${surface}-${mode}-${locale}.png`
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
          mobile,
          locale,
          mode,
        })
      }
      const fit = async () =>
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          'No horizontal viewport overflow',
        )
      await page.goto(
        `${baseURL}/memory/owned-memory/verification?verification_entry=${fixture.eid}`,
      )
      await button(
        'Read snapshot for explicit review',
        '读取快照以显式核验',
      ).waitFor()
      assert.equal(fixture.calls.snapshot, 0)
      assert.equal(fixture.calls.record.length, 0)
      await page
        .getByText(
          en
            ? 'The bounded scan reached its limit. More items may remain; an empty page does not establish that there are no disputes or reviews.'
            : '有界扫描已达到上限，后面可能还有条目；当前页为空不代表没有争议或待复核内容。',
          { exact: true },
        )
        .waitFor()
      await fit()
      await capture('queue')
      await button(
        'Read snapshot for explicit review',
        '读取快照以显式核验',
      ).click()
      await page
        .getByRole('region', {
          name: en ? 'Snapshot under review' : '本次核验快照',
          exact: true,
        })
        .waitFor()
      assert.equal(
        await page.evaluate(() => window.verificationInjected),
        undefined,
      )
      assert.equal(
        await page
          .getByRole('link', {
            name: en
              ? 'Open memory workspace to inspect RAW sources'
              : '打开记忆工作区核对 RAW 来源',
            exact: true,
          })
          .getAttribute('target'),
        '_blank',
      )
      await label('Applicable scope and conditions', '适用范围与条件').fill(
        'Only the displayed controlled entry/source versions. 仅适用当前受控版本。',
      )
      await label('Evidence and checks performed', '依据及已执行的检查').fill(
        'Human compared the controlled source. This is a limited human statement. 人工对照来源，不是自动事实保证。',
      )
      await label('Conclusion', '结论').click()
      await page
        .getByRole('option', {
          name: en ? 'Human confirmed (this version)' : '人工确认（本版本）',
          exact: true,
        })
        .click()
      await page
        .getByRole('checkbox', {
          name: en
            ? 'I reviewed the displayed entry and source versions and understand the limited scope of my assessment.'
            : '我已阅读展示的条目与来源版本，并理解本次人工判断的适用范围。',
          exact: true,
        })
        .click()
      await page
        .getByRole('region', {
          name: en ? 'Snapshot under review' : '本次核验快照',
          exact: true,
        })
        .scrollIntoViewIfNeeded()
      await fit()
      await capture('snapshot')
      await label('Conclusion', '结论').scrollIntoViewIfNeeded()
      await fit()
      await capture('review')
      if (process.argv.includes('--review-delta') && !mobile) {
        checks.push({
          locale,
          mode,
          viewport,
          passed: true,
          reviewFormOnly: true,
          noPost: true,
        })
        event('scenario', checks.at(-1))
        continue
      }
      fixture.failNextRecord()
      await button('Record human assessment', '记录人工判断').click()
      await page
        .getByText(
          en
            ? 'This operation has not been read successfully.'
            : '尚未成功读取此操作',
          { exact: false },
        )
        .waitFor()
        .catch(async () => {
          await page
            .getByText(
              en ? 'The recording result is unconfirmed.' : '记录结果尚未确认',
              { exact: false },
            )
            .waitFor()
        })
      const original = new URL(page.url()).searchParams.get(
        'verification_operation',
      )
      assert.ok(original)
      assert.equal(fixture.calls.record.length, 1)
      await page.reload()
      await button('Read status', '读取状态').waitFor()
      assert.equal(fixture.calls.record.length, 1)
      assert.equal(
        await button('Retry original recording', '重试原记录命令').count(),
        0,
      )
      fixture.releaseReceipt()
      await button('Read status', '读取状态').click()
      await page
        .getByText(
          en
            ? 'The human record was saved in SQL. Its current applicability is shown below; this is separate from memory publication or factual certainty.'
            : '人工判断已记录到 SQL。下方另外展示它是否仍适用于当前版本；这不同于记忆发布或事实保证。',
          { exact: true },
        )
        .waitFor()
      await page
        .getByText(
          en
            ? 'No separate human check time was reported. This default is the submission time; it does not mean the server performed a factual check.'
            : '未单独报告人工检查时刻，此处默认使用提交时刻；不表示服务端执行了事实核验。',
          { exact: true },
        )
        .first()
        .waitFor()
      assert.equal(
        new URL(page.url()).searchParams.get('verification_operation'),
        original,
      )
      assert.equal(fixture.calls.record.length, 1)
      await button(
        'Close this receipt and prepare another review',
        '关闭此回执并准备另一次核验',
      ).scrollIntoViewIfNeeded()
      await fit()
      await capture('confirmed')
      assert.ok(
        await page
          .getByRole('button', {
            name: en
              ? 'Close this receipt and prepare another review'
              : '关闭此回执并准备另一次核验',
            exact: true,
          })
          .evaluate((button) => {
            const card = button.parentElement.getBoundingClientRect(),
              box = button.getBoundingClientRect()
            return box.right <= card.right + 1 && box.left >= card.left - 1
          }),
        'Long receipt action stays inside its card',
      )
      await button(
        'Close this receipt and prepare another review',
        '关闭此回执并准备另一次核验',
      ).click()
      fixture.changeSource()
      await button('Read latest review state', '读取最新核验状态').click()
      await page
        .getByText(
          en ? 'Outdated binding — needs review' : '版本绑定已过期 — 待复核',
          { exact: true },
        )
        .first()
        .waitFor()
      assert.equal(
        await page
          .getByText(
            en
              ? 'Human confirmed — valid for this current binding'
              : '人工确认 — 仍适用于当前绑定',
            { exact: true },
          )
          .count(),
        0,
      )
      await page
        .getByText(en ? 'Verification history' : '核验历史', { exact: true })
        .scrollIntoViewIfNeeded()
      await fit()
      await capture('stale')
      fixture.withdraw()
      await page.reload()
      await page
        .getByText(
          en
            ? 'Related content was permanently withdrawn. Human notes, references and applicability have been removed from this view.'
            : '关联内容已永久撤回，此视图不再提供人工备注、参考出处和适用范围。',
          { exact: true },
        )
        .first()
        .waitFor()
      assert.equal(
        await page
          .getByText('Private human verification notes', { exact: true })
          .count(),
        0,
      )
      assert.equal(await page.locator('a[href^="javascript:"]').count(), 0)
      await page
        .getByText(en ? 'Verification history' : '核验历史', { exact: true })
        .scrollIntoViewIfNeeded()
      await fit()
      await capture('redacted')
      assert.deepEqual(errors, [])
      assert.deepEqual(fixture.errors, [])
      checks.push({
        locale,
        mode,
        viewport,
        passed: true,
        explicitSnapshotOnly: true,
        stableUnknownOperationAcrossReload: true,
        sqlReadySeparateFromCurrentValidity: true,
        sourceChangeRemovesPositiveStatus: true,
        redactedPrivateNotes: true,
        boundedQueueNotCompleteness: true,
        noModelOrPublication: true,
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
