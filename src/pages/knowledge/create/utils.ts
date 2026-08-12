import type { TFunction } from 'i18next'
import { MAX_NAME_LENGTH, NAME_PATTERN } from './constants'

export const validateKnowledgeName = (
  name: string,
  t: TFunction,
): string | null => {
  const trimmed = name.trim()

  if (!trimmed) {
    return t('knowledge.create.validation.nameRequired')
  }

  if (!NAME_PATTERN.test(trimmed)) {
    return t('knowledge.create.validation.namePattern')
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return t('knowledge.create.validation.nameMaxLength', {
      count: MAX_NAME_LENGTH,
    })
  }

  return null
}

const getBackendMessage = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  const response = 'response' in error ? error.response : undefined
  if (!response || typeof response !== 'object') {
    return undefined
  }

  const data = 'data' in response ? response.data : undefined
  if (!data || typeof data !== 'object') {
    return undefined
  }

  const retmsg = 'retmsg' in data ? data.retmsg : undefined
  return typeof retmsg === 'string' ? retmsg : undefined
}

export const getCreateKnowledgeErrorMessage = (
  error: unknown,
  t: TFunction,
): string => {
  const backendMessage = getBackendMessage(error)

  if (!backendMessage) {
    return t('knowledge.create.errors.generic')
  }

  if (backendMessage.includes('Dataset name must be string')) {
    return t('knowledge.create.errors.nameType')
  }

  if (backendMessage.includes("Dataset name can't be empty")) {
    return t('knowledge.create.validation.nameRequired')
  }

  if (backendMessage.includes('Dataset name length is')) {
    return t('knowledge.create.errors.nameTooLong')
  }

  if (backendMessage.includes('Dataset name must start with a letter')) {
    return t('knowledge.create.validation.namePattern')
  }

  if (
    backendMessage.includes('\u5df2\u5b58\u5728\u8be5\u77e5\u8bc6\u5e93\u540d')
  ) {
    return t('knowledge.create.errors.nameExists')
  }

  if (backendMessage.includes('Tenant not found')) {
    return t('knowledge.create.errors.tenantMissing')
  }

  if (backendMessage.includes('null value in column "parser_id"')) {
    return t('knowledge.create.errors.parserMissing')
  }

  if (backendMessage.includes('IntegrityError')) {
    return t('knowledge.create.errors.integrity')
  }

  return t('knowledge.create.errors.generic')
}
