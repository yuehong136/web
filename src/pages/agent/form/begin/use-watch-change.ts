import { useEffect } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { AgentDialogueMode } from '../../constant'
import useGraphStore from '../../store'
import {
  buildBeginWebhookOutputs,
  normalizeBeginInputsForEditor,
  serializeBeginInputsForStore,
} from './utils'

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
      mode?: string
      inputs?: ReturnType<typeof normalizeBeginInputsForEditor>
      schema?: Parameters<typeof buildBeginWebhookOutputs>[0]
    }

    updateNodeForm(id, {
      ...nextValues,
      inputs: serializeBeginInputsForStore(nextValues.inputs || []),
      outputs:
        nextValues.mode === AgentDialogueMode.Webhook
          ? buildBeginWebhookOutputs(nextValues.schema)
          : {},
    })
  }, [form, id, updateNodeForm, values])
}
