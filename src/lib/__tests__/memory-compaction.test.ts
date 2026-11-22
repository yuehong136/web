import assert from 'node:assert/strict'
import test from 'node:test'
import { QueryClient } from '@tanstack/react-query'
import { compactionResult } from '../../components/memory/__tests__/memory-compaction-fixtures'
import {
  compactionBodyReady,
  compactionConsumptionReference,
  compactionCanStartNew,
  compactionNeedsPolling,
  validateCompactionResult,
} from '../memory-compaction'
import { protectMemoryCompaction } from '../../hooks/memory-compaction-fence'
import { memoryRevisionKeys } from '../../hooks/memory-revision-keys'

test('generated artifact is not ready while IO drains or validity is unchecked; polling never invokes generation', () => {
  const value = compactionResult()
  validateCompactionResult(value, 'bank', 'compaction-original')
  assert.equal(compactionBodyReady(value), true)
  value.operation.writer_busy = true
  assert.equal(compactionBodyReady(value), false)
  assert.equal(compactionCanStartNew(value), false)
  assert.equal(compactionNeedsPolling(value), true)
  value.operation.writer_busy = false
  value.operation.needs_operator_reconciliation = true
  assert.equal(compactionNeedsPolling(value), false)
  assert.equal(compactionCanStartNew(value), false)
  value.operation.needs_operator_reconciliation = false
  value.artifact.validity_checked = false
  assert.equal(compactionBodyReady(value), false)
})
test('invented lineage, reordered roots, lossy identifiers and redacted packages fail closed', () => {
  for (const mutate of [
    (v: ReturnType<typeof compactionResult>) =>
      v.artifact.package!.lineage.reverse(),
    (v: ReturnType<typeof compactionResult>) => {
      v.artifact.sources[0]!.source_id = '9223372036854775808'
    },
    (v: ReturnType<typeof compactionResult>) => {
      v.artifact.redacted = true
    },
    (v: ReturnType<typeof compactionResult>) => {
      v.operation.memory_id = 'other'
    },
  ]) {
    const value = compactionResult()
    mutate(value)
    assert.throws(() =>
      validateCompactionResult(value, 'bank', 'compaction-original'),
    )
  }
})
test('known withdrawal uses actual nested source wire shape, clears package without changing original operation', () => {
  const cache = new QueryClient(),
    value = compactionResult()
  cache.setQueryData(memoryRevisionKeys.operation('other-bank', 'withdraw'), {
    kind: 'withdraw_source',
    source: { source_id: value.artifact.sources[0]!.source_id },
    stop_supply: 'withdrawn',
  })
  assert.equal(protectMemoryCompaction(cache, 'bank', value), value)
  cache.setQueryData(memoryRevisionKeys.operation('bank', 'withdraw'), {
    kind: 'withdraw_source',
    source: { source_id: value.artifact.sources[0]!.source_id },
    stop_supply: 'withdrawn',
  })
  const safe = protectMemoryCompaction(cache, 'bank', value)
  assert.equal(safe.artifact.package, null)
  assert.equal(safe.artifact.valid_for_current, false)
  assert.equal(safe.operation.operation_id, value.operation.operation_id)
  cache.clear()
})

test('consumption reference has exactly four source-bound fields and cannot export an unchecked or invalid package', () => {
  const value = compactionResult()
  assert.deepEqual(
    compactionConsumptionReference(value, 'bank', 'compaction-original'),
    {
      memory_id: 'bank',
      operation_id: 'compaction-original',
      artifact_id: value.artifact.artifact_id,
      input_manifest_sha256: 'b'.repeat(64),
    },
  )
  for (const mutate of [
    (v: ReturnType<typeof compactionResult>) => {
      v.artifact.valid_for_current = false
    },
    (v: ReturnType<typeof compactionResult>) => {
      v.operation.writer_busy = true
    },
    (v: ReturnType<typeof compactionResult>) => {
      v.operation.status = 'persistence_unknown'
    },
    (v: ReturnType<typeof compactionResult>) => {
      v.artifact.input_manifest_sha256 = 'invalid'
    },
    (v: ReturnType<typeof compactionResult>) => {
      v.artifact.artifact_id = ''
      v.operation.artifact_id = ''
    },
  ]) {
    const invalid = compactionResult()
    mutate(invalid)
    assert.throws(() =>
      compactionConsumptionReference(invalid, 'bank', 'compaction-original'),
    )
  }
})
