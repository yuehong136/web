import type {
  GatewayCatalog,
  GatewayCatalogModel,
  GatewayConnection,
  GatewayKey,
} from '@/api/model-gateway'

export interface ConnectionGroup extends GatewayConnection {
  models: GatewayCatalogModel[]
}

export interface ProviderGroup {
  provider: string
  connections: ConnectionGroup[]
  /** No model of the provider can be relayed: its protocol is not supported. */
  unsupported: boolean
}

export const isCallable = (model: GatewayCatalogModel) =>
  model.state === 'callable'

/**
 * Provider → connection → models, in the catalog's order (providers as in
 * model management, then connection name, then model name). Connections
 * without (matching) models are left out.
 */
export function groupCatalog(
  catalog: GatewayCatalog,
  keep: (model: GatewayCatalogModel) => boolean = () => true,
): ProviderGroup[] {
  const providers = new Map<string, ProviderGroup>()
  const connections = new Map<string, ConnectionGroup>()
  const connectionOf = (connection: GatewayConnection) => {
    let group = connections.get(connection.instance_id)
    if (!group) {
      group = { ...connection, models: [] }
      connections.set(connection.instance_id, group)
      let provider = providers.get(connection.provider)
      if (!provider) {
        provider = {
          provider: connection.provider,
          connections: [],
          unsupported: false,
        }
        providers.set(connection.provider, provider)
      }
      provider.connections.push(group)
    }
    return group
  }
  for (const connection of catalog.connections) connectionOf(connection)
  for (const model of catalog.models) {
    const group = connectionOf({
      instance_id: model.instance_id,
      instance_name: model.instance_name,
      provider: model.provider,
    })
    if (keep(model)) group.models.push(model)
  }
  const unsupported = unsupportedProviders(catalog)
  return [...providers.values()]
    .map((provider) => ({
      ...provider,
      unsupported: unsupported.has(provider.provider),
      connections: provider.connections.filter(
        (connection) => connection.models.length > 0,
      ),
    }))
    .filter((provider) => provider.connections.length > 0)
}

/** Providers whose every model is unavailable because it is not relayed. */
export function unsupportedProviders(catalog: GatewayCatalog): Set<string> {
  const byProvider = new Map<string, boolean>()
  for (const model of catalog.models) {
    const notRelayed = model.reason === 'provider_not_supported'
    byProvider.set(
      model.provider,
      (byProvider.get(model.provider) ?? true) && notRelayed,
    )
  }
  return new Set(
    [...byProvider].filter(([, value]) => value).map(([provider]) => provider),
  )
}

/** A key's model scope, as stored on the key and edited in the form. */
export interface KeyScope {
  allModels: boolean
  /** Whole connections, including models opened there later. */
  instanceIds: string[]
  /** A snapshot of registered model ids. */
  modelIds: string[]
}

export const scopeOfKey = (key: GatewayKey): KeyScope => ({
  allModels: key.allow_all_models,
  instanceIds: key.allowed_instance_ids,
  modelIds: key.allowed_model_ids,
})

export const emptyScope = (): KeyScope => ({
  allModels: false,
  instanceIds: [],
  modelIds: [],
})

/** Whether the scope reaches a model, whatever the model's state. */
export const scopeCovers = (scope: KeyScope, model: GatewayCatalogModel) =>
  scope.allModels ||
  scope.instanceIds.includes(model.instance_id) ||
  scope.modelIds.includes(model.model_id)

/** The models a key with this scope can call right now. */
export const callableModels = (
  catalog: GatewayCatalog,
  scope: KeyScope,
): GatewayCatalogModel[] =>
  catalog.models.filter(
    (model) => isCallable(model) && scopeCovers(scope, model),
  )

export interface StaleGrants {
  /** Granted model ids no longer in the catalog. */
  deletedModelIds: string[]
  /** Granted models that exist but cannot be called. */
  unavailableModels: GatewayCatalogModel[]
  /** Granted connections that no longer exist. */
  deletedInstanceIds: string[]
  count: number
}

/**
 * Grants that point at deleted or uncallable models and deleted connections,
 * shown as "N no longer valid". "All models" has nothing to go stale.
 */
export function staleGrants(
  catalog: GatewayCatalog,
  scope: KeyScope,
): StaleGrants {
  if (scope.allModels)
    return {
      deletedModelIds: [],
      unavailableModels: [],
      deletedInstanceIds: [],
      count: 0,
    }
  const models = new Map(catalog.models.map((model) => [model.model_id, model]))
  const connections = new Set(
    catalog.connections.map((connection) => connection.instance_id),
  )
  const deletedModelIds = scope.modelIds.filter((id) => !models.has(id))
  const unavailableModels = scope.modelIds
    .map((id) => models.get(id))
    .filter(
      (model): model is GatewayCatalogModel =>
        model !== undefined && !isCallable(model),
    )
  const deletedInstanceIds = scope.instanceIds.filter(
    (id) => !connections.has(id),
  )
  return {
    deletedModelIds,
    unavailableModels,
    deletedInstanceIds,
    count:
      deletedModelIds.length +
      unavailableModels.length +
      deletedInstanceIds.length,
  }
}

export interface ProviderScopePart {
  provider: string
  /** Every connection of the provider is granted as a whole. */
  whole: boolean
  /** Granted models of the provider still in the catalog. */
  count: number
}

