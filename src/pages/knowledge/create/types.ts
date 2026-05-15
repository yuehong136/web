export type KnowledgePermission = 'me' | 'team'

export interface CreateKnowledgeFormValues {
  name: string
  description: string
  language: string
  permission: KnowledgePermission
  embd_id: string
}
