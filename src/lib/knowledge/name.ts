import type { TFunction } from 'i18next'

export const KNOWLEDGE_NAME_MAX_BYTES = 128

/** MultiRAG trims names and limits creation to 128 UTF-8 bytes. */
export function getKnowledgeNameError(
  name: string,
): 'required' | 'tooLong' | null {
  const trimmed = name.trim()
  if (!trimmed) return 'required'
  return new TextEncoder().encode(trimmed).length > KNOWLEDGE_NAME_MAX_BYTES
    ? 'tooLong'
    : null
}

export function validateKnowledgeName(
  name: string,
  t: TFunction,
): string | null {
  const error = getKnowledgeNameError(name)
  return error
    ? t(`knowledge.nameValidation.${error}`, {
        count: KNOWLEDGE_NAME_MAX_BYTES,
      })
    : null
}