/** "Tongyi-Qianwen all · VLLM 1" — the providers a custom scope reaches. */
export function scopeByProvider(
  catalog: GatewayCatalog,
  scope: KeyScope,
): ProviderScopePart[] {
  const parts = new Map<string, ProviderScopePart>()
  const part = (provider: string) => {
    let entry = parts.get(provider)
    if (!entry) {
      entry = { provider, whole: false, count: 0 }
      parts.set(provider, entry)
    }
    return entry
  }
  for (const connection of catalog.connections)
    if (scope.instanceIds.includes(connection.instance_id))
      part(connection.provider)
  for (const model of catalog.models)
    if (
      scope.instanceIds.includes(model.instance_id) ||
      scope.modelIds.includes(model.model_id)
    )
      part(model.provider).count += 1
  for (const entry of parts.values()) {
    const own = catalog.connections.filter(
      (connection) => connection.provider === entry.provider,
    )
    entry.whole =
      own.length > 0 &&
      own.every((connection) =>
        scope.instanceIds.includes(connection.instance_id),
      )
  }
  return [...parts.values()]
}

export interface ConnectionGrant {
  instanceId: string
  instanceName: string
  /** Granted as a whole, including models opened later. */
  whole: boolean
  models: Array<{ model: GatewayCatalogModel; stale: boolean }>
}

export interface ProviderGrant {
  provider: string
  connections: ConnectionGrant[]
}

/**
 * The scope of a custom key grouped by provider and connection, for the key
 * detail: whole connections list what they reach now; picked models are
 * marked when they can no longer be called.
 */
export function scopeGrants(
  catalog: GatewayCatalog,
  scope: KeyScope,
): ProviderGrant[] {
  const result: ProviderGrant[] = []
  for (const group of groupCatalog(catalog)) {
    const connections: ConnectionGrant[] = []
    for (const connection of group.connections) {
      const whole = scope.instanceIds.includes(connection.instance_id)
      const models = whole
        ? connection.models
            .filter(isCallable)
            .map((model) => ({ model, stale: false }))
        : connection.models
            .filter((model) => scope.modelIds.includes(model.model_id))
            .map((model) => ({ model, stale: !isCallable(model) }))
      if (whole || models.length > 0)
        connections.push({
          instanceId: connection.instance_id,
          instanceName: connection.instance_name,
          whole,
          models,
        })
    }
    // A granted connection without models is still part of the scope.
    for (const connection of catalog.connections)
      if (
        connection.provider === group.provider &&
        scope.instanceIds.includes(connection.instance_id) &&
        !connections.some((item) => item.instanceId === connection.instance_id)
      )
        connections.push({
          instanceId: connection.instance_id,
          instanceName: connection.instance_name,
          whole: true,
          models: [],
        })
    if (connections.length > 0)
      result.push({ provider: group.provider, connections })
  }
  return result
}

export type ConnectionCheck = 'checked' | 'mixed' | 'unchecked'

/** Tri-state of a connection row in the scope picker. */
export function connectionCheck(
  scope: KeyScope,
  connection: ConnectionGroup,
): ConnectionCheck {
  if (scope.instanceIds.includes(connection.instance_id)) return 'checked'
  return connection.models.some((model) =>
    scope.modelIds.includes(model.model_id),
  )
    ? 'mixed'
    : 'unchecked'
}

/** A model row is checked when picked, or callable in a whole connection. */
export const modelChecked = (scope: KeyScope, model: GatewayCatalogModel) =>
  scope.instanceIds.includes(model.instance_id)
    ? isCallable(model)
    : scope.modelIds.includes(model.model_id)

/**
 * Checking a connection grants it as a whole (picked models of it are folded
 * in); unchecking removes the connection and its picked models.
 */
export function toggleConnection(
  scope: KeyScope,
  connection: ConnectionGroup,
): KeyScope {
  const own = new Set(connection.models.map((model) => model.model_id))
  const modelIds = scope.modelIds.filter((id) => !own.has(id))
  return scope.instanceIds.includes(connection.instance_id)
    ? {
        ...scope,
        instanceIds: scope.instanceIds.filter(
          (id) => id !== connection.instance_id,
        ),
        modelIds,
      }
    : {
        ...scope,
        instanceIds: [...scope.instanceIds, connection.instance_id],
        modelIds,
      }
}

/**
 * Toggles one model. Unchecking a model of a whole connection turns the
 * connection into explicit picks of its other callable models, so models
 * opened there later are no longer included.
 */
export function toggleModel(
  scope: KeyScope,
  connection: ConnectionGroup,
  model: GatewayCatalogModel,
): KeyScope {
  if (scope.instanceIds.includes(connection.instance_id)) {
    const rest = connection.models
      .filter((item) => isCallable(item) && item.model_id !== model.model_id)
      .map((item) => item.model_id)
    return {
      ...scope,
      instanceIds: scope.instanceIds.filter(
        (id) => id !== connection.instance_id,
      ),
      modelIds: [...new Set([...scope.modelIds, ...rest])],
    }
  }
  return {
    ...scope,
    modelIds: scope.modelIds.includes(model.model_id)
      ? scope.modelIds.filter((id) => id !== model.model_id)
      : [...scope.modelIds, model.model_id],
  }
}

/**
 * The request fields for a scope. Ids of deleted models and connections are
 * dropped (the server rejects ids the tenant no longer owns); "all models"
 * sends empty lists.
 */
export function scopePayload(catalog: GatewayCatalog, scope: KeyScope) {
  if (scope.allModels)
    return {
      allow_all_models: true,
      allowed_instance_ids: [] as string[],
      allowed_model_ids: [] as string[],
    }
  const connections = new Set(
    catalog.connections.map((connection) => connection.instance_id),
  )
  const models = new Set(catalog.models.map((model) => model.model_id))
  return {
    allow_all_models: false,
    allowed_instance_ids: scope.instanceIds.filter((id) => connections.has(id)),
    allowed_model_ids: scope.modelIds.filter((id) => models.has(id)),
  }
}
