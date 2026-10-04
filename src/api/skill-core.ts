import { z } from 'zod'
import { apiClient, APIError } from './client'
import { API_BASE_URL } from '@/constants'
import { skillModelSchema } from './skill-types'
import {
  coreSpaceSchema,
  coreConfigSchema,
  coreSearchSchema,
  coreFileSchema,
  coreFileListSchema,
  type CoreConfig,
  type CoreFileEntry,
} from './skill-core-types'

const root = '/v1/skill-core'
const baseURL = `${API_BASE_URL}/api`
const envelope = z.object({
  code: z.number(),
  data: z.unknown(),
  message: z.string().optional(),
})
const invalid = (status: number) =>
  new APIError(status, 'INVALID_SKILL_RESPONSE', 'Invalid core response')

/** Upstream business errors may use HTTP 200. Never reinterpret them as data. */
export function coreResponse<T>(schema: z.ZodType<T>, status = 200) {
  return async (response: Response): Promise<T> => {
    const body = envelope.safeParse(await response.json().catch(() => null))
    if (!body.success) throw invalid(response.status)
    if (!response.ok || body.data.code !== 0) {
      const detail = z
        .object({ error_code: z.string() })
        .safeParse(body.data.data)
      throw new APIError(
        response.status,
        detail.success ? detail.data.error_code : 'CORE_REQUEST_FAILED',
        'Core request failed',
      )
    }
    if (response.status !== status) throw invalid(response.status)
    const parsed = schema.safeParse(body.data.data)
    if (!parsed.success) throw invalid(response.status)
    return parsed.data
  }
}
const config = <T>(schema: z.ZodType<T>, signal?: AbortSignal) => ({
  baseURL,
  signal,
  readResponse: coreResponse(schema),
})
const spacePath = (id: string) => `${root}/spaces/${encodeURIComponent(id)}`
export type CoreIndexSkill = {
  id: string
  folder_id: string
  name: string
  description: string
  tags: string[]
  content: string
  version?: string
}

