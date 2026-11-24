import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { installMemoryIncrementalFixture } from './memory-incremental-fixture.mjs'
import {
  verificationCapability,
  verificationRecord,
  verificationSnapshot,
} from '../../src/components/memory/__tests__/memory-verification-fixture.ts'
import { fingerprint } from './memory-incremental-data.mjs'
/** Reads never advance human review; only explicit commands and the external driver change state. */
export async function installMemoryVerificationFixture(context, onError) {
  const base = await installMemoryIncrementalFixture(context, onError),
    cap = structuredClone(base.capabilities)
  cap.verification = verificationCapability
  const mid = 'owned-memory',
    eid = 'e'.repeat(32),
    content =
      'Current entry: send a concise written briefing before meetings. 当前记忆：会前发送简短书面提要。\n<script>window.verificationInjected=true</script>'
  let head = 1,
    changed = false,
    withdrawn = false,
    failRecord = false,
    receiptVisible = true
  const records = [
      {
        ...verificationRecord(),
        memory_id: mid,
        result: 'disputed',
        effective_status: 'disputed',
        review_required: true,
      },
    ],
    operations = new Map(),
    calls = { snapshot: 0, record: [], revoke: [], reads: 0 },
    errors = []
  function snapshot() {
    const value = verificationSnapshot()
    value.memory_id = mid
    value.head_version = String(head)
    value.entry_content = content
    value.binding.entry.content_sha256 = createHash('sha256')
      .update(content)
      .digest('hex')
    if (changed) value.binding.sources[0].source_generation = '3'
    value.binding_sha256 = fingerprint(value.binding)
    value.current_record = view(records.at(-1))
    return value
  }
  const original = snapshot.bind(null)
  function view(record) {
    if (!record) return null
    const current = record === records.at(-1),
      effective = withdrawn
        ? 'redacted'
        : !current
          ? 'superseded'
          : record.state === 'revoked'
            ? 'revoked'
            : changed && record.binding.sources[0].source_generation !== '3'
              ? 'stale'
              : record.result
    return {
      ...structuredClone(record),
      head_version: String(head),
      is_current: current,
      effective_status: effective,
      state: withdrawn ? 'redacted' : record.state,
      valid_for_current:
        current && effective === record.result && record.state === 'active',
      review_required:
        current &&
        ['disputed', 'needs_review', 'stale', 'revoked'].includes(effective),
      stale_reasons:
        effective === 'stale'
          ? ['source_changed']
          : effective === 'redacted'
            ? ['record_redacted']
            : effective === 'superseded'
              ? ['record_superseded']
              : effective === 'revoked'
                ? ['record_revoked']
                : [],
      notes: withdrawn ? null : record.notes,
      applicability: withdrawn ? null : record.applicability,
      evidence: withdrawn ? [] : record.evidence,
      revocation_reason: withdrawn ? null : record.revocation_reason,
      can_actions: {
        record: !withdrawn,
        revoke: current && record.state === 'active' && !withdrawn,
      },
    }
  }
  records[0].binding = original().binding
  records[0].binding_sha256 = fingerprint(records[0].binding)
  function operation(id) {
    const item = operations.get(id)
    assert.ok(item)
    return {
      operation_id: id,
      kind: item.kind,
      status: 'ready',
      verification_id: item.record.verification_id,
      head_version: String(item.head),
      record: view(item.record),
    }
  }
  await context.route('**/api/v1/memories/owned-memory/**', async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname
    if (
      !/\/capabilities$|verification-snapshot|\/verifications(?:\/|$)|\/verification-operations\/|\/verification-todos$/.test(
        path,
      )
    ) {
      await route.fallback()
      return
    }
    try {
      const body = request.method() === 'POST' ? request.postDataJSON() : null
      let data,
        status = 200
      if (path.endsWith('/capabilities')) data = cap
      else if (path.endsWith('/verification-snapshot')) {
        calls.snapshot++
        if (withdrawn) {
          status = 404
          data = {}
        } else data = snapshot()
      } else if (path.includes('/verification-operations/')) {
        calls.reads++
        const op = decodeURIComponent(
          path.split('/verification-operations/')[1],
        )
        if (!receiptVisible || !operations.has(op)) {
          status = 503
          data = { operation_id: op }
        } else data = operation(op)
      } else if (path.endsWith('/verification-todos'))
        data = {
          items: records
            .map(view)
            .filter((item) => item.is_current && item.review_required),
          next_cursor: null,
          has_more: false,
          scan_limited: true,
          scanned_count: 64,
          inventory_scope: 'latest_registered_verification_heads',
          snapshot_only: true,
        }
      else if (path.endsWith('/verifications') && request.method() === 'GET')
        data = {
          records: [...records].reverse().map(view),
          next_cursor: null,
          has_more: false,
          snapshot_only: true,
        }
      else if (path.endsWith('/verifications')) {
        calls.record.push(body)
        const previous = operations.get(body.operation_id)
        if (previous) {
          assert.equal(previous.hash, fingerprint(body))
          data = operation(body.operation_id)
        } else if (
          body.expected_head_version !== String(head) ||
          body.expected_binding_sha256 !== snapshot().binding_sha256
        ) {
          status = 409
          data = {}
        } else {
          const current = snapshot()
          head++
          const record = {
            ...verificationRecord(),
            ...body,
            checked_at_is_user_reported: body.checked_at !== undefined,
            memory_id: mid,
            entry_id: eid,
            verification_id: String(head).repeat(32),
            head_version: String(head),
            record_version: String(head),
            binding: current.binding,
            binding_sha256: current.binding_sha256,
          }
          records.push(record)
          operations.set(body.operation_id, {
            kind: 'verification_record',
            record,
            head,
            hash: fingerprint(body),
          })
          data = operation(body.operation_id)
          if (failRecord) {
            failRecord = false
            receiptVisible = false
            status = 503
            data = { operation_id: body.operation_id }
          }
        }
      } else if (path.endsWith('/revocations')) {
        calls.revoke.push(body)
        const record = records.find((item) =>
          path.includes(item.verification_id),
        )
        assert.ok(record)
        assert.equal(body.expected_head_version, String(head))
        head++
        record.state = 'revoked'
        record.revocation_reason = body.reason
        operations.set(body.operation_id, {
          kind: 'verification_revoke',
          record,
          head,
          hash: fingerprint(body),
        })
        data = operation(body.operation_id)
      }
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          retcode: status === 200 ? 0 : status,
          retmsg:
            status === 200 ? '' : 'Controlled uncertainty or stale binding',
          data,
        }),
      })
    } catch (error) {
      errors.push(error.message)
      onError?.(error.message)
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          retcode: 500,
          retmsg: 'Controlled verification fixture failed',
          data: null,
        }),
      })
    }
  })
  return {
    calls,
    errors,
    eid,
    failNextRecord: () => {
      failRecord = true
    },
    releaseReceipt: () => {
      receiptVisible = true
    },
    changeSource: () => {
      changed = true
    },
    withdraw: () => {
      withdrawn = true
    },
  }
}
