import { z } from 'zod'
import { apiClient } from './client'
import { API_BASE_URL } from '@/constants'
import { skillResponse, skillBinaryResponse } from './skill-response'
import {
  acceptedSkillOperationSchema,
  skillCapabilitiesSchema,
  skillConfigSchema,
  skillFileSchema,
  skillModelSchema,
  skillOperationSchema,
  skillPageSchema,
  skillSchema,
  skillSearchSchema,
  skillSpaceSchema,
  skillVersionSchema,
  type SkillConfig,
  type SkillListParams,
  type SkillManifest,
  type SkillSearchMode,
} from './skill-types'

const baseURL = `${API_BASE_URL}/api`
const root = '/v1/skill-assets'
const path = (id: string) => `${root}/spaces/${encodeURIComponent(id)}`
const jsonConfig = <T>(schema: z.ZodType<T>, signal?: AbortSignal) => ({
  baseURL,
  readResponse: skillResponse(schema),
  signal,
})
const mutationConfig = (key: string) => ({
  baseURL,
  headers: { 'Idempotency-Key': key },
  readResponse: skillResponse(acceptedSkillOperationSchema, 202),
})

export const skillsAPI = {
  capabilities: (signal?: AbortSignal) =>
    apiClient.get(
      `${root}/capabilities`,
      jsonConfig(skillCapabilitiesSchema, signal),
    ) as Promise<z.infer<typeof skillCapabilitiesSchema>>,
  models: (signal?: AbortSignal) =>
    apiClient.get(
      `${root}/models`,
      jsonConfig(z.object({ models: z.array(skillModelSchema) }), signal),
    ) as Promise<{ models: z.infer<typeof skillModelSchema>[] }>,
  spaces: (params: SkillListParams, signal?: AbortSignal) =>
    apiClient.get(`${root}/spaces`, {
      ...jsonConfig(
        z.object({ spaces: z.array(skillSpaceSchema), ...skillPageSchema }),
        signal,
      ),
      params,
    }) as Promise<{
      spaces: z.infer<typeof skillSpaceSchema>[]
      total: number
      page: number
      page_size: number
    }>,
  space: (id: string, signal?: AbortSignal) =>
    apiClient.get(
      `${path(id)}`,
      jsonConfig(skillSpaceSchema, signal),
    ) as Promise<z.infer<typeof skillSpaceSchema>>,
  createSpace: (data: { name: string; description: string }) =>
    apiClient.post(
      `${root}/spaces`,
      data,
      jsonConfig(skillSpaceSchema),
    ) as Promise<z.infer<typeof skillSpaceSchema>>,
  updateSpace: (
    id: string,
    data: { name: string; description: string; revision: number },
  ) =>
    apiClient.patch(path(id), data, jsonConfig(skillSpaceSchema)) as Promise<
      z.infer<typeof skillSpaceSchema>
    >,
  deleteSpaces: (ids: string[], key: string) =>
    apiClient.post(
      `${root}/spaces/delete`,
      { ids },
      mutationConfig(key),
    ) as Promise<z.infer<typeof acceptedSkillOperationSchema>>,
  skills: (space: string, params: SkillListParams, signal?: AbortSignal) =>
    apiClient.get(`${path(space)}/skills`, {
      ...jsonConfig(
        z.object({ skills: z.array(skillSchema), ...skillPageSchema }),
        signal,
      ),
      params,
    }) as Promise<{
      skills: z.infer<typeof skillSchema>[]
      total: number
      page: number
      page_size: number
    }>,
  skill: (space: string, skill: string, signal?: AbortSignal) =>
    apiClient.get(
      `${path(space)}/skills/${encodeURIComponent(skill)}`,
      jsonConfig(
        z.object({ skill: skillSchema, versions: z.array(skillVersionSchema) }),
        signal,
      ),
    ) as Promise<{
      skill: z.infer<typeof skillSchema>
      versions: z.infer<typeof skillVersionSchema>[]
    }>,
  install: (
    space: string,
    manifest: SkillManifest,
    files: File[],
    archive: boolean,
    key: string,
  ) =>
    apiClient.uploadRepeated(
      `${path(space)}/versions`,
      archive ? 'archive' : 'file',
      files,
      { manifest: JSON.stringify(manifest) },
      { ...mutationConfig(key), timeout: 120_000 },
    ) as Promise<z.infer<typeof acceptedSkillOperationSchema>>,
  activate: (
    space: string,
    skill: string,
    version_id: string | null,
    revision: number,
    key: string,
  ) =>
    apiClient.put(
      `${path(space)}/skills/${encodeURIComponent(skill)}/active-version`,
      { version_id, revision },
      mutationConfig(key),
    ) as Promise<z.infer<typeof acceptedSkillOperationSchema>>,
  uninstall: (space: string, ids: string[], key: string) =>
    apiClient.post(
      `${path(space)}/skills/delete`,
      { ids },
      mutationConfig(key),
    ) as Promise<z.infer<typeof acceptedSkillOperationSchema>>,
  deleteVersion: (space: string, version: string, key: string) =>
    apiClient.delete(
      `${path(space)}/versions/${encodeURIComponent(version)}`,
      mutationConfig(key),
    ) as Promise<z.infer<typeof acceptedSkillOperationSchema>>,
  files: (space: string, version: string, signal?: AbortSignal) =>
    apiClient.get(
      `${path(space)}/versions/${encodeURIComponent(version)}/files`,
      jsonConfig(z.object({ files: z.array(skillFileSchema) }), signal),
    ) as Promise<{ files: z.infer<typeof skillFileSchema>[] }>,
  file: (space: string, version: string, file: string, signal?: AbortSignal) =>
    apiClient.get<Blob>(
      `${path(space)}/versions/${encodeURIComponent(version)}/file`,
      {
        baseURL,
        params: { path: file },
        signal,
        readResponse: skillBinaryResponse,
      },
    ),
  download: (space: string, version: string) =>
    apiClient.get<Blob>(
      `${path(space)}/versions/${encodeURIComponent(version)}/download`,
      { baseURL, readResponse: skillBinaryResponse },
    ),
  config: (space: string, signal?: AbortSignal) =>
    apiClient.get(
      `${path(space)}/config`,
      jsonConfig(skillConfigSchema, signal),
    ) as Promise<SkillConfig>,
  updateConfig: (space: string, config: SkillConfig) =>
    apiClient.patch(
      `${path(space)}/config`,
      config,
      jsonConfig(
        z.object({ config: skillConfigSchema, requires_reindex: z.boolean() }),
      ),
    ) as Promise<{ config: SkillConfig; requires_reindex: boolean }>,
  reindex: (space: string, key: string) =>
    apiClient.post(
      `${path(space)}/reindex`,
      {},
      mutationConfig(key),
    ) as Promise<z.infer<typeof acceptedSkillOperationSchema>>,
  search: (
    space: string,
    query: string,
    mode: SkillSearchMode,
    page: number,
    signal?: AbortSignal,
  ) =>
    apiClient.post(
      `${path(space)}/search`,
      { query, mode, page, page_size: 20 },
      jsonConfig(skillSearchSchema, signal),
    ) as Promise<z.infer<typeof skillSearchSchema>>,
  operation: (id: string, signal?: AbortSignal) =>
    apiClient.get(
      `${root}/operations/${encodeURIComponent(id)}`,
      jsonConfig(skillOperationSchema, signal),
    ) as Promise<z.infer<typeof skillOperationSchema>>,
  retry: (id: string, key: string) =>
    apiClient.post(
      `${root}/operations/${encodeURIComponent(id)}/retry`,
      {},
      mutationConfig(key),
    ) as Promise<z.infer<typeof acceptedSkillOperationSchema>>,
}
