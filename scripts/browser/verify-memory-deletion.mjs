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
      const other = { ...bank, id: 'other-memory', name: 'Other memory' }
      let deleted = false,
        posts = 0,
        reconciliations = 0,
        gets = 0,
        operationId = ''
      const status = () => ({
        operation_id: operationId,
        kind: 'delete_memory',
        status: deleted ? 'ready' : 'published',
        index_sync_status: deleted ? 'ready' : 'pending',
        retryable: !deleted,
        lifecycle: deleted ? 'deleted' : 'deleting',
        stop_supply: 'stopped',
        tracked_cleanup_confirmed: deleted,
        physical_cleanup_complete: false,
        untraceable_copies: true,
        writer_drain: {
          active_attempts: deleted ? 0 : 1,
          unknown_attempts: deleted ? 0 : 1,
          pending_appends: deleted ? 0 : 2,
          untracked_tasks: 0,
        },
        blocked_by: deleted ? [] : ['active_writers', 'unknown_writer_outcome'],
        needs_operator_reconciliation: !deleted,
      })
      await context.route('**/api/v1/memories**', async (route) => {
        const request = route.request(),
          path = new URL(request.url()).pathname
        let data,
          code = 200
        if (path.endsWith('/capabilities'))
          data = {
            deletions: {
              supported: true,
              requires_writer_drain: true,
              audit_tombstone: true,
              physical_erasure_certified: false,
              publication_state: 'operation',
            },
            writes: {
              supported: true,
              append: true,
              automatic_extraction: true,
              fifo: true,
              publication_state: 'operation',
              queue_replay: 'stable_task_id',
              untracked_legacy_tasks: 'operator_attestation',
            },
            revisions: {
              supported: true,
              managed: true,
              activation_scope: 'memory_bank',
              ordinary_writes_after_activation: true,
              managed_delete_supported: true,
              max_content_bytes: 65535,
              max_content_tokens: 8192,
            },
          }
        else if (path.endsWith('/deletions')) {
          assert.equal(request.method(), 'POST')
          posts++
          operationId = request.postDataJSON().operation_id
          code = 202
          data = status()
        } else if (path.endsWith('/reconciliations')) {
          reconciliations++
          if (reconciliations === 1) {
            code = 409
            data = {
              operation_id: operationId,
              error_code: 'publication_attempt_still_inflight',
            }
          } else {
            deleted = true
            data = status()
          }
        } else if (path.includes('/operations/')) {
          gets++
          data = status()
        } else if (path.endsWith('/memories'))
          data = {
            memory_list: deleted ? [other] : [bank, other],
            total_count: deleted ? 1 : 2,
          }
        else if (path.endsWith('/other-memory/config')) data = other
        else if (path.endsWith('/other-memory'))
          data = {
            messages: { message_list: [], total_count: 0 },
            storage_type: 'table',
          }
        else
          throw new Error(`Unexpected memory route ${request.method()} ${path}`)
        await route.fulfill({
          status: code,
          contentType: 'application/json',
          body: JSON.stringify({
            retcode: code >= 400 ? code : 0,
            retmsg: code === 409 ? 'Writer still running' : '',
            data,
          }),
        })
      })
      const page = await context.newPage(),
        errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.setDefaultTimeout(10000)
      await page.goto(`${baseURL}/memory`)
      await page
        .getByRole('link', { name: 'Owned memory', exact: true })
        .waitFor()
      const en = locale === 'en-US'
      await page
        .getByRole('button', {
          name: en ? 'Actions for Owned memory' : 'Owned memory 的操作',
          exact: true,
        })
        .click()
      await page.getByText(en ? 'Delete' : '删除', { exact: true }).click()
      const dialog = page.getByRole('alertdialog')
      const deleteButton = dialog.getByRole('button', {
        name: en ? 'Delete' : '删除',
        exact: true,
      })
      await deleteButton.click()
      await dialog
        .getByText(
          en
            ? 'Deletion accepted. Waiting for writers and tracked cleanup.'
            : '删除已受理，正在等待写入排空与已跟踪数据清理。',
          { exact: true },
        )
        .waitFor()
      assert.equal(posts, 1)
      assert.equal(
        await page
          .getByRole('link', { name: 'Owned memory', exact: true })
          .count(),
        1,
      )
      assert.equal(
        await dialog
          .getByRole('button', { name: en ? 'Cancel' : '取消', exact: true })
          .isDisabled(),
        true,
      )
      await page.keyboard.press('Escape')
      assert.equal(
        await dialog.count(),
        1,
        'Pending operation retains its handle',
      )
      await dialog
        .getByText(en ? 'Not certified complete' : '未确认全部完成', {
          exact: true,
        })
        .waitFor()
      const capture = async (surface, route = '/memory') => {
        const file = `${surface}-${mode}-${locale}.png`
        await page.screenshot({ path: `${output}/${file}` })
        captures.push({
          file,
          route,
          viewport: '1440x1100',
          surface,
        })
      }
      await capture('draining')
      const getBefore = gets
      await dialog
        .getByRole('button', {
          name: en ? 'Read latest status' : '读取最新状态',
          exact: true,
        })
        .click()
      assert.ok(gets > getBefore)
      assert.equal(reconciliations, 0, 'GET status must not advance deletion')
      const reconcile = dialog.getByRole('button', {
        name: en ? 'Reconcile this operation' : '对账此操作',
        exact: true,
      })
      await reconcile.click()
      await dialog
        .getByText(
          en
            ? 'A previous attempt may still be running. Keep this operation ID, wait and inspect its status. Manual verification may be needed before reconciliation can proceed.'
            : '先前尝试可能仍在运行。请保留此操作 ID，等待并查询状态；继续对账前可能需要人工核验。',
          { exact: true },
        )
        .waitFor()
      assert.equal(posts, 1)
      assert.ok((await dialog.innerText()).includes(operationId))
      await capture('blocked')
      await reconcile.click()
      await page
        .getByText(en ? 'Memory bank deletion confirmed' : '记忆库删除已确认', {
          exact: true,
        })
        .waitFor()
      assert.equal(await dialog.count(), 0)
      assert.equal(
        await page
          .getByRole('link', { name: 'Owned memory', exact: true })
          .count(),
        0,
      )
      await page
        .getByRole('link', { name: 'Other memory', exact: true })
        .waitFor()
      await capture('deleted')
      await page.goto(`${baseURL}/memory/other-memory`)
      await page
        .getByText(en ? 'New conversations: Supported' : '新增对话: 已支持', {
          exact: true,
        })
        .waitFor()
      await page
        .getByText(
          en ? 'Automatic extraction: Supported' : '自动提取: 已支持',
          { exact: true },
        )
        .waitFor()
      await page
        .getByText(
          en ? 'FIFO capacity retention: Supported' : 'FIFO 容量保留: 已支持',
          { exact: true },
        )
        .waitFor()
      await capture('managed-writers', '/memory/other-memory')
      assert.deepEqual(errors, [])
      assert.ok(
        !(await page.locator('body').innerText()).includes('memory.deletion.'),
      )
      checks.push({
        locale,
        mode,
        posts,
        reconciliations,
        passed: true,
        acceptedRetained: true,
        busyKeptOperation: true,
        readDoesNotAdvance: true,
        otherBankRetained: true,
        physicalErasureCertified: false,
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
