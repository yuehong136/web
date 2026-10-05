import type { TFunction } from 'i18next'

export { validateKnowledgeName } from '@/lib/knowledge/name'

export const getCreateKnowledgeErrorMessage = (
  _error: unknown,
  t: TFunction,
): string => t('knowledge.create.errors.generic')
