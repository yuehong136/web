import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { withOwnedMemoryBrowser } from './owned-memory-browser.mjs'
import { installWorkspaceFixtures } from './workspace-fixtures.mjs'
import { installMemoryBackgroundFixture } from './memory-background-fixture.mjs'

await withOwnedMemoryBrowser(async ({ browser, baseURL, output, event }) => {
  const captures = [],
    checks = []
  for (const [locale, mode] of [
    ['en-US', 'light'],
    ['zh-CN', 'dark'],
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
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
      const fixture = await installMemoryBackgroundFixture(context),
        en = locale === 'en-US',
        page = await context.newPage(),
        errors = []
      page.setDefaultTimeout(10000)
      page.on('pageerror', (error) => errors.push(error.message))
      const capture = async (surface) => {
        const file = `background-${surface}-${mode}-${locale}.png`
        await page.screenshot({ path: `${output}/${file}` })
        captures.push({
          file,
          route: new URL(page.url()).pathname,
          viewport: '1440x1100',
          surface,
        })
      }
      await page.goto(`${baseURL}/memory/owned-memory/maintenance`)
      await page
        .getByLabel(en ? 'RAW source IDs' : 'RAW 来源 ID', { exact: true })
        .fill(fixture.sourceId)
      await page
        .getByRole('button', {
          name: en ? 'Create input snapshot' : '创建输入快照',
          exact: true,
        })
        .click()
      const submit = page.getByRole('button', {
        name: en ? 'Submit background analysis' : '提交后台分析',
        exact: true,
      })
      await submit.waitFor()
      assert.equal(fixture.counts.submit, 0)
      await submit.click()
      await page.waitForURL(
        (url) =>
          url.searchParams.get('job') === fixture.jobId &&
          url.searchParams.get('operation') === fixture.analysisId,
      )
      assert.equal(await submit.isDisabled(), true)
      const configBefore = fixture.counts.config,
        capabilitiesBefore = fixture.counts.capabilities
      await page.goto(`${baseURL}/memory/owned-memory/operations`)
      await page.waitForURL(
        (url) => url.searchParams.get('operation') === fixture.analysisId,
      )
      await page
        .getByText(en ? 'Queued for analysis' : '已排队等待分析', {
          exact: true,
        })
        .first()
        .waitFor()
      await page.reload()
      await page
        .getByText(en ? 'Queued for analysis' : '已排队等待分析', {
          exact: true,
        })
        .first()
        .waitFor()
      assert.equal(
        fixture.counts.config,
        configBefore,
        'Recovery never loads bank configuration',
      )
      assert.equal(
        fixture.counts.capabilities,
        capabilitiesBefore,
        'Recovery never requires capabilities',
      )
      assert.equal(fixture.counts.submit, 1)
      assert.equal(fixture.counts.reconcile, 0)
      await capture('queued')
      await page
        .getByRole('link', {
          name: en ? 'Open job and candidates' : '打开任务与候选',
          exact: true,
        })
        .click()
      await submit.waitFor()
      fixture.setExecution('running')
      await page
        .getByRole('button', {
          name: en ? 'Read latest status' : '读取最新状态',
          exact: true,
        })
        .first()
        .click()
      const running = page
        .getByText(en ? 'Analysis running' : '正在后台分析', { exact: true })
        .first()
      await running.waitFor()
      await running.scrollIntoViewIfNeeded()
      await capture('running')
      fixture.setExecution('needs_reconciliation')
      await page.reload()
      const attention = page
        .getByText(
          en
            ? 'An earlier attempt may still have live requests. An operator must independently confirm they have settled before recovery can proceed.'
            : '旧尝试可能仍有在途请求，管理员须独立确认它们已经结束后，才能继续恢复。',
          { exact: true },
        )
        .first()
      await attention.waitFor()
      await attention.scrollIntoViewIfNeeded()
      assert.equal(await submit.isDisabled(), true)
      assert.equal(
        await page
          .getByRole('button', {
            name: en ? 'Reconcile this operation' : '对账此操作',
            exact: true,
          })
          .count(),
        0,
      )
      await capture('operator')
      fixture.setExecution('succeeded')
      await page
        .getByRole('button', {
          name: en ? 'Read latest status' : '读取最新状态',
          exact: true,
        })
        .first()
        .click()
      const approve = page.getByRole('button', {
        name: en ? 'Approve candidate' : '批准候选',
        exact: true,
      })
      await approve.waitFor()
      await approve.scrollIntoViewIfNeeded()
      assert.equal(await approve.isDisabled(), false)
      assert.equal(fixture.counts.submit, 1)
      assert.equal(fixture.counts.review, 0)
      assert.equal(fixture.counts.publish, 0)
      await capture('candidates')
      await approve.click()
      await page
        .getByRole('checkbox', {
          name: en ? 'Select for publication' : '选择发布',
          exact: true,
        })
        .check()
      await page
        .getByRole('button', {
          name: en
            ? 'Publish selected approved candidates (1)'
            : '发布已选批准候选（1）',
          exact: true,
        })
        .click()
      await page.waitForURL(
        (url) => url.searchParams.get('operation') === fixture.publicationId,
      )
      await page.reload()
      const unknown = page
        .getByText(
          en
            ? 'The result is unconfirmed. Read the original operation and keep its ID; do not submit a replacement.'
            : '结果尚未确认。请读取原操作并保留 ID，不要替换成新命令。',
          { exact: true },
        )
        .first()
      await unknown.waitFor()
      await unknown.scrollIntoViewIfNeeded()
      assert.equal(fixture.counts.publish, 1)
      assert.equal(fixture.counts.reconcile, 0)
      await capture('unknown')
      await page
        .getByRole('button', {
          name: en ? 'Reconcile this operation' : '对账此操作',
          exact: true,
        })
        .click()
      const another = page.getByRole('button', {
        name: en ? 'Prepare another reviewed batch' : '准备另一批已审核候选',
        exact: true,
      })
      await another.waitFor()
      await another.scrollIntoViewIfNeeded()
      await capture('published')
      assert.equal(fixture.counts.publish, 1)
      assert.equal(fixture.counts.reconcile, 1)
      await page.goto(`${baseURL}/memory/deleted-memory/operations`)
      await page.waitForURL(
        (url) => url.searchParams.get('operation') === 'deletion-original',
      )
      await page
        .getByText(
          en
            ? 'This memory has been deleted. Only minimal deletion audit remains available; backup and client copies are not certified erased.'
            : '记忆库已删除，现在仅可读取最小删除审计；备份和客户端副本未获物理清除认证。',
          { exact: true },
        )
        .waitFor()
      await page
        .getByText(en ? 'Not certified complete' : '未确认全部完成', {
          exact: true,
        })
        .waitFor()
      await capture('deleted')
      assert.deepEqual(errors, [])
      assert.ok(
        !(await page.locator('body').innerText()).includes('memory.recovery.'),
      )
      checks.push({
        locale,
        mode,
        passed: true,
        backgroundSubmissions: fixture.counts.submit,
        reviewRequests: fixture.counts.review,
        publicationRequests: fixture.counts.publish,
        reconciliationRequests: fixture.counts.reconcile,
        serverDiscoveryAfterReload: true,
        configIndependentAudit: true,
        getNeverAdvancedExecution: true,
        operatorBlockedReplay: true,
        manualReviewAndPublication: true,
        tombstoneAuditRecovered: true,
      })
      event('scenario', checks.at(-1))
    } finally {
      await context.close()
    }
  }
  writeFileSync(
    `${output}/results.json`,
    JSON.stringify(
      {
        controlled: true,
        realProvider: false,
        browser: browser.version(),
        checks,
        captures,
      },
      null,
      2,
    ) + '\n',
  )
  console.log(JSON.stringify({ passed: true, output, checks }))
})