export const skillCoreAPI = {
  protocols: (signal?: AbortSignal) =>
    apiClient.get(
      '/v1/skill-protocols',
      config(
        z.object({
          default_protocol: z.enum(['multirag-assets-v1', 'ragflow-skills-v1']),
          backend: z.enum(['python', 'go']),
          protocols: z.array(
            z.object({
              protocol: z.enum(['multirag-assets-v1', 'ragflow-skills-v1']),
              base_path: z.string(),
              writable: z.boolean(),
              capabilities: z.object({
                rerank: z.boolean(),
                operations: z.boolean(),
                writable: z.boolean(),
              }),
            }),
          ),
        }),
        signal,
      ),
    ) as Promise<{
      default_protocol: string
      backend: string
      protocols: {
        protocol: string
        base_path: string
        writable: boolean
        capabilities: {
          rerank: boolean
          operations: boolean
          writable: boolean
        }
      }[]
    }>,
  models: (signal?: AbortSignal) =>
    apiClient.get(
      `${root}/models`,
      config(z.object({ models: z.array(skillModelSchema) }), signal),
    ) as Promise<{ models: z.infer<typeof skillModelSchema>[] }>,
  spaces: (signal?: AbortSignal) =>
    apiClient.get(
      `${root}/spaces`,
      config(
        z.object({ spaces: z.array(coreSpaceSchema), total: z.number() }),
        signal,
      ),
    ) as Promise<{ spaces: z.infer<typeof coreSpaceSchema>[]; total: number }>,
  space: (id: string, signal?: AbortSignal) =>
    apiClient.get(spacePath(id), config(coreSpaceSchema, signal)) as Promise<
      z.infer<typeof coreSpaceSchema>
    >,
  createSpace: (data: { name: string; description: string }) =>
    apiClient.post(`${root}/spaces`, data, config(coreSpaceSchema)) as Promise<
      z.infer<typeof coreSpaceSchema>
    >,
  updateSpace: (
    id: string,
    data: {
      name?: string
      description?: string
      embd_id?: string
      rerank_id?: string
      top_k?: number
    },
  ) =>
    apiClient.put(spacePath(id), data, config(coreSpaceSchema)) as Promise<
      z.infer<typeof coreSpaceSchema>
    >,
  deleteSpace: (id: string) =>
    apiClient.delete(spacePath(id), {
      baseURL,
      readResponse: coreResponse(
        z.object({ deleting: z.literal(true), space_id: z.string() }),
        202,
      ),
    }) as Promise<{ deleting: true; space_id: string }>,
  byFolder: (id: string, signal?: AbortSignal) =>
    apiClient.get(`${root}/space/by-folder`, {
      ...config(coreSpaceSchema, signal),
      params: { folder_id: id },
    }) as Promise<z.infer<typeof coreSpaceSchema>>,
  config: (space: string, signal?: AbortSignal) =>
    apiClient.get(`${root}/config`, {
      ...config(coreConfigSchema, signal),
      params: { space_id: space },
    }) as Promise<CoreConfig>,
  updateConfig: (space: string, data: CoreConfig) =>
    apiClient.post(
      `${root}/config`,
      {
        space_id: space,
        embd_id: data.embd_id,
        rerank_id: data.rerank_id ?? '',
        top_k: data.top_k,
        field_config: data.field_config,
        vector_similarity_weight: data.vector_similarity_weight,
        similarity_threshold: data.similarity_threshold,
      },
      config(coreConfigSchema),
    ) as Promise<CoreConfig>,
  search: (space: string, query: string, page: number, signal?: AbortSignal) =>
    apiClient.post(
      `${root}/search`,
      {
        space_id: space,
        query,
        page,
        page_size: 20,
        sort_by: 'name',
        sort_order: 'asc',
      },
      config(coreSearchSchema, signal),
    ) as Promise<z.infer<typeof coreSearchSchema>>,
  index: (space: string, skills: CoreIndexSkill[]) =>
    apiClient.post(
      `${root}/index`,
      { space_id: space, skills },
      { ...config(z.object({ indexed_count: z.number() })), timeout: 120000 },
    ) as Promise<{ indexed_count: number }>,
  deleteIndex: (space: string, skill: string) =>
    apiClient.delete(`${root}/index`, {
      ...config(z.literal(true)),
      params: { space_id: space, skill_id: skill },
    }) as Promise<true>,
  reindex: (space: string, embd_id?: string) =>
    apiClient.post(
      `${root}/reindex`,
      { space_id: space, ...(embd_id ? { embd_id } : {}) },
      {
        ...config(
          z.object({
            indexed_count: z.number(),
            total_skills: z.number(),
            version: z.string(),
            failed_count: z.number(),
          }),
        ),
        timeout: 120000,
      },
    ) as Promise<{
      indexed_count: number
      total_skills: number
      version: string
      failed_count: number
    }>,
  files: (parent: string, page = 1, signal?: AbortSignal) =>
    apiClient.get('/v1/files', {
      ...config(coreFileListSchema, signal),
      params: {
        parent_id: parent,
        page,
        page_size: 100,
        orderby: 'name',
        desc: false,
      },
    }) as Promise<z.infer<typeof coreFileListSchema>>,
  folder: (parent: string, name: string) =>
    apiClient.post(
      '/v1/files',
      { parent_id: parent, name, type: 'folder' },
      config(coreFileSchema),
    ) as Promise<z.infer<typeof coreFileSchema>>,
  upload: (parent: string, file: File) =>
    apiClient.uploadRepeated(
      '/v1/files',
      'file',
      [file],
      { parent_id: parent },
      config(z.array(coreFileSchema)),
    ) as Promise<z.infer<typeof coreFileSchema>[]>,
  removeFiles: (ids: string[]) =>
    apiClient.delete('/v1/files', {
      ...config(
        z.union([
          z.literal(true),
          z.object({ success_count: z.number(), errors: z.array(z.unknown()) }),
        ]),
      ),
      data: { ids },
    }) as Promise<true | { success_count: number; errors: unknown[] }>,
  file: (id: string, signal?: AbortSignal) =>
    apiClient.get('/v1/files/' + encodeURIComponent(id), {
      baseURL,
      signal,
      readResponse: async (response: Response) => {
        // JSON file downloads carry Content-Disposition; JSON business errors do not.
        if (
          !response.ok ||
          (!response.headers.has('content-disposition') &&
            response.headers.get('content-type')?.includes('application/json'))
        )
          return coreResponse(z.never())(response)
        if (response.status !== 200) throw invalid(response.status)
        return response.blob()
      },
    }) as Promise<Blob>,
}

export async function allCoreFiles(parent: string, signal?: AbortSignal) {
  const files = [] as z.infer<typeof coreFileSchema>[]
  for (let page = 1; ; page++) {
    const result = await skillCoreAPI.files(parent, page, signal)
    files.push(...result.files)
    if (files.length >= result.total) return files
    if (!result.files.length) throw invalid(200)
  }
}

export async function coreFileTree(
  parent: string,
  signal?: AbortSignal,
  prefix = '',
  seen = new Set<string>(),
): Promise<CoreFileEntry[]> {
  if (seen.has(parent) || seen.size > 1000) throw invalid(200)
  seen.add(parent)
  const entries: CoreFileEntry[] = []
  for (const file of await allCoreFiles(parent, signal)) {
    const path = `${prefix}${file.name}`
    if (file.type === 'folder')
      entries.push(...(await coreFileTree(file.id, signal, `${path}/`, seen)))
    else entries.push({ ...file, path })
  }
  return entries
}
