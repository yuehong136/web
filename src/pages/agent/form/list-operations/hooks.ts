import { useEffect, useMemo, useRef } from 'react'
import { useWatch, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { Operator } from '../../constant'
import { useFormBinding } from '../../hooks/use-form-binding'
import { mergeOperatorFormWithDefaults } from '../../operators/defaults'
import type { RAGFlowNodeType } from '../../types'
import useGraphStore from '../../store'

export function useListOperationsValues(node?: RAGFlowNodeType) {
  const binding = useFormBinding()
  const raw = binding?.formData ?? node?.data.form
  return useMemo(
    () => mergeOperatorFormWithDefaults(Operator.ListOperations, raw ?? {}),
    [raw],
  )
}

export function usePersistListOperationsForm<T extends FieldValues>(
  id: string | undefined,
  form: UseFormReturn<T>,
  enabled: boolean,
) {
  const watched = useWatch({ control: form.control })
  const binding = useFormBinding()
  const nodeId = binding?.nodeId ?? id
  const path = binding?.path
  const updateNodeForm = useGraphStore((state) => state.updateNodeForm)
  const last = useRef('')
  useEffect(() => {
    if (!nodeId || !enabled) return
    const values = form.getValues()
    const snapshot = JSON.stringify([nodeId, path, values])
    if (snapshot === last.current) return
    last.current = snapshot
    // Returning to the initial zero clears RHF isDirty, but must still save zero.
    updateNodeForm(nodeId, values, path)
  }, [enabled, form, nodeId, path, updateNodeForm, watched])
}
