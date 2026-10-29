import assert from 'node:assert/strict'

export interface DiscoveryScope {
  ownerId: string
  origin: string
  scratchDatabase: string
  providerName: string
  instanceName: string
}
export interface DiscoveryReceipt extends DiscoveryScope {
  providerCreated: true
  providerAbsentBefore: true
  providerId: string
  instanceId: string
  modelIds: number[]
}
export interface DiscoverySnapshot {
  providers: { name: string; id?: string }[]
  instances: { id: string; instance_name: string; provider_name: string }[]
  models: {
    id: number
    provider_name: string
    instance_id: string
    instance_name: string
  }[]
}
const sorted = (ids: number[]) => [...ids].sort((a, b) => a - b)

/** Owner mode must refuse a borrowed provider before discovery or any mutation. */
export function assertDiscoveryProviderAbsent(
  scope: DiscoveryScope,
  providers: DiscoverySnapshot['providers'],
) {
  for (const field of [
    'ownerId',
    'origin',
    'scratchDatabase',
    'providerName',
    'instanceName',
  ] as const)
    assert.ok(
      typeof scope[field] === 'string' && scope[field].trim(),
      `Missing discovery ${field}`,
    )
  assert.equal(
    providers.some((provider) => provider.name === scope.providerName),
    false,
    'The discovery fixture provider must not already exist',
  )
}

/** A receipt is authority only for this exact isolated owner, database and instance. */
export function validateDiscoveryReceipt(
  scope: DiscoveryScope,
  value: unknown,
): DiscoveryReceipt {
  assert.ok(
    value && typeof value === 'object' && !Array.isArray(value),
    'Invalid discovery receipt',
  )
  const receipt = value as Partial<DiscoveryReceipt>
  for (const field of [
    'ownerId',
    'origin',
    'scratchDatabase',
    'providerName',
    'instanceName',
  ] as const) {
    assert.ok(typeof scope[field] === 'string' && scope[field].trim())
    assert.equal(
      receipt[field],
      scope[field],
      `Discovery receipt ${field} changed`,
    )
  }
  assert.equal(
    receipt.providerCreated,
    true,
    'Discovery did not create this provider',
  )
  assert.equal(
    receipt.providerAbsentBefore,
    true,
    'Discovery provider initial absence was not proved',
  )
  assert.ok(typeof receipt.providerId === 'string' && receipt.providerId.trim())
  assert.ok(typeof receipt.instanceId === 'string' && receipt.instanceId.trim())
  assert.ok(Array.isArray(receipt.modelIds) && receipt.modelIds.length > 0)
  assert.ok(receipt.modelIds.every((id) => Number.isSafeInteger(id) && id > 0))
  assert.equal(new Set(receipt.modelIds).size, receipt.modelIds.length)
  return receipt as DiscoveryReceipt
}

/** Read current identities before deleting only the registered fixture instance. */
export async function cleanupDiscoveryFixture(
  scope: DiscoveryScope,
  value: unknown,
  api: {
    inventory: () => Promise<DiscoverySnapshot>
    deleteInstance: (provider: string, instance: string) => Promise<unknown>
  },
) {
  const receipt = validateDiscoveryReceipt(scope, value)
  const before = await api.inventory()
  const provider = before.providers.filter(
    (item) => item.name === scope.providerName,
  )
  assert.equal(provider.length, 1)
  assert.equal(
    provider[0].id,
    receipt.providerId,
    'Discovery provider identity changed',
  )
  const instance = before.instances.filter(
    (item) =>
      item.instance_name === scope.instanceName ||
      item.id === receipt.instanceId,
  )
  assert.equal(instance.length, 1)
  assert.equal(
    instance[0].id,
    receipt.instanceId,
    'Discovery instance identity changed',
  )
  assert.equal(instance[0].instance_name, scope.instanceName)
  assert.equal(instance[0].provider_name, scope.providerName)
  const models = before.models.filter(
    (item) =>
      item.instance_id === receipt.instanceId ||
      (item.provider_name === scope.providerName &&
        item.instance_name === scope.instanceName),
  )
  for (const model of models) {
    assert.equal(model.instance_id, receipt.instanceId)
    assert.equal(model.instance_name, scope.instanceName)
    assert.equal(model.provider_name, scope.providerName)
  }
  assert.deepEqual(
    sorted(models.map((item) => item.id)),
    sorted(receipt.modelIds),
    'Discovery model identities changed',
  )
  const borrowedInstances = before.instances.filter(
    (item) => item.id !== receipt.instanceId,
  )
  const borrowedModels = before.models.filter(
    (item) => !receipt.modelIds.includes(item.id),
  )
  await api.deleteInstance(scope.providerName, scope.instanceName)
  const remaining = await api.inventory()
  assert.equal(
    remaining.instances.some(
      (item) =>
        item.id === receipt.instanceId ||
        item.instance_name === scope.instanceName,
    ),
    false,
  )
  assert.equal(
    remaining.models.some((item) => receipt.modelIds.includes(item.id)),
    false,
  )
  assert.deepEqual(
    remaining.instances,
    borrowedInstances,
    'Unowned provider instances changed',
  )
  assert.deepEqual(remaining.models, borrowedModels, 'Unowned models changed')
  // Parent deletion is unsafe across an inventory/delete race. The registered
  // scratch-database owner removes the retained provider row during final DROP.
  return {
    modelIds: receipt.modelIds,
    instanceId: receipt.instanceId,
    providerDeleted: false,
  }
}
