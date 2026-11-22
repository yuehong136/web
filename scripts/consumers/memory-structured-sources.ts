import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { APIClient } from '../../src/api/client'
import { createMemorySourcesAPI } from '../../src/api/memory-sources'
import { validateSourceProvenance } from '../../src/lib/memory-source-provenance'
import type {
  MemorySourceBinding,
  MemorySourceSegment,
} from '../../src/types/memory-sources'
export interface MemoryStructuredSourceConsumerConfig {
  baseURL: string
  token: string
  memoryId: string
  sourceId: string
  expected: {
    segments: MemorySourceSegment[]
    eventTime: string | null
    submittedBy: string
    scope: { user_id: string; agent_id: string; session_id: string }
  }
  ownedScratchConfirmed: true
  resultFile?: string
}
/** Read-only consumer: the parent creates and cleans the source and measures SQL/model effects. */
export async function runMemoryStructuredSourceConsumer(
  config: MemoryStructuredSourceConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  const client = new APIClient(config.baseURL)
  client.setAuthToken(config.token)
  const api = createMemorySourcesAPI(config.baseURL, client)
  try {
    const lean = await api.provenance(config.memoryId, config.sourceId)
    validateSourceProvenance(lean, config.memoryId, config.sourceId)
    assert.equal(lean.format, 'structured')
    assert.equal(lean.segments, null)
    assert.equal(lean.segments_included, false)
    assert.equal(lean.segment_count, config.expected.segments.length)
    assert.deepEqual(lean.declared_roles, [
      ...new Set(config.expected.segments.map((item) => item.role)),
    ])
    assert.equal(lean.event_time.value, config.expected.eventTime)
    assert.equal(
      lean.event_time.status,
      config.expected.eventTime === null ? 'unknown' : 'caller_declared',
    )
    assert.equal(lean.provenance.submitted_by, config.expected.submittedBy)
    assert.equal(lean.provenance.authenticated_submitter, true)
    assert.equal(lean.provenance.speaker_identity_verified, false)
    assert.equal(lean.provenance.content_verified, false)
    assert.deepEqual(lean.scope, config.expected.scope)
    assert.ok(lean.received_at)
    assert.ok(lean.reference_time)
    const binding: MemorySourceBinding = {
      source_id: config.sourceId,
      source_revision: lean.source_revision!,
      source_generation: lean.source_generation!,
      content_sha256: lean.content_sha256,
      provenance_sha256: lean.provenance_sha256!,
      scope: lean.scope,
    }
    const full = await api.provenance(config.memoryId, config.sourceId, {
      binding,
      includeSegments: true,
    })
    validateSourceProvenance(
      full,
      config.memoryId,
      config.sourceId,
      binding,
      true,
    )
    assert.deepEqual(full.segments, config.expected.segments)
    const again = await api.provenance(config.memoryId, config.sourceId, {
      binding,
    })
    assert.deepEqual(
      again,
      lean,
      'Explicit full reading must not mutate the receipt or the following lean response',
    )
    return {
      passed: true,
      readOnly: true,
      sourceId: lean.source_id,
      sourceRevision: lean.source_revision,
      sourceGeneration: lean.source_generation,
      contentSha256: lean.content_sha256,
      provenanceSha256: lean.provenance_sha256,
      segmentCount: lean.segment_count,
      defaultHasSegmentBody: lean.segments !== null,
      roleStatus: lean.role_status,
      authenticatedSubmitter: lean.provenance.authenticated_submitter,
      speakerIdentityVerified: lean.provenance.speaker_identity_verified,
      contentVerified: lean.provenance.content_verified,
    }
  } finally {
    client.setAuthToken(null)
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const config: MemoryStructuredSourceConsumerConfig = JSON.parse(
    readFileSync(process.argv[2], 'utf8'),
  )
  const result = await runMemoryStructuredSourceConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n', {
      mode: 0o600,
      flag: 'wx',
    })
  else console.log(JSON.stringify(result))
}
