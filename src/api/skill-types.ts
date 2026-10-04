import { z } from 'zod'

const id = z.string().regex(/^[a-f0-9]{32}$/)
const integer = z.number().int().nonnegative()
const revision = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const times = { create_time: integer, update_time: integer }
const state = z.enum(['active', 'deleting', 'delete_failed', 'deleted'])
export const operationStateSchema = z.enum([
  'pending',
  'running',
  'succeeded',
  'partial',
  'failed',
])
export const indexStateSchema = z.enum([
  'unindexed',
  'indexing',
  'ready',
  'failed',
])
export const skillSpaceSchema = z.object({
  id,
  name: z.string(),
  description: z.string(),
  backend_owner: z.enum(['python', 'go']),
  state,
  revision,
  root_folder_id: id,
  active_generation_id: id.nullable(),
  ...times,
})
export const skillSchema = z.object({
  id,
  space_id: id,
  name: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  active_version_id: id.nullable(),
  state,
  revision,
  ...times,
})
export const skillVersionSchema = z.object({
  id,
  skill_id: id,
  version: z.string(),
  content_digest: z.string().regex(/^[a-f0-9]{64}$/),
  state: z.enum([
    'staging',
    'installed',
    'install_failed',
    'deleting',
    'delete_failed',
    'deleted',
  ]),
  index_state: indexStateSchema,
  file_count: integer,
  total_size: integer,
  ...times,
})
export const skillFileSchema = z.object({
  path: z.string(),
  size: integer,
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  media_type: z.string(),
})
const field = z.object({
  enabled: z.boolean(),
  weight: z.number().min(0).max(10),
})
export const skillConfigSchema = z.object({
  revision,
  embedding_model_id: z
    .string()
    .regex(/^[1-9][0-9]*$/)
    .nullable(),
  rerank_model_id: z
    .string()
    .regex(/^[1-9][0-9]*$/)
    .nullable(),
  top_k: z.number().int().min(1).max(100),
  vector_weight: z.number().min(0).max(1),
  similarity_threshold: z.number().min(0).max(1),
  fields: z.object({
    name: field,
    tags: field,
    description: field,
    content: field,
  }),
})
export const skillModelSchema = z.object({
  id: z.string().regex(/^[1-9][0-9]*$/),
  name: z.string(),
  provider: z.string(),
  type: z.enum(['embedding', 'rerank']),
  max_tokens: integer,
  available: z.boolean(),
  reason: z.string().nullable(),
})
export const skillCapabilitiesSchema = z.object({
  backend: z.enum(['python', 'go']),
  schema_version: z.literal(1),
  sources: z.array(z.literal('local')),
  search_modes: z.array(z.enum(['keyword', 'vector', 'hybrid'])),
  search_available: z.boolean(),
  storage_available: z.boolean(),
})
export const acceptedSkillOperationSchema = z.object({
  operation_id: id,
  state: operationStateSchema,
  resource_id: id.nullable(),
})
export const skillOperationSchema = z.object({
  id,
  kind: z.enum([
    'install',
    'activate',
    'reindex',
    'delete_version',
    'delete_skill',
    'delete_space',
    'delete_skills',
    'delete_spaces',
  ]),
  state: operationStateSchema,
  phase: z.enum(['staging', 'sealed', 'indexing', 'cleaning', 'done']),
  attempts: integer,
  resource_id: id.nullable(),
  progress: z.object({ completed: integer, total: integer }),
  result: z.object({
    items: z.array(
      z.object({
        id,
        state: operationStateSchema,
        error_code: z.string().optional(),
        retryable: z.boolean(),
      }),
    ),
    skill_id: id.optional(),
    version_id: id.optional(),
    index_state: indexStateSchema.optional(),
    skipped_binary_count: integer.optional(),
  }),
  error: z
    .object({
      error_code: z.string(),
      message: z.string(),
      retryable: z.boolean(),
    })
    .nullable(),
  ...times,
})
export const skillSearchModeSchema = z.enum(['keyword', 'vector', 'hybrid'])
export const skillSearchSchema = z.object({
  skills: z.array(
    z.object({
      skill_id: id,
      version_id: id,
      name: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      version: z.string(),
      score: z.number(),
    }),
  ),
  total: integer,
  total_relation: z.enum(['eq', 'gte']),
  mode: skillSearchModeSchema,
  generation_id: id.nullable(),
})
export const skillPageSchema = {
  total: integer,
  page: integer,
  page_size: integer,
}
export type SkillSpace = z.infer<typeof skillSpaceSchema>
export type Skill = z.infer<typeof skillSchema>
export type SkillVersion = z.infer<typeof skillVersionSchema>
export type SkillFile = z.infer<typeof skillFileSchema>
export type SkillConfig = z.infer<typeof skillConfigSchema>
export type SkillModel = z.infer<typeof skillModelSchema>
export type SkillOperation = z.infer<typeof skillOperationSchema>
export type AcceptedSkillOperation = z.infer<
  typeof acceptedSkillOperationSchema
>
export type SkillSearchMode = z.infer<typeof skillSearchModeSchema>
export type SkillListParams = {
  page?: number
  page_size?: number
  keywords?: string
  sort?: 'name' | 'create_time'
  desc?: boolean
}
export type SkillManifest = {
  name: string
  version: string
  activate: boolean
  files?: { path: string; sha256: string; size: number }[]
}
