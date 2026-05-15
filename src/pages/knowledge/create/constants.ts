import type { CreateKnowledgeFormValues } from './types'

export const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/
export const MAX_NAME_LENGTH = 100

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
