import isEmpty from 'lodash/isEmpty.js'
import { useMemo } from 'react'
import { initialSwitchValues } from '../../constant'
import type { RAGFlowNodeType } from '../../types'
import type { SwitchFormValues } from './types'

export function useValues(node?: RAGFlowNodeType): SwitchFormValues {
  return useMemo(() => {
    const formData = node?.data?.form

    if (isEmpty(formData)) {
      return initialSwitchValues
    }

    return formData as SwitchFormValues
  }, [node?.data?.form])
}
