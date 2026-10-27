import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createContextManifest,
  workspaceCapabilities,
  type ContextResource,
} from '../contracts'

test('a submitted manifest keeps the captured scope and resources after the next selection', () => {
  const scope = { identity: 'user:tenant', threadId: 'first' }
  const resources: ContextResource[] = [
    {
      kind: 'tool',
      id: 'tool-1',
      label: 'Search',
      availability: 'ready',
      origin: 'turn',
    },
  ]
  const snapshot = createContextManifest({
    scope,
    messageId: 'message-1',
    stage: 'submitted',
    resources,
  })
  scope.threadId = 'second'
  resources[0] = { ...resources[0], id: 'tool-2' }
  resources.push({ ...resources[0], id: 'tool-3' })
  assert.equal(snapshot.scope.threadId, 'first')
  assert.equal(snapshot.resources.length, 1)
  assert.equal(snapshot.resources[0].id, 'tool-1')
  assert.equal(snapshot.stage, 'submitted')
  assert.ok(Object.isFrozen(snapshot.resources[0]))
})

test('client capabilities never imply backend receipts or persistent artifact versions', () => {
  for (const capability of [
    'durableRun',
    'serverCancel',
    'queue',
    'steer',
    'artifactSave',
    'artifactRevision',
    'toolApproval',
  ] as const)
    assert.equal(workspaceCapabilities[capability], false)
})
