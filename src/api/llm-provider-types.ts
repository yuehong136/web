import { z } from 'zod'

export const modelTypeSchema = z.enum([
  'chat',
  'embedding',
  'rerank',
  'image2text',
  'tts',
  'speech2text',
  'ocr',
])
export type ModelType = z.infer<typeof modelTypeSchema>
export const modelStatusSchema = z.enum(['active', 'inactive'])
const id = z.number().int().positive().safe()
const capabilities = z
  .array(modelTypeSchema)
  .nonempty()
  .refine((types) => new Set(types).size === types.length)
export const providerSchema = z
  .object({
    id: z.string().min(1).optional(),
    name: z.string().min(1),
    model_types: z.array(modelTypeSchema),
    status: modelStatusSchema,
  })
  .passthrough()
export const instanceSchema = z
  .object({
    id: z.string().min(1),
    provider_id: z.string().min(1),
    provider_name: z.string().min(1),
    instance_name: z.string().min(1),
    has_api_key: z.boolean(),
    base_url: z.string(),
    region: z.string(),
    status: modelStatusSchema,
  })
  .passthrough()
export const tenantModelSchema = z
  .object({
    id,
    name: z.string().min(1),
    provider_id: z.string().min(1),
    provider_name: z.string().min(1),
    instance_id: z.string().min(1),
    instance_name: z.string().min(1),
    model_types: capabilities,
    status: modelStatusSchema,
    effective_status: modelStatusSchema,
    max_tokens: z.number().int().nonnegative().safe(),
    is_tools: z.boolean(),
    reference: z.string().regex(/^[1-9]\d*$/),
  })
  .passthrough()
  .refine((model) => model.reference === String(model.id))
export const modelDefaultSchema = z
  .object({
    model_type: modelTypeSchema,
    model_id: id.nullable(),
    reference: z.string(),
    model_provider: z.string(),
    model_instance: z.string(),
    model_name: z.string(),
  })
  .passthrough()
export type ModelProvider = z.infer<typeof providerSchema>
export type ModelInstance = z.infer<typeof instanceSchema>
export type TenantModel = z.infer<typeof tenantModelSchema>
export type ModelDefault = z.infer<typeof modelDefaultSchema>
/** Discovery describes unregistered candidates, never callable tenant model IDs. */
export const discoveredModelSchema = z.object({
  model_name: z
    .string()
    .min(1)
    .refine((name) => name.trim() === name && !!name.trim()),
  display_name: z.string().min(1),
  model_types: capabilities,
  max_tokens: z.number().int().nonnegative().safe(),
  is_tools: z.boolean(),
  features: z.array(z.string()),
  source: z.enum(['static', 'remote']),
})
export type DiscoveredModel = z.infer<typeof discoveredModelSchema>
export interface ModelDiscoveryInput {
  api_key: string
  base_url: string
  region: string
}
export interface ModelDiscoveryPage {
  items: DiscoveredModel[]
  total: number
  page: number
  page_size: number
}
export interface ConnectionCandidate {
  api_key: string
  base_url: string
  region: string
  model_ids?: string[]
  custom_model?: InstanceModelInput
  custom_models?: InstanceModelInput[]
}
export interface InstanceInput extends ConnectionCandidate {
  instance_name: string
}
export interface InstanceUpdate {
  api_key?: string
  base_url?: string
  region?: string
  status?: 'active' | 'inactive'
  clear_api_key?: boolean
}
export interface InstanceModelInput {
  model_name: string
  model_types: ModelType[]
  max_tokens: number
  is_tools: boolean
}
