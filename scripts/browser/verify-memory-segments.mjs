import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { withOwnedMemoryBrowser } from './owned-memory-browser.mjs'
import { installWorkspaceFixtures } from './workspace-fixtures.mjs'
import { installMemorySegmentsFixture } from './memory-segments-fixture.mjs'

await withOwnedMemoryBrowser(async ({ browser, baseURL, output, event }) => {
  const captures = [],
    checks = []
  for (const [locale, mode, mobile] of [
    ['en-US', 'light', false],
    ['zh-CN', 'dark', false],
    ['en-US', 'light', true],
    ['zh-CN', 'dark', true],
  ].filter(
    ([, , mobile]) => !process.argv.includes('--mobile-only') || mobile,
  )) {
    const en = locale === 'en-US'
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
      const fixture = await installMemorySegmentsFixture(context, (message) =>
        event('fixture-error', { message }),
      )
      const page = await context.newPage(),
        errors = []
      page.setDefaultTimeout(10000)
      page.on('pageerror', (error) => errors.push(error.message))
      const button = (english, chinese) =>
        page.getByRole('button', { name: en ? english : chinese, exact: true })
      const label = (english, chinese) =>
        page.getByLabel(en ? english : chinese, { exact: true })
      const capture = async (surface) => {
        const file = `segments-${mobile ? 'mobile' : 'desktop'}-${surface}-${mode}-${locale}.png`
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
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          'No horizontal viewport overflow',
        )
      const coverage = () =>
        page.getByRole('region', {
          name: en ? 'Source-version analysis coverage' : '来源版本分析覆盖',
          exact: true,
        })
      const sourceCount = async (english, chinese) =>
        coverage()
          .locator('div')
          .filter({
            has: page.getByText(en ? english : chinese, { exact: true }),
          })
          .last()
          .locator('dd')
          .innerText()
      const openCandidate = async () => {
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
          .getByText(en ? 'Evidence sources (1)' : '证据来源（1）', {
            exact: true,
          })
          .click()
        await page
          .getByText(en ? 'Fragment provenance' : '片段来源依据', {
            exact: true,
          })
          .last()
          .click()
        await page
          .getByText(en ? 'Evidence sources (1)' : '证据来源（1）', {
            exact: true,
          })
          .scrollIntoViewIfNeeded()
        assert.equal(
          await button(
            'Publish selected approved candidates (0)',
            '发布已选批准候选（0）',
          ).isDisabled(),
          true,
        )
        assert.equal(fixture.calls.reviews, 0)
        assert.equal(fixture.calls.publications, 0)
        assert.ok(
          (await page.locator('body').innerText()).includes(
            'hypothesis / unverified',
          ),
        )
        await fit()
        assert.ok(
          await page
            .locator('article')
            .first()
            .evaluate((article) => {
              const boundary = article.getBoundingClientRect()
              return [...article.querySelectorAll('p, dd')].every((element) => {
                const range = document.createRange()
                range.selectNodeContents(element)
                return [...range.getClientRects()].every(
                  (rect) =>
                    rect.width === 0 ||
                    (rect.left >= boundary.left - 1 &&
                      rect.right <= boundary.right + 1),
                )
              })
            }),
          'Candidate identifiers and provenance must wrap inside the card',
        )
        await capture('candidate')
      }
      const batchURL = `${baseURL}/memory/owned-memory/maintenance/batches?batch=${fixture.discoveryId}`
      if (mobile) {
        fixture.primePartial()
        await page.goto(batchURL)
        await coverage().waitFor()
        await coverage().scrollIntoViewIfNeeded()
        assert.equal(
          await sourceCount(
            'Fully analyzed source versions',
            '完整分析的来源版本数',
          ),
          '0',
        )
        assert.equal(
          await sourceCount(
            'Partially analyzed source versions',
            '部分分析的来源版本数',
          ),
          '1',
        )
        await fit()
        await capture('partial')
        await openCandidate()
      } else {
        await page.goto(`${baseURL}/memory/owned-memory/maintenance/batches`)
        await button('Preview sources and coverage', '预览来源与覆盖').click()
        await button('Save batch plan', '保存批次计划').waitFor()
        assert.equal(fixture.calls.preview[0].segmentation, undefined)
        await button('Save batch plan', '保存批次计划').scrollIntoViewIfNeeded()
        await capture('whole')
        await page
          .getByRole('checkbox', {
            name: en ? 'Split long sources into fragments' : '将长来源分段分析',
            exact: true,
          })
          .click()
        await label(
          'Target token limit per fragment',
          '每个片段的目标 token 上限',
        ).fill('256')
        await label(
          'Input token budget per child',
          '每个子任务的输入 token 预算',
        ).fill('8192')
        await button('Preview sources and coverage', '预览来源与覆盖').click()
        await coverage().waitFor()
        assert.equal(
          fixture.calls.preview.at(-1).segmentation.mode,
          'segmented',
        )
        await page
          .getByText(
            en ? 'Planned child source groups (3)' : '计划的子任务来源组（3）',
            { exact: true },
          )
          .click()
        await coverage().scrollIntoViewIfNeeded()
        await fit()
        await capture('preview')
        assert.equal(fixture.calls.create.length, 0)
        assert.equal(fixture.calls.runs.length, 0)
        await button('Save batch plan', '保存批次计划').click()
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
        const handles = fixture.plan.batches.map((batch) => [
          batch.batch_id,
          batch.job_id,
          batch.primary_sources[0].fragment.fragment_id,
        ])
        await button('Submit bounded child jobs', '提交有界子任务').click()
        await page
          .getByRole('link', {
            name: en ? 'Review original job' : '审核原任务',
            exact: true,
          })
          .first()
          .waitFor()
        fixture.finish(0)
        await button('Read latest status', '读取最新状态').first().click()
        await page
          .getByText(
            en
              ? 'Some fragments were analyzed. The whole source version is not yet counted as analyzed.'
              : '部分片段已分析，但整个来源版本尚不计为已分析。',
            { exact: true },
          )
          .waitFor()
        await page.reload()
        await coverage().waitFor()
        assert.equal(fixture.calls.create.length, 1)
        assert.equal(fixture.calls.runs.length, 1)
        assert.equal(
          await sourceCount(
            'Fully analyzed source versions',
            '完整分析的来源版本数',
          ),
          '0',
        )
        assert.equal(
          await sourceCount(
            'Partially analyzed source versions',
            '部分分析的来源版本数',
          ),
          '1',
        )
        await coverage().scrollIntoViewIfNeeded()
        await capture('partial')
        await openCandidate()
        await page.goto(batchURL)
        await button('Submit bounded child jobs', '提交有界子任务').waitFor()
        await label(
          'Children per explicit submission',
          '每次显式提交的子任务数',
        ).fill('2')
        await button('Submit bounded child jobs', '提交有界子任务').click()
        await page.waitForFunction(
          () =>
            [...document.querySelectorAll('a')].filter((link) =>
              link.href.includes('/maintenance?job='),
            ).length === 3,
        )
        fixture.finish(1)
        fixture.finish(2)
        await button('Read latest status', '读取最新状态').first().click()
        await page.waitForFunction(
          (name) => {
            const term = [...document.querySelectorAll('dt')].find(
              (element) => element.textContent === name,
            )
            return term?.nextElementSibling?.textContent === '1'
          },
          en ? 'Fully analyzed source versions' : '完整分析的来源版本数',
        )
        assert.deepEqual(
          fixture.plan.batches.map((batch) => [
            batch.batch_id,
            batch.job_id,
            batch.primary_sources[0].fragment.fragment_id,
          ]),
          handles,
        )
        assert.deepEqual(
          fixture.calls.runs.map((command) => command.limit),
          [1, 2],
        )
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
          .waitFor()
        assert.equal(
          fixture.calls.preview.at(-1).segmentation.fragment_token_limit,
          256,
        )
        await page
          .getByRole('heading', {
            name: en
              ? 'Source preview and current coverage'
              : '来源预览与当前覆盖',
            exact: true,
          })
          .scrollIntoViewIfNeeded()
        await fit()
        await capture('coverage')
      }
      assert.deepEqual(errors, [])
      assert.deepEqual(fixture.errors, [])
      assert.equal(fixture.calls.reviews, 0)
      assert.equal(fixture.calls.publications, 0)
      checks.push({
        locale,
        mode,
        viewport,
        passed: true,
        sourceFragmentJobUnitsSeparated: true,
        partialIsNotWholeCoverage: true,
        wholeDefaultRetained: !mobile,
        explicitBoundedSubmissions: mobile ? [] : [1, 2],
        stableFragmentProvenance: true,
        readOnlyReload: true,
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
