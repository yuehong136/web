import assert from 'node:assert/strict'
import { randomUUID, createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { APIClient, APIError } from '../../src/api/client'
import {
  createMemoryVerificationAPI,
  createMemoryRevisionAPI,
} from '../../src/api/memory'
import type { MemoryVerificationRecord } from '../../src/types/memory-verification'
export interface MemoryVerificationConsumerConfig {
  baseURL: string
  token: string
  memoryId: string
  entryId: string
  ownedScratchConfirmed: true
  resultFile?: string
}
/** Caller owns the live managed scratch bank and cleanup; no model or publication command is used. */
export async function runMemoryVerificationConsumer(
  config: MemoryVerificationConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  const client = new APIClient(config.baseURL)
  client.setAuthToken(config.token)
  const api = createMemoryVerificationAPI(config.baseURL, client),
    revisions = createMemoryRevisionAPI(config.baseURL, client)
  const canonical = (value: string, zero = false) => {
    assert.equal(typeof value, 'string')
    assert.match(value, zero ? /^(0|[1-9][0-9]*)$/ : /^[1-9][0-9]*$/)
    assert.ok(BigInt(value) <= 9223372036854775807n)
  }
  const record = (value: MemoryVerificationRecord) => {
    assert.equal(value.entry_id, config.entryId)
    canonical(value.head_version)
    canonical(value.record_version)
    for (const source of value.binding.sources) {
      canonical(source.source_id)
      canonical(source.source_revision)
      canonical(source.source_generation)
    }
    assert.equal(value.checked_at_is_user_reported, true)
  }
  try {
    assert.equal(
      (await revisions.capabilities(config.memoryId)).verification?.supported,
      true,
    )
    const before = await revisions.getEntry(config.memoryId, config.entryId),
      snapshot = await api.snapshot(config.memoryId, config.entryId)
    canonical(snapshot.head_version, true)
    canonical(snapshot.binding.entry.revision)
    canonical(snapshot.binding.entry.message_id)
    assert.equal(snapshot.can_record, true)
    assert.equal(
      createHash('sha256').update(snapshot.entry_content!).digest('hex'),
      snapshot.binding.entry.content_sha256,
    )
    const historyBefore = await api.history(config.memoryId, config.entryId)
    await api.todos(config.memoryId)
    assert.deepEqual(
      (await api.history(config.memoryId, config.entryId)).records,
      historyBefore.records,
      'Reads must not create a verification',
    )
    const command = {
      operation_id: `web-verification-${randomUUID()}`,
      expected_head_version: snapshot.head_version,
      expected_binding_sha256: snapshot.binding_sha256,
      checked_at: new Date().toISOString(),
      result: 'human_confirmed' as const,
      method: 'source_comparison' as const,
      applicability:
        'Controlled scratch scope; this exact entry and source binding only.',
      notes:
        'Human reviewed the controlled source and current entry. No independent factual guarantee.',
      evidence: [
        {
          description: 'Controlled fixture source comparison',
          reference: 'fixture reference; opaque text, never fetched',
        },
      ],
    }
    const confirmed = await api.record(config.memoryId, config.entryId, command)
    record(confirmed.record)
    assert.equal(confirmed.status, 'ready')
    assert.equal(confirmed.record.effective_status, 'human_confirmed')
    assert.equal(confirmed.record.valid_for_current, true)
    assert.equal(
      (await api.record(config.memoryId, config.entryId, command))
        .verification_id,
      confirmed.verification_id,
    )
    await assert.rejects(
      api.record(config.memoryId, config.entryId, {
        ...command,
        notes: 'A different command body',
      }),
      (error: unknown) => error instanceof APIError && error.status === 409,
    )
    const next = await api.snapshot(config.memoryId, config.entryId)
    const disputed = await api.record(config.memoryId, config.entryId, {
      ...command,
      operation_id: `web-verification-${randomUUID()}`,
      expected_head_version: next.head_version,
      expected_binding_sha256: next.binding_sha256,
      result: 'disputed',
      notes:
        'Controlled human dispute; the entry text is deliberately unchanged.',
    })
    record(disputed.record)
    assert.equal(disputed.record.effective_status, 'disputed')
    assert.equal(disputed.record.review_required, true)
    const todo = await api.todos(config.memoryId)
    assert.ok(
      todo.items.some(
        (item) => item.verification_id === disputed.verification_id,
      ),
    )
    assert.ok(
      !todo.items.some(
        (item) => item.verification_id === confirmed.verification_id,
      ),
      'Superseded records do not occupy review work',
    )
    const old = await api.operation(config.memoryId, confirmed.operation_id)
    assert.equal(old.status, 'ready')
    assert.equal(old.record.effective_status, 'superseded')
    assert.equal(
      old.record.valid_for_current,
      false,
      'SQL receipt readiness must not imply current confirmation',
    )
    const revoke = {
      operation_id: `web-verification-${randomUUID()}`,
      expected_head_version: disputed.head_version,
      reason: 'Controlled revocation of the human assessment only.',
    }
    const revoked = await api.revoke(
      config.memoryId,
      disputed.verification_id,
      revoke,
    )
    record(revoked.record)
    assert.equal(revoked.record.effective_status, 'revoked')
    assert.equal(revoked.record.valid_for_current, false)
    assert.equal(revoked.record.review_required, true)
    const revokedTodo = await api.todos(config.memoryId)
    assert.ok(
      revokedTodo.items.some(
        (item) =>
          item.verification_id === disputed.verification_id &&
          item.effective_status === 'revoked',
      ),
    )
    assert.ok(
      !revokedTodo.items.some(
        (item) => item.verification_id === confirmed.verification_id,
      ),
    )
    assert.equal(
      (await api.revoke(config.memoryId, disputed.verification_id, revoke))
        .operation_id,
      revoke.operation_id,
    )
    assert.deepEqual(
      await revisions.getEntry(config.memoryId, config.entryId),
      before,
      'Verification does not change entry content, revision or original assessment',
    )
    const history = await api.history(config.memoryId, config.entryId)
    assert.ok(
      history.records.some(
        (item) =>
          item.verification_id === confirmed.verification_id &&
          item.effective_status === 'superseded',
      ),
    )
    return {
      passed: true,
      verificationIds: [confirmed.verification_id, disputed.verification_id],
      sqlOperationReadyIsNotCurrentConfirmation: true,
      exactBindingAndHeadCAS: true,
      explicitHumanOnly: true,
      readonlyReads: true,
      disputedLatestInTodo: true,
      revocationReplay: true,
      entryAndAssessmentUnchanged: true,
      noModelOrPublication: true,
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
  ) as MemoryVerificationConsumerConfig
  const result = await runMemoryVerificationConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result))
}
