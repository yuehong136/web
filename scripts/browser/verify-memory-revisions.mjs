import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { mkdirSync, writeFileSync, createWriteStream } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { installWorkspaceFixtures } from './workspace-fixtures.mjs'

const output = 'output/playwright/memory-revisions'
mkdirSync(output, { recursive: true })
const port = await new Promise((resolve) => {
  const server = createServer()
  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port
    server.close(() => resolve(port))
  })
})
const baseURL = `http://127.0.0.1:${port}`
const log = createWriteStream(`${output}/server.log`)
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--strictPort',
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] },
)
server.stdout.pipe(log)
server.stderr.pipe(log)
let browser
const captures = [],
  checks = []
try {
  let ready = false
  for (let n = 0; n < 100; n++) {
    try {
      ready = (await fetch(baseURL)).ok
    } catch {}
    if (ready) break
    await delay(100)
  }
  assert.ok(ready)
  browser = await chromium.launch({
    headless: true,
    channel:
      process.env.BROWSER_CHANNEL ||
      (process.platform === 'darwin' ? 'chrome' : undefined),
  })
  for (const [locale, mode] of [
    ['en-US', 'light'],
    ['zh-CN', 'dark'],
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      locale,
      reducedMotion: 'reduce',
    })
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
    let managed = false,
      revision = 1,
      withdrawn = false,
      posts = 0,
      reconciliations = 0
    const operations = new Map()
    const sourceRef = {
      source_id: '10',
      source_revision: 1,
      generation: 1,
      content_sha256: 'a'.repeat(64),
      relation: 'conversation',
      locator: { message_id: '10' },
    }
    const version = (n) => ({
      revision: n,
      parent_revision: n === 1 ? null : n - 1,
      message_id: n === 1 ? '11' : '9007199254740993',
      content: withdrawn
        ? null
        : n === 1
          ? 'Original memory'
          : 'Corrected memory',
      content_sha256: 'b'.repeat(64),
      origin: n === 1 ? 'legacy' : 'manual_correction',
      assessment: { verification_status: 'user_asserted' },
      redacted: withdrawn,
      sources: [sourceRef],
    })
    const entry = () => ({
      entry_id: 'entry-a',
      memory_id: 'fixture-memory',
      legacy_message_id: '11',
      current_message_id: version(revision).message_id,
      current_revision: revision,
      generation: 1,
      state: withdrawn ? 'withdrawn' : 'active',
      current: version(revision),
    })
    const raw = {
      message_id: 10,
      memory_id: 'fixture-memory',
      message_type: 'raw',
      session_id: 'controlled-session',
      agent_id: 'fixture-agent',
      valid_at: '2026-11-15 10:00:00',
      forget_at: 'None',
      status: true,
      content: 'Controlled source',
      extract: [
        {
          message_id: 11,
          memory_id: 'fixture-memory',
          source_id: 10,
          message_type: 'semantic',
          session_id: 'controlled-session',
          valid_at: '2026-11-15 10:00:00',
          forget_at: 'None',
          status: true,
          content: 'Original memory',
        },
      ],
    }
    const otherRaw = {
      ...raw,
      message_id: 20,
      content: 'Other source conversation',
      session_id: 'other-controlled-session',
      extract: [
        {
          ...raw.extract[0],
          message_id: 21,
          source_id: 20,
          content: 'Other source memory',
        },
      ],
    }
    const sourceState = () => ({
      managed,
      memory_id: 'fixture-memory',
      source_id: '10',
      source_revision: 1,
      generation: withdrawn ? 2 : 1,
      state: withdrawn ? 'forgotten' : 'active',
      content_sha256: 'a'.repeat(64),
      scope: { session_id: 'controlled-session', user_id: 'controlled-user' },
    })
    await context.route(/\/api\/v1\/(?:memories|messages)/, async (route) => {
      const request = route.request(),
        path = new URL(request.url()).pathname,
        body = request.postDataJSON() ?? {}
      let data = null,
        status = 200
      if (request.method() === 'POST') posts++
      if (path.endsWith('/capabilities'))
        data = {
          revisions: {
            supported: true,
            managed,
            activation_scope: 'memory_bank',
            ordinary_writes_after_activation: false,
            managed_delete_supported: false,
            coordinated_state_changes: true,
            max_content_bytes: 65535,
            max_content_tokens: 8192,
          },
          source_withdrawals: { supported: true, permanent: true },
        }
      else if (path.endsWith('/config'))
        data = {
          id: 'fixture-memory',
          name: 'Controlled memory',
          memory_type: ['raw', 'semantic'],
          storage_type: 'table',
          permissions: 'me',
        }
      else if (path.endsWith('/content') && withdrawn) {
        status = 404
        data = false
      } else if (path.endsWith('/content'))
        data = {
          content: path.includes(':10/') ? raw.content : 'Original memory',
        }
      else if (path.endsWith('/messages/11/entry'))
        data = managed ? entry() : null
      else if (path.endsWith('/entries') && request.method() === 'POST') {
        managed = true
        data = {
          operation_id: body.operation_id,
          kind: 'adopt',
          status: 'ready',
          index_sync_status: 'ready',
          retryable: false,
        }
        operations.set(body.operation_id, data)
      } else if (path.endsWith('/revisions') && request.method() === 'GET')
        data = {
          revisions: Array.from({ length: revision }, (_, i) =>
            version(revision - i),
          ),
          next_cursor: null,
        }
      else if (path.endsWith('/revisions') && body.dry_run)
        data = {
          dry_run: true,
          entry_id: 'entry-a',
          expected_revision: revision,
          current_revision: revision,
          content: body.content,
          content_sha256: 'b'.repeat(64),
          estimated_tokens: 8,
          source_checks: [{ source_id: '10', state: 'active' }],
          diff: { old_text: version(revision).content, new_text: body.content },
        }
      else if (path.endsWith('/revisions')) {
        revision++
        status = 202
        data = {
          operation_id: body.operation_id,
          kind: 'revise',
          status: 'accepted',
          index_sync_status: 'pending',
          retryable: true,
        }
        operations.set(body.operation_id, data)
      } else if (path.endsWith('/state')) data = sourceState()
      else if (path.endsWith('/withdrawals')) {
        withdrawn = true
        status = 202
        data = {
          operation_id: body.operation_id,
          kind: 'withdraw_source',
          source: sourceState(),
          status: 'published',
          index_sync_status: 'pending',
          stop_supply: 'withdrawn',
          physical_cleanup_complete: false,
          retryable: true,
        }
        operations.set(body.operation_id, data)
      } else if (path.endsWith('/reconciliations')) {
        reconciliations++
        const id = path.split('/').at(-2)
        data = {
          ...operations.get(id),
          status: 'ready',
          index_sync_status: 'ready',
          ...(operations.get(id)?.kind === 'withdraw_source'
            ? {
                physical_cleanup_complete: false,
                projection_cleanup_status: 'confirmed',
                untraceable_copies: true,
              }
            : {}),
          retryable: false,
        }
        operations.set(id, data)
      } else if (path.includes('/operations/'))
        data = operations.get(path.split('/').at(-1))
      else if (path.endsWith('/entries/entry-a')) data = entry()
      else
        data = {
          messages: {
            message_list: [
              withdrawn
                ? {
                    ...raw,
                    content: undefined,
                    content_embed: undefined,
                    status: false,
                    managed_source_state: 'forgotten',
                    extract: [],
                  }
                : raw,
              otherRaw,
            ],
            total_count: 2,
          },
          storage_type: 'table',
        }
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          retcode: status >= 400 ? status : 0,
          retmsg: '',
          data,
        }),
      })
    })
    const page = await context.newPage(),
      errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.setDefaultTimeout(10000)
    await page.goto(`${baseURL}/memory/fixture-memory`)
    await page
      .getByRole('button', { name: 'Original memory', exact: true })
      .click()
    const adoptName =
      locale === 'en-US' ? 'Enable managed editing' : '启用受管编辑'
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: adoptName, exact: true }).waitFor()
    assert.equal(posts, 0)
    assert.equal(
      await dialog
        .getByRole('button', { name: adoptName, exact: true })
        .isDisabled(),
      true,
    )
    await page.screenshot({ path: `${output}/adoption-${mode}-${locale}.png` })
    captures.push({
      file: `adoption-${mode}-${locale}.png`,
      route: '/memory/fixture-memory',
      viewport: '1440x1000',
      surface: 'whole-bank adoption acknowledgement',
    })
    await dialog.getByRole('checkbox').check()
    await dialog.getByRole('button', { name: adoptName, exact: true }).click()
    const contentLabel =
        locale === 'en-US' ? 'Corrected content' : '修订后内容',
      reasonLabel = locale === 'en-US' ? 'Reason' : '原因'
    await dialog
      .getByLabel(contentLabel, { exact: true })
      .fill('Corrected memory')
    await dialog.locator('#revision-reason').fill('Controlled correction')
    await dialog
      .getByRole('button', {
        name: locale === 'en-US' ? 'Preview correction' : '预览修订',
        exact: true,
      })
      .click()
    await dialog
      .getByText(locale === 'en-US' ? 'Correction preview' : '修订预览', {
        exact: true,
      })
      .waitFor()
    await page.screenshot({ path: `${output}/preview-${mode}-${locale}.png` })
    captures.push({
      file: `preview-${mode}-${locale}.png`,
      route: '/memory/fixture-memory',
      viewport: '1440x1000',
      surface: 'version-checked correction preview',
    })
    await dialog
      .getByRole('button', {
        name:
          locale === 'en-US'
            ? 'Submit previewed correction'
            : '提交已预览的修订',
        exact: true,
      })
      .click()
    const readStatus = dialog.getByRole('button', {
      name: locale === 'en-US' ? 'Read latest status' : '读取最新状态',
      exact: true,
    })
    await readStatus.waitFor()
    assert.equal(reconciliations, 0)
    await readStatus.click()
    assert.equal(reconciliations, 0)
    await dialog
      .getByRole('button', {
        name: locale === 'en-US' ? 'Reconcile this operation' : '对账此操作',
        exact: true,
      })
      .click()
    await dialog
      .getByText(
        locale === 'en-US'
          ? 'The operation is confirmed ready.'
          : '此操作已确认就绪。',
        { exact: true },
      )
      .waitFor()
    await dialog
      .getByText(
        locale === 'en-US' ? 'Revision history and sources' : '修订历史与来源',
        { exact: true },
      )
      .click()
    const region = dialog
      .getByRole('region', {
        name: locale === 'en-US' ? 'Source 10' : '来源 10',
        exact: true,
      })
      .first()
    await region
      .getByLabel(reasonLabel, { exact: true })
      .fill('Controlled withdrawal')
    await region.getByRole('checkbox').check()
    await region
      .getByRole('button', {
        name: locale === 'en-US' ? 'Withdraw source' : '撤回来源',
        exact: true,
      })
      .click()
    await region
      .getByText(
        locale === 'en-US'
          ? 'This source is withdrawn from normal supply. Check the operation for physical cleanup status.'
          : '此来源已停止正常供给，物理清理状态请查看操作记录。',
        { exact: true },
      )
      .waitFor()
    await region
      .getByRole('button', {
        name: locale === 'en-US' ? 'Reconcile this operation' : '对账此操作',
        exact: true,
      })
      .click()
    await region
      .getByText(
        locale === 'en-US'
          ? 'The operation is confirmed ready.'
          : '此操作已确认就绪。',
        { exact: true },
      )
      .waitFor()
    assert.equal(
      await dialog.locator('#revision-content').count(),
      0,
      'Redacted current must hide the old edit draft',
    )
    assert.equal(
      await dialog.getByText('Original memory', { exact: true }).count(),
      0,
      'Withdrawn content must not survive in the inspector cache',
    )
    await page.screenshot({ path: `${output}/withdrawn-${mode}-${locale}.png` })
    captures.push({
      file: `withdrawn-${mode}-${locale}.png`,
      route: '/memory/fixture-memory',
      viewport: '1440x1000',
      surface: 'source withdrawal and separate cleanup status',
    })
    await page.keyboard.press('Escape')
    assert.equal(await dialog.count(), 0)
    assert.equal(
      await page
        .getByRole('button', { name: 'Original memory', exact: true })
        .count(),
      0,
      'Withdrawn body must not remain behind the inspector',
    )
    await page
      .getByRole('button', { name: 'Other source memory', exact: true })
      .waitFor()
    assert.deepEqual(errors, [])
    const visible = await page.locator('body').innerText()
    assert.ok(!visible.includes('memory.revisions.'))
    checks.push({
      locale,
      mode,
      passed: true,
      readDidNotAdopt: true,
      acceptedNotReady: true,
      getDidNotReconcile: true,
      explicitReconciliations: reconciliations,
      keyboardEscapeClosed: true,
      pageErrors: errors,
    })
    await context.close()
  }
  writeFileSync(
    `${output}/results.json`,
    `${JSON.stringify({ controlled: true, realProvider: false, browser: browser.version(), checks, captures }, null, 2)}\n`,
  )
  console.log(
    JSON.stringify({ passed: true, controlled: true, checks, output }),
  )
} finally {
  await browser?.close()
  server.kill('SIGTERM')
  log.end()
}
