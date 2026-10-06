import type { CreateKnowledgeFormValues } from './types'

export const DEFAULT_CREATE_FORM_VALUES: CreateKnowledgeFormValues = {
  name: '',
  description: '',
  language: 'Chinese',
  permission: 'me',
  embd_id: '',
}

export const LANGUAGE_OPTIONS = [
  'Chinese',
  'English',
  'Japanese',
  'Korean',
] as const
export const PERMISSION_OPTIONS = ['me', 'team'] as const
