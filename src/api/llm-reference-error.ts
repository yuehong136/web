import { z } from 'zod'
import { APIError } from './client'

const referenceSchema = z.object({
  resource_type: z.enum([
    'Tenant',
    'Knowledgebase',
    'Document',
    'Dialog',
    'Memory',
    'UserCanvas',
    'UserCanvasVersion',
    'Search',
    'SkillSearchConfig',
    'PythonSkillCoreConfig',
    'API4Conversation',
    'ChannelCanvasCandidate',
    'PipelineOperationLog',
    'SharedResource',
  ]),
  resource_id: z.string().nullable(),
  resource_name: z.string().nullable(),
  model_names: z.array(z.string().min(1)).min(1),
  is_deleted: z.boolean(),
})

export function modelDeletionReferences(error: unknown) {
  if (
    !(error instanceof APIError) ||
    error.status !== 409 ||
    error.code !== 'MODEL_REFERENCED'
  )
    return null
  const parsed = z
    .object({ references: z.array(referenceSchema).min(1) })
    .safeParse(error.details)
  return parsed.success ? parsed.data.references : null
}
