import { z } from 'zod'

const id = z.string().min(1)
export const coreSpaceSchema = z.object({
  id,
  tenant_id: id,
  name: z.string(),
  folder_id: id,
  description: z.string().optional(),
  embd_id: z.string().optional(),
  rerank_id: z.string().optional(),
  top_k: z.number(),
  status: z.enum(['active', 'deleting', 'deleted']),
  delete_error: z
    .object({ error_code: z.string(), retryable: z.boolean() })
    .optional(),
  create_time: z.number().optional(),
  update_time: z.string().optional(),
})
export const coreFileSchema = z.object({
  id,
  name: z.string(),
  type: z.string(),
  size: z.number().optional(),
  parent_id: z.string().optional(),
})
export const coreFileListSchema = z.object({
  files: z.array(coreFileSchema),
  total: z.number().int().nonnegative(),
  parent_folder: coreFileSchema,
})
const field = z.object({ enabled: z.boolean(), weight: z.number() })
export const coreConfigSchema = z.object({
  // GET may return the upstream unsaved default configuration with an empty ID.
  id: z.string(),
  tenant_id: id,
  space_id: id,
  embd_id: z.string(),
  vector_similarity_weight: z.number(),
  similarity_threshold: z.number(),
  field_config: z.object({
    name: field,
    tags: field,
    description: field,
    content: field,
  }),
  rerank_id: z.string().nullish(),
  tenant_rerank_id: z.string().nullish(),
  top_k: z.number(),
  index_version: z.string(),
  status: z.string(),
})
export const coreSearchSchema = z.object({
  skills: z.array(
    z.object({
      skill_id: id,
      folder_id: id,
      name: z.string(),
      description: z.string(),
      tags: z.array(z.string()).nullable(),
      score: z.number(),
      version: z.string().optional(),
      index_version: z.string().optional(),
      bm25_score: z.number().optional(),
      vector_score: z.number().optional(),
    }),
  ),
  total: z.number().int().nonnegative(),
  query: z.string(),
  search_type: z.string(),
})
export type CoreSpace = z.infer<typeof coreSpaceSchema>
export type CoreFile = z.infer<typeof coreFileSchema>
export type CoreConfig = z.infer<typeof coreConfigSchema>
export type CoreSearch = z.infer<typeof coreSearchSchema>
export type CoreFileEntry = CoreFile & { path: string }

/** Core folders have no published-version IDs or active pointer. */
export function coreVersions(files: CoreFile[]): CoreFile[] {
  return files
    .filter(
      (file) => file.type === 'folder' && /^\d+\.\d+\.\d+$/.test(file.name),
    )
    .sort((a, b) => {
      const left = a.name.split('.').map(BigInt),
        right = b.name.split('.').map(BigInt)
      for (let i = 0; i < 3; i++) {
        if (left[i] !== right[i]) return left[i] > right[i] ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
}
