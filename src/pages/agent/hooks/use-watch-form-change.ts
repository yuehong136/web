import { useEffect, useRef } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { useFormBinding } from './use-form-binding'
import useGraphStore from '../store'

export function useWatchFormChange<
  TFieldValues extends FieldValues = FieldValues,
>(id?: string, form?: UseFormReturn<TFieldValues>) {
  const values = useWatch({ control: form?.control })
  const binding = useFormBinding()
  const updateNodeForm = useGraphStore((state) => state.updateNodeForm)
  const nodeId = binding?.nodeId ?? id
  const path = binding?.path
  // isDirty clears once values return to their defaults; that edit must sync too.
  const editedNodeId = useRef<string>(undefined)

  useEffect(() => {
    if (form?.formState.isDirty) editedNodeId.current = nodeId
    if (!nodeId || editedNodeId.current !== nodeId) {
      return
    }
    const nextValues = form?.getValues() || {}
    updateNodeForm(nodeId, nextValues, path)
  }, [form, form?.formState.isDirty, nodeId, path, updateNodeForm, values])
}
