import { useEffect } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import useGraphStore from '../store'

export function useWatchFormChange(
  id?: string,
  form?: UseFormReturn<any>,
) {
  let values = useWatch({ control: form?.control })
  const updateNodeForm = useGraphStore((state) => state.updateNodeForm)

  useEffect(() => {
    if (id) {
      values = form?.getValues() || {}
      const nextValues: any = values
      updateNodeForm(id, nextValues)
    }
  }, [form?.formState.isDirty, id, updateNodeForm, values])
}
