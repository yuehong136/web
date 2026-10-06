import type { MetadataCondition } from '@/types/api'
import type {
  MetadataFilterMode,
  MetadataSemiAutoField,
} from '@/components/chat/MetadataFilter'
import type { RetrievalMetaDataFilter } from '../types'

interface MetadataFilterInput {
  metadataMode: MetadataFilterMode
  metadataCondition: MetadataCondition
  metadataSemiAutoFields: MetadataSemiAutoField[]
}

export function toRetrievalOperator(operator: string): string {
  const aliases: Record<string, string> = {
    is: '=',
    'not is': '≠',
    '!=': '≠',
    '>=': '≥',
    '<=': '≤',
  }
  return aliases[operator] ?? operator
}

const supportedOperators = new Set([
  '=',
  '≠',
  '>',
  '<',
  '≥',
  '≤',
  'contains',
  'not contains',
  'start with',
  'end with',
  'empty',
  'not empty',
])
const needsValue = (op: string) => op !== 'empty' && op !== 'not empty'

export function getMetadataFilterIssue({
  metadataMode,
  metadataCondition,
  metadataSemiAutoFields,
}: MetadataFilterInput):
  | 'manualRequired'
  | 'incompleteManual'
  | 'semiAutoRequired'
  | 'unsupportedOperator'
  | undefined {
  if (metadataMode === 'manual') {
    const conditions = metadataCondition.conditions ?? []
    if (!conditions.length) return 'manualRequired'
    for (const condition of conditions) {
      const op = toRetrievalOperator(condition.comparison_operator || 'is')
      if (!supportedOperators.has(op)) return 'unsupportedOperator'
      if (
        !condition.name?.trim() ||
        (needsValue(op) && !String(condition.value ?? '').trim())
      )
        return 'incompleteManual'
    }
  }
  if (metadataMode === 'semi_auto') {
    if (
      !metadataSemiAutoFields.length ||
      metadataSemiAutoFields.some((field) => !field.key.trim())
    )
      return 'semiAutoRequired'
    if (
      metadataSemiAutoFields.some(
        (field) =>
          field.op && !supportedOperators.has(toRetrievalOperator(field.op)),
      )
    )
      return 'unsupportedOperator'
  }
  return undefined
}

export function createActiveMetaDataFilter(
  options: MetadataFilterInput,
): RetrievalMetaDataFilter | undefined {
  const { metadataMode, metadataCondition, metadataSemiAutoFields } = options
  if (metadataMode === 'disabled') return undefined
  // An enabled but incomplete filter must not silently become an unfiltered query.
  const issue = getMetadataFilterIssue(options)
  if (issue) throw new Error(issue)
  if (metadataMode === 'auto') return { method: 'auto' }
  if (metadataMode === 'semi_auto') {
    return {
      method: 'semi_auto',
      semi_auto: metadataSemiAutoFields.map(({ key, op }) =>
        op ? { key: key.trim(), op: toRetrievalOperator(op) } : key.trim(),
      ),
    }
  }
  return {
    method: 'manual',
    logic: metadataCondition.logic || 'and',
    manual: (metadataCondition.conditions ?? []).map((condition) => ({
      key: condition.name.trim(),
      op: toRetrievalOperator(condition.comparison_operator || 'is'),
      value: needsValue(condition.comparison_operator)
        ? String(condition.value ?? '').trim()
        : '',
    })),
  }
}
