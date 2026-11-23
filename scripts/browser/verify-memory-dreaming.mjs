import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { withOwnedMemoryBrowser } from './owned-memory-browser.mjs'
import { installWorkspaceFixtures } from './workspace-fixtures.mjs'

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
      const en = locale === 'en-US',
        sourceId = '9007199254740993',
        deferredId = '9007199254740995',
        entryId = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      let managed = false,
        job,
        candidate,
        publicationId = '',
        reconciliations = 0,
        runs = 0,
        publications = 0,
        reviews = 0
      const bank = {
        id: 'owned-memory',
        name: 'Owned memory',
        memory_type: ['raw', 'semantic'],
        storage_type: 'table',
        permissions: 'me',
        create_time: 1794700000000,
        owner_name: 'Fixture',
        forgetting_policy: 'FIFO',
      }
      const status = () => ({
        job_id: 'owned-job',
        operation_id: publicationId,
        kind: 'dream_publish',
        status: reconciliations >= 2 ? 'ready' : 'published',
        index_sync_status: 'ready',
        retryable: reconciliations < 2,
      })
      await context.route('**/api/v1/memories**', async (route) => {
        const request = route.request(),
          path = new URL(request.url()).pathname,
          body = request.method() === 'POST' ? request.postDataJSON() : null
        let data,
          code = 200
        if (path.endsWith('/capabilities'))
          data = {
            revisions: {
              supported: true,
              managed,
              activation_scope: 'memory_bank',
              ordinary_writes_after_activation: true,
              managed_delete_supported: true,
              max_content_bytes: 65535,
              max_content_tokens: 8192,
            },
            source_withdrawals: { supported: true, permanent: true },
            writes: {
              supported: true,
              append: true,
              automatic_extraction: true,
              fifo: true,
              publication_state: 'operation',
              queue_replay: 'stable_task_id',
              untracked_legacy_tasks: 'operator_attestation',
            },
            maintenance: {
              supported: true,
              modes: ['dream'],
              candidate_review_required: true,
              actions: ['add', 'patch', 'noop'],
              requires_registered_sources: true,
              automatic_publication: false,
              max_sources: 32,
              max_candidates: 32,
              max_publication_candidates: 16,
            },
          }
        else if (path.endsWith('/config')) data = bank
        else if (path.includes('/sources/') && path.endsWith('/state')) {
          const id = path.split('/sources/')[1].split('/')[0]
          data = {
            managed: managed || id === deferredId,
            memory_id: bank.id,
            source_id: id,
            source_revision: managed ? 1 : null,
            generation: managed ? 1 : null,
            state: 'active',
            content_sha256: 'a'.repeat(64),
            scope: {
              agent_id: 'fixture',
              session_id: 'owned-session',
              user_id: 'owned-user',
            },
          }
        } else if (path.endsWith('/adoptions')) {
          managed = true
          data = {
            operation_id: body.operation_id,
            kind: 'adopt_source',
            status: 'ready',
            index_sync_status: 'ready',
            retryable: false,
          }
        } else if (
          path.endsWith('/maintenance-jobs') &&
          request.method() === 'POST'
        ) {
          assert.ok(managed, 'Registration must be explicit before create')
          assert.deepEqual(body.source_ids, [sourceId, deferredId])
          assert.deepEqual(body.entry_ids, [entryId])
          job = {
            job_id: 'owned-job',
            operation_id: body.operation_id,
            state: 'pending',
            generation: 1,
            policy: body.policy,
            input_budget_tokens: body.input_budget_tokens,
            output_budget_tokens: body.output_budget_tokens,
            estimated_input_tokens: 60,
            coverage: { selected: 2, included: 1, analyzed: 0, deferred: 1 },
            inputs: [sourceId, deferredId].map((id, index) => ({
              input_id: `input-${index}`,
              source_id: id,
              source_revision: 1,
              source_generation: 1,
              content_sha256: 'a'.repeat(64),
              scope: { session_id: 'owned-session' },
              coverage: index ? 'deferred' : 'included',
              defer_reason: index ? 'input_budget_exceeded' : null,
            })),
            analysis_operation_id: null,
            error_code: null,
            model_reference: null,
            usage: {},
            created_at: '',
            updated_at: '',
          }
          data = job
          code = 202
        } else if (path.endsWith('/maintenance-jobs'))
          data = { jobs: job ? [job] : [] }
        else if (path.endsWith('/runs')) {
          runs++
          job = {
            ...job,
            state: 'ready',
            analysis_operation_id: body.operation_id,
            coverage: { ...job.coverage, analyzed: 1 },
            model_reference: 'controlled-fixture',
          }
          candidate = {
            candidate_id: 'owned-candidate',
            revision: 1,
            state: 'pending',
            action: 'patch',
            target_entry_id: entryId,
            expected_revision: 3,
            message_type: 'semantic',
            content: 'The user prefers tea after lunch.',
            base_content: 'The user prefers coffee after lunch.',
            patch: { old_text: 'coffee', new_text: 'tea' },
            diff: {
              old_text: 'The user prefers coffee after lunch.',
              new_text: 'The user prefers tea after lunch.',
            },
            reason:
              'A newer selected source suggests a preference change; reviewer confirmation is required.',
            sources: [
              {
                input_id: 'input-0',
                source_id: sourceId,
                source_revision: 1,
                source_generation: 1,
                content_sha256: 'a'.repeat(64),
              },
            ],
            assessment: {
              kind: 'hypothesis',
              verification_status: 'unverified',
            },
            review_actor_id: null,
            reviewed_at: null,
            publication_operation_id: null,
            redacted: false,
          }
          data = job
        } else if (path.endsWith('/reviews')) {
          reviews++
          assert.equal(body.expected_revision, 1)
          assert.equal(body.decision, 'approve')
          candidate = {
            ...candidate,
            state: 'approved',
            revision: 2,
            review_actor_id: 'controlled-reviewer',
            reviewed_at: '2026-11-15T09:00:00Z',
          }
          data = candidate
        } else if (path.endsWith('/publications')) {
          publications++
          assert.deepEqual(body.candidates, [
            { candidate_id: candidate.candidate_id, expected_revision: 2 },
          ])
          publicationId = body.operation_id
          candidate = {
            ...candidate,
            state: 'publishing',
            publication_operation_id: publicationId,
          }
          data = { operation_id: publicationId }
          code = 503
        } else if (path.endsWith('/reconciliations')) {
          reconciliations++
          if (reconciliations === 1) {
            data = {
              operation_id: publicationId,
              error_code: 'publication_attempt_still_inflight',
            }
            code = 409
          } else {
            candidate = { ...candidate, state: 'published' }
            data = status()
          }
        } else if (path.endsWith('/operations') && request.method() === 'GET') {
          data = {
            operations: [],
            next_cursor: null,
            limit: 20,
            view: 'pending',
            memory_state: 'active',
          }
        } else if (path.includes('/operations/')) {
          const op = path.split('/operations/')[1]
          data =
            op === publicationId
              ? status()
              : {
                  operation_id: op,
                  kind: 'adopt_source',
                  status: 'ready',
                  index_sync_status: 'ready',
                  retryable: false,
                }
        } else if (path.endsWith('/candidates'))
          data = { candidates: candidate ? [candidate] : [] }
        else if (path.endsWith('/owned-job')) data = job
        else
          throw new Error(
            `Unexpected memory fixture route ${request.method()} ${path}`,
          )
        await route.fulfill({
          status: code,
          contentType: 'application/json',
          body: JSON.stringify({
            retcode: code >= 400 ? code : 0,
            retmsg: code >= 400 ? 'Controlled unconfirmed operation' : '',
            data,
          }),
        })
      })
      const page = await context.newPage(),
        errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.setDefaultTimeout(10000)
      await page.goto(`${baseURL}/memory/owned-memory/maintenance`)
      await page
        .getByRole('heading', {
          name: en ? 'Maintenance' : '整理与审核',
          exact: true,
        })
        .waitFor()
      const create = page.getByRole('button', {
        name: en ? 'Create input snapshot' : '创建输入快照',
        exact: true,
      })
      await page
        .getByLabel(en ? 'RAW source IDs' : 'RAW 来源 ID', { exact: true })
        .fill(`${sourceId}\n${deferredId}`)
      await page
        .getByLabel(
          en ? 'Target entry IDs (optional)' : '目标条目 ID（可选）',
          { exact: true },
        )
        .fill(entryId)
      assert.equal(await create.isDisabled(), true)
      await page
        .getByRole('button', {
          name: en
            ? 'Inspect / register selected sources'
            : '检查／登记所选来源',
          exact: true,
        })
        .click()
      const selectedSource = page.getByRole('region', {
        name: `${en ? 'Source' : '来源'} ${sourceId}`,
        exact: true,
      })
      const register = selectedSource.getByRole('button', {
        name: en ? 'Register source for withdrawal' : '登记来源以便撤回',
        exact: true,
      })
      await register.waitFor()
      assert.equal(await register.isDisabled(), true)
      await selectedSource
        .getByRole('checkbox', {
          name: en
            ? 'I understand this applies to the entire memory bank.'
            : '我理解此影响适用于整个记忆库。',
          exact: true,
        })
        .check()
      await register.click()
      await create.waitFor({ state: 'visible' })
      await page.waitForFunction(
        () =>
          ![...document.querySelectorAll('button')].find((button) =>
            ['Create input snapshot', '创建输入快照'].includes(
              button.textContent,
            ),
          )?.disabled,
      )
      // Close the explicit source controls so review stays in its own workspace.
      await page
        .getByText(en ? 'Selected source controls' : '所选来源管理', {
          exact: true,
        })
        .click()
      const capture = async (surface) => {
        const file = `dreaming-${surface}-${mode}-${locale}.png`
        await page.screenshot({ path: `${output}/${file}` })
        captures.push({
          file,
          route: '/memory/owned-memory/maintenance',
          viewport: '1440x1100',
          surface,
        })
      }
      await page
        .locator('[data-scroll-root="console-body"]')
        .evaluate((element) => {
          element.scrollTop = 0
        })
      await capture('input')
      await create.click()
      const run = page.getByRole('button', {
        name: en ? 'Run analysis explicitly' : '显式运行分析',
        exact: true,
      })
      await run.waitFor()
      assert.equal(runs, 0)
      await run.click()
      await page
        .getByText('The user prefers tea after lunch.', { exact: true })
        .waitFor()
      const review = page.getByRole('button', {
        name: en ? 'Approve candidate' : '批准候选',
        exact: true,
      })
      await review.scrollIntoViewIfNeeded()
      await capture('candidate')
      assert.equal(publications, 0)
      assert.ok(
        (await page.locator('body').innerText()).includes(
          'hypothesis / unverified',
        ),
      )
      await review.click()
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
      await page
        .getByText(
          en
            ? 'Completion has not been confirmed. Read the latest status, or reconcile this operation to resume pending work.'
            : '尚未确认完成。可读取最新状态，或明确发起对账以继续待处理工作。',
          { exact: true },
        )
        .waitFor()
      await page.getByText(publicationId, { exact: true }).last().waitFor()
      assert.equal(publications, 1)
      assert.equal(
        await page
          .getByRole('button', {
            name: en
              ? 'Prepare another reviewed batch'
              : '准备另一批已审核候选',
            exact: true,
          })
          .count(),
        0,
        'Index-ready with published status is not complete',
      )
      const reconcile = page.getByRole('button', {
        name: en ? 'Reconcile this operation' : '对账此操作',
        exact: true,
      })
      await reconcile.waitFor()
      await reconcile.click()
      assert.equal(reconciliations, 1)
      assert.equal(publications, 1)
      await reconcile.scrollIntoViewIfNeeded()
      await capture('unknown')
      await reconcile.click()
      await page
        .getByRole('button', {
          name: en ? 'Prepare another reviewed batch' : '准备另一批已审核候选',
          exact: true,
        })
        .waitFor()
      await capture('published')
      assert.equal(publications, 1)
      assert.equal(runs, 1)
      assert.equal(reviews, 1)
      assert.deepEqual(errors, [])
      assert.ok(
        !(await page.locator('body').innerText()).includes('memory.dreaming.'),
      )
      checks.push({
        locale,
        mode,
        passed: true,
        explicitRegistration: true,
        getDidNotRunAnalysis: true,
        approvedRevision: 2,
        publicationRequests: publications,
        unknownOperationRetained: true,
        busyReconciliationRetained: true,
        indexReadyAloneNotSuccess: true,
        candidateUnverified: true,
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
