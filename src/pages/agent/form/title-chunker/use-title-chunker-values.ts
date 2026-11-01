import { useMemo } from 'react'
import { useFormBinding } from '@/pages/agent/hooks/use-form-binding'
import type { RAGFlowNodeType } from '@/pages/agent/types'
import { normalizeTitleChunkerFormForStore } from '@/pages/agent/form/title-chunker/utils'

export function useTitleChunkerValues(node?: RAGFlowNodeType) {
  const binding = useFormBinding()
  const formData = binding?.formData ?? node?.data?.form

  // Normalize the original arrays before defaults can merge into their indices.
  return useMemo(() => normalizeTitleChunkerFormForStore(formData), [formData])
}
