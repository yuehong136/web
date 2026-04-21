import { useMemo } from 'react'
import { initialBeginValues } from '../../constant'
import type { RAGFlowNodeType } from '../../types'
import { normalizeBeginInputsForEditor } from './utils'

export function useValues(node?: RAGFlowNodeType) {
  return useMemo(() => {
    const formData = (node?.data?.form || {}) as Record<string, unknown>

    if (Object.keys(formData).length === 0) {
      return {
        ...initialBeginValues,
        inputs: normalizeBeginInputsForEditor(initialBeginValues.inputs),
      }
    }

    return {
      ...initialBeginValues,
      ...formData,
      inputs: normalizeBeginInputsForEditor(formData.inputs),
    }
  }, [node?.data?.form])
}
