import merge from 'lodash/merge'
import { useMemo } from 'react'
import { useFormBinding } from './use-form-binding'
import type { RAGFlowNodeType } from '../types'

function isEmptyValue(value: unknown) {
  if (value == null) {
    return true
  }

  if (Array.isArray(value)) {
    return value.length === 0
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0
  }

  return false
}

export function useFormValues(
  defaultValues: Record<string, unknown>,
  node?: RAGFlowNodeType,
) {
  const binding = useFormBinding()

  const values = useMemo(() => {
    const formData = binding?.formData ?? node?.data?.form

    if (isEmptyValue(formData)) {
      return defaultValues
    }

    return merge({}, defaultValues, formData)
  }, [binding?.formData, defaultValues, node?.data?.form])

  return values
}
