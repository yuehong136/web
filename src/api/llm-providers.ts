import { z } from 'zod'
import { API_BASE_URL } from '@/constants'
import { apiClient, APIError } from './client'
import {
  providerSchema,
  modelTypeSchema,
  instanceSchema,
  tenantModelSchema,
  modelDefaultSchema,
  discoveredModelSchema,
  type ModelType,
  type InstanceInput,
  type ConnectionCandidate,
  type InstanceUpdate,
  type InstanceModelInput,
  type ModelDiscoveryInput,
  type ModelDiscoveryPage,
} from './llm-provider-types'

const providerPath = (name: string) =>
  `/v1/providers/${encodeURIComponent(name)}`
const instancePath = (provider: string, instance: string) =>
  `${providerPath(provider)}/instances/${encodeURIComponent(instance)}`
function invalid(): never {
  throw new APIError(
    502,
    'INVALID_MODEL_INVENTORY',
    'The model inventory is incomplete or invalid',
  )
}

/** A partial page must never become an authoritative model or credential inventory. */
function createInventory(rest: { baseURL: string }) {
  return async function inventory<T>(
    path: string,
    schema: z.ZodType<T>,
    identity: (row: T) => string,
    params: Record<string, unknown> = {},
    signal?: AbortSignal,
  ): Promise<T[]> {
    const isOwner = apiClient.captureOwner()
    const items: T[] = [],
      seen = new Set<string>()
    let total: number | undefined
    for (let page = 1; ; page++) {
      if (!isOwner() || signal?.aborted)
        throw new DOMException('Request superseded', 'AbortError')
      const response: unknown = await apiClient.get(path, {
        ...rest,
        signal,
        params: { ...params, page, page_size: 100 },
      })
      if (!isOwner() || signal?.aborted)
        throw new DOMException('Request superseded', 'AbortError')
      const decoded = z
        .object({
          items: z.array(schema).max(100),
          total: z.number().int().nonnegative().safe(),
          page: z.literal(page),
          page_size: z.literal(100),
        })
        .safeParse(response)
      if (!decoded.success) invalid()
      const data = decoded.data
      if (total !== undefined && data.total !== total) invalid()
      total = data.total
      for (const row of data.items) {
        const key = identity(row)
        if (seen.has(key)) invalid()
        seen.add(key)
        items.push(row)
      }
      if (items.length > total || (!data.items.length && items.length < total))
        invalid()
      if (items.length === total) return items
      if (data.items.length !== 100) invalid()
    }
  }
}

export function createModelProvidersAPI(origin = API_BASE_URL) {
  const rest = { baseURL: `${origin}/api` }
  const inventory = createInventory(rest)
  return {
    discoverModels: async (
      provider: string,
      input: ModelDiscoveryInput,
      page = 1,
      signal?: AbortSignal,
    ): Promise<ModelDiscoveryPage> => {
      const isOwner = apiClient.captureOwner()
      if (!Number.isSafeInteger(page) || page < 1) invalid()
      const response: unknown = await apiClient.post(
        `${providerPath(provider)}/models/discovery`,
        input,
        { ...rest, signal, params: { page, page_size: 100 } },
      )
      if (!isOwner() || signal?.aborted)
        throw new DOMException('Request superseded', 'AbortError')
      const parsed = z
        .object({
          items: z.array(discoveredModelSchema).max(100),
          total: z.number().int().nonnegative().safe(),
          page: z.literal(page),
          page_size: z.literal(100),
        })
        .safeParse(response)
      if (!parsed.success) invalid()
      const data = parsed.data
      const names = data.items.map((item) => item.model_name)
      if (
        new Set(names).size !== names.length ||
        data.items.length > Math.max(0, data.total - (page - 1) * 100) ||
        data.items.length !==
          Math.min(100, Math.max(0, data.total - (page - 1) * 100))
      )
        invalid()
      return data
    },
    providers: (available = false, signal?: AbortSignal) =>
      inventory(
        '/v1/providers',
        providerSchema,
        (row) => row.name,
        { available },
        signal,
      ),
    createProvider: (name: string) =>
      apiClient.put('/v1/providers', { provider_name: name }, rest),
    deleteProvider: (name: string) =>
      apiClient.delete(providerPath(name), rest),
    instances: (provider: string, signal?: AbortSignal) =>
      inventory(
        `${providerPath(provider)}/instances`,
        instanceSchema,
        (row) => row.id,
        {},
        signal,
      ),
    verifyConnection: async (
      provider: string,
      candidate: ConnectionCandidate,
      signal?: AbortSignal,
    ) => {
      const response: unknown = await apiClient.post(
        `${providerPath(provider)}/connection`,
        candidate,
        { ...rest, signal },
      )
      const decoded = z
        .object({
          verified: z.literal(true),
          model_name: z.string().min(1),
          model_type: modelTypeSchema,
        })
        .safeParse(response)
      if (!decoded.success) invalid()
      return decoded.data
    },
    createInstance: (
      provider: string,
      input: InstanceInput,
      signal?: AbortSignal,
    ) =>
      apiClient.post(`${providerPath(provider)}/instances`, input, {
        ...rest,
        signal,
      }),
    updateInstance: (
      provider: string,
      instance: string,
      input: InstanceUpdate,
    ) => apiClient.patch(instancePath(provider, instance), input, rest),
    deleteInstance: (provider: string, instance: string) =>
      apiClient.delete(instancePath(provider, instance), rest),
    models: (signal?: AbortSignal) =>
      inventory(
        '/v1/models',
        tenantModelSchema,
        (row) => String(row.id),
        {},
        signal,
      ),
    addModel: (provider: string, instance: string, input: InstanceModelInput) =>
      apiClient.post(`${instancePath(provider, instance)}/models`, input, rest),
    setModelStatus: (
      provider: string,
      instance: string,
      id: number,
      active: boolean,
    ) =>
      apiClient.patch(
        `${instancePath(provider, instance)}/models/${id}`,
        { status: active ? 'active' : 'inactive' },
        rest,
      ),
    deleteModel: (provider: string, instance: string, id: number) =>
      apiClient.delete(
        `${instancePath(provider, instance)}/models/${id}`,
        rest,
      ),
    defaults: async (signal?: AbortSignal) => {
      const response: unknown = await apiClient.get('/v1/models/default', {
        ...rest,
        signal,
      })
      const decoded = z
        .object({ models: z.array(modelDefaultSchema) })
        .safeParse(response)
      if (!decoded.success) invalid()
      const types = decoded.data.models.map((row) => row.model_type)
      if (new Set(types).size !== types.length) invalid()
      return decoded.data.models
    },
    setDefault: (type: ModelType, modelId: number | null) =>
      apiClient.patch(
        '/v1/models/default',
        { model_type: type, model_id: modelId },
        rest,
      ),
  }
}

export const modelProvidersAPI = createModelProvidersAPI()
