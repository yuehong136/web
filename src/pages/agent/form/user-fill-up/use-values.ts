import { useMemo } from 'react'
import { initialUserFillUpValues } from '../../constant'
import type { RAGFlowNodeType } from '../../types'
import { normalizeBeginInputsForEditor } from '../begin/utils'

export function useValues(node?: RAGFlowNodeType) {
  return useMemo(() => {
    const formData = (node?.data?.form || {}) as Record<string, unknown>

    if (Object.keys(formData).length === 0) {
      return {
        ...initialUserFillUpValues,
        inputs: normalizeBeginInputsForEditor(initialUserFillUpValues.inputs),
      }
    }

    return {
      ...initialUserFillUpValues,
      ...formData,
      inputs: normalizeBeginInputsForEditor(formData.inputs),
    }
  }, [node?.data?.form])
}
