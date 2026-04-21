import { useEffect } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import useGraphStore from '../../store'
import {
  normalizeBeginInputsForEditor,
  serializeBeginInputsForStore,
} from '../begin/utils'

export function useWatchFormChange<
  TFieldValues extends FieldValues = FieldValues,
>(id?: string, form?: UseFormReturn<TFieldValues>) {
  const values = useWatch({ control: form?.control })
  const updateNodeForm = useGraphStore((state) => state.updateNodeForm)

  useEffect(() => {
    if (!id || !form) {
      return
    }

    const nextValues = form.getValues() as Record<string, unknown> & {
      inputs?: ReturnType<typeof normalizeBeginInputsForEditor>
    }
    const inputs = serializeBeginInputsForStore(nextValues.inputs || [])

    updateNodeForm(id, {
      ...nextValues,
      inputs,
      outputs: inputs,
    })
  }, [form, id, updateNodeForm, values])
}
