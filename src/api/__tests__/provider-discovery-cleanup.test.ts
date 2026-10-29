import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assertDiscoveryProviderAbsent,
  cleanupDiscoveryFixture,
  type DiscoveryReceipt,
  type DiscoverySnapshot,
} from '../../../scripts/provider-discovery-cleanup'

test('discovery cleanup rejects mismatched ownership receipts and current resource identities before deleting anything', async () => {
  const scope = {
    ownerId: 'fixture-owner',
    origin: 'http://127.0.0.1:20001',
    scratchDatabase: 'fixture_db',
    providerName: 'Ollama',
    instanceName: 'fixture-instance',
  }
  const receipt: DiscoveryReceipt = {
    ...scope,
    providerCreated: true,
    providerAbsentBefore: true,
    providerId: 'created-provider',
    instanceId: 'created-instance',
    modelIds: [123],
  }
  const writes: string[] = []
  const snapshot: DiscoverySnapshot = {
    providers: [{ name: 'Ollama', id: 'created-provider' }],
    instances: [
      {
        id: 'created-instance',
        instance_name: 'fixture-instance',
        provider_name: 'Ollama',
      },
    ],
    models: [
      {
        id: 123,
        provider_name: 'Ollama',
        instance_id: 'created-instance',
        instance_name: 'fixture-instance',
      },
    ],
  }
  const api = {
    inventory: async () => snapshot,
    deleteInstance: async () => {
      writes.push('instance')
    },
    deleteProvider: async () => {
      writes.push('provider')
    },
  }
  // Owner mode never borrows an existing provider, even before discovery begins.
  assert.throws(() => assertDiscoveryProviderAbsent(scope, snapshot.providers))
  assertDiscoveryProviderAbsent(scope, [])
  for (const bad of [
    null,
    {},
    ...[
      'ownerId',
      'origin',
      'scratchDatabase',
      'providerName',
      'instanceName',
    ].map((field) => ({ ...receipt, [field]: 'different' })),
    { ...receipt, providerCreated: false },
    { ...receipt, providerAbsentBefore: false },
    { ...receipt, instanceId: '' },
    { ...receipt, providerId: '' },
    { ...receipt, modelIds: [] },
    { ...receipt, modelIds: [123, 123] },
    { ...receipt, modelIds: [0] },
    { ...receipt, modelIds: [1.5] },
    { ...receipt, providerId: 'replacement-provider' },
    { ...receipt, instanceId: 'replacement-instance' },
    { ...receipt, modelIds: [999] },
  ])
    await assert.rejects(cleanupDiscoveryFixture(scope, bad, api))
  snapshot.models.push({ ...snapshot.models[0], id: 124 })
  await assert.rejects(cleanupDiscoveryFixture(scope, receipt, api))
  assert.deepEqual(writes, [])
})

test('discovery cleanup deletes the exact owned instance and preserves another instance of the same provider', async () => {
  const scope = {
    ownerId: 'fixture-owner',
    origin: 'http://127.0.0.1:20001',
    scratchDatabase: 'fixture_db',
    providerName: 'Ollama',
    instanceName: 'fixture-instance',
  }
  const receipt: DiscoveryReceipt = {
    ...scope,
    providerCreated: true,
    providerAbsentBefore: true,
    providerId: 'created-provider',
    instanceId: 'created-instance',
    modelIds: [123],
  }
  const other = {
    id: 'borrowed-instance',
    instance_name: 'someone-else',
    provider_name: 'Ollama',
  }
  const otherModel = {
    id: 999,
    provider_name: 'Ollama',
    instance_id: other.id,
    instance_name: other.instance_name,
  }
  const snapshot: DiscoverySnapshot = {
    providers: [{ name: 'Ollama', id: 'created-provider' }],
    instances: [
      {
        id: receipt.instanceId,
        instance_name: scope.instanceName,
        provider_name: scope.providerName,
      },
      other,
    ],
    models: [
      {
        id: 123,
        provider_name: scope.providerName,
        instance_id: receipt.instanceId,
        instance_name: scope.instanceName,
      },
      otherModel,
    ],
  }
  const calls: unknown[][] = []
  const result = await cleanupDiscoveryFixture(scope, receipt, {
    inventory: async () => structuredClone(snapshot),
    deleteInstance: async (provider, instance) => {
      calls.push(['instance', provider, instance])
      snapshot.instances = snapshot.instances.filter(
        (item) => item.id !== receipt.instanceId,
      )
      snapshot.models = snapshot.models.filter(
        (item) => !receipt.modelIds.includes(item.id),
      )
    },
    deleteProvider: async (provider) => {
      calls.push(['provider', provider])
    },
  })
  assert.deepEqual(calls, [['instance', 'Ollama', 'fixture-instance']])
  assert.equal(result.providerDeleted, false)
  assert.deepEqual(snapshot.instances, [other])
  assert.deepEqual(snapshot.models, [otherModel])
  assert.deepEqual(snapshot.providers, [
    { name: 'Ollama', id: 'created-provider' },
  ])
})

test('discovery cleanup removes a proven newly created provider only after its owned instance and models are gone', async () => {
  const scope = {
    ownerId: 'fixture-owner',
    origin: 'http://127.0.0.1:20001',
    scratchDatabase: 'fixture_db',
    providerName: 'Ollama',
    instanceName: 'fixture-instance',
  }
  const receipt: DiscoveryReceipt = {
    ...scope,
    providerCreated: true,
    providerAbsentBefore: true,
    providerId: 'created-provider',
    instanceId: 'created-instance',
    modelIds: [123],
  }
  const snapshot: DiscoverySnapshot = {
    providers: [{ name: 'Ollama', id: 'created-provider' }],
    instances: [
      {
        id: receipt.instanceId,
        instance_name: scope.instanceName,
        provider_name: scope.providerName,
      },
    ],
    models: [
      {
        id: 123,
        provider_name: scope.providerName,
        instance_id: receipt.instanceId,
        instance_name: scope.instanceName,
      },
    ],
  }
  const calls: string[] = []
  const result = await cleanupDiscoveryFixture(scope, receipt, {
    inventory: async () => structuredClone(snapshot),
    deleteInstance: async () => {
      calls.push('instance')
      snapshot.instances = []
      snapshot.models = []
    },
    deleteProvider: async () => {
      assert.deepEqual(snapshot.instances, [])
      assert.deepEqual(snapshot.models, [])
      calls.push('provider')
      snapshot.providers = []
    },
  })
  assert.deepEqual(calls, ['instance', 'provider'])
  assert.equal(result.providerDeleted, true)
})
