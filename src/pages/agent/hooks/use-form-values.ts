import { isEmpty } from 'lodash'
import { useMemo } from 'react'
import type { RAGFlowNodeType } from '../types'

export function useFormValues(
  defaultValues: Record<string, any>,
  node?: RAGFlowNodeType,
) {
  const values = useMemo(() => {
    const formData = node?.data?.form

    if (isEmpty(formData)) {
      return defaultValues
    }

    return formData
  }, [defaultValues, node?.data?.form])

  return values
}
