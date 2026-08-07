import { useEffect } from 'react'
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

  useEffect(() => {
    if (!nodeId || !form?.formState.isDirty) {
      return
    }
    const nextValues = form.getValues() || {}
    updateNodeForm(nodeId, nextValues, path)
  }, [form, form?.formState.isDirty, nodeId, path, updateNodeForm, values])
}
