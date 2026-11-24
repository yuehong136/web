import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { randomUUID } from 'node:crypto'
import { APIClient, APIError } from '../../src/api/client'
import { createMemoryRevisionAPI } from '../../src/api/memory'

export interface MemoryRevisionConsumerConfig {
  baseURL: string
  token: string
  memoryId: string
  derivedMessageId: string
  sourceId: string
  correctedContent: string
  ownedScratchConfirmed: true
  resultFile?: string
}

/** Mutates only the caller's explicitly owned scratch memory; never creates credentials. */
export async function runMemoryRevisionConsumer(
  config: MemoryRevisionConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  assert.match(config.derivedMessageId, /^[1-9][0-9]*$/)
  assert.match(config.sourceId, /^[1-9][0-9]*$/)
  const client = new APIClient(config.baseURL)
  client.setAuthToken(config.token)
  const api = createMemoryRevisionAPI(config.baseURL, client)
  const op = () => `web-consumer-${randomUUID()}`
  try {
    const capabilities = await api.capabilities(config.memoryId)
    assert.equal(capabilities.revisions?.supported, true)
    const initial = await api.findEntry(
      config.memoryId,
      config.derivedMessageId,
    )
    assert.equal(
      initial,
      null,
      'The scratch derived record must start unmanaged',
    )
    const adoption = await api.adoptEntry(
      config.memoryId,
      op(),
      config.derivedMessageId,
    )
    assert.equal(adoption.index_sync_status, 'ready')
    const entry = await api.findEntry(config.memoryId, config.derivedMessageId)
    assert.ok(entry)
    assert.equal(entry.legacy_message_id, config.derivedMessageId)
    assert.equal(typeof entry.current_message_id, 'string')
    const command = {
      operation_id: op(),
      expected_revision: entry.current_revision,
      content: config.correctedContent,
      reason: 'Controlled Web consumer correction',
      dry_run: true,
    }
    const preview = await api.revise(config.memoryId, entry.entry_id, command)
    assert.ok('dry_run' in preview && preview.dry_run)
    assert.equal(preview.diff.new_text, config.correctedContent)
    const afterPreview = await api.getEntry(config.memoryId, entry.entry_id)
    assert.equal(
      afterPreview.current_revision,
      entry.current_revision,
      'Preview must not publish',
    )
    const submit = { ...command, operation_id: op(), dry_run: false }
    const accepted = await api.revise(config.memoryId, entry.entry_id, submit)
    assert.ok('operation_id' in accepted)
    let status = await api.operation(config.memoryId, submit.operation_id)
    const repeatRead = await api.operation(config.memoryId, submit.operation_id)
    assert.equal(
      repeatRead.index_sync_status,
      status.index_sync_status,
      'GET must not advance publication',
    )
    if (status.index_sync_status !== 'ready')
      status = await api.reconcile(config.memoryId, submit.operation_id)
    assert.equal(status.index_sync_status, 'ready', 'Accepted is not completed')
    const corrected = await api.getEntry(config.memoryId, entry.entry_id)
    assert.equal(corrected.current_revision, entry.current_revision + 1)
    assert.equal(corrected.current.content, config.correctedContent)
    assert.equal(typeof corrected.current.message_id, 'string')
    await assert.rejects(
      api.revise(config.memoryId, entry.entry_id, {
        ...submit,
        operation_id: op(),
      }),
      (error: unknown) => error instanceof APIError && error.status === 409,
    )
    const history = await api.history(config.memoryId, entry.entry_id)
    assert.equal(history.revisions.length, 2)
    assert.ok(
      history.revisions.every(
        (revision) => typeof revision.message_id === 'string',
      ),
    )
    assert.ok(
      history.revisions.some((revision) =>
        revision.sources.some((source) => source.source_id === config.sourceId),
      ),
    )
    const source = await api.source(config.memoryId, config.sourceId)
    assert.equal(source.managed, true)
    assert.ok(source.source_revision)
    const withdrawal = await api.withdraw(
      config.memoryId,
      config.sourceId,
      op(),
      source.source_revision,
      'Controlled Web consumer source withdrawal',
    )
    let cleanup = await api.operation(config.memoryId, withdrawal.operation_id)
    if (cleanup.index_sync_status !== 'ready')
      cleanup = await api.reconcile(config.memoryId, withdrawal.operation_id)
    assert.equal(cleanup.index_sync_status, 'ready')
    const withdrawn = await api.source(config.memoryId, config.sourceId)
    assert.equal(withdrawn.state, 'forgotten')
    const redacted = await api.history(config.memoryId, entry.entry_id)
    assert.ok(
      redacted.revisions.every(
        (revision) => revision.redacted && revision.content === null,
      ),
    )
    return {
      passed: true,
      managedBank: config.memoryId,
      entryId: entry.entry_id,
      physicalIdStrings: true,
      previewReadOnly: true,
      staleRevision409: true,
      revisionCount: 2,
      sourceWithdrawn: true,
      historyRedacted: true,
      physicalCleanupComplete: cleanup.physical_cleanup_complete === true,
    }
  } finally {
    client.setAuthToken(null)
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const config = JSON.parse(
    readFileSync(process.argv[2], 'utf8'),
  ) as MemoryRevisionConsumerConfig
  const result = await runMemoryRevisionConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, `${JSON.stringify(result, null, 2)}\n`, {
      mode: 0o600,
    })
  process.stdout.write(`${JSON.stringify(result)}\n`)
}
