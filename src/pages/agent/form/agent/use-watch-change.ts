import omit from 'lodash/omit.js'
import { useEffect } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { PromptRole } from '../../constant'
import useGraphStore from '../../store'

export function useWatchFormChange<
  TFieldValues extends FieldValues = FieldValues,
>(id?: string, form?: UseFormReturn<TFieldValues>) {
  const values = useWatch({ control: form?.control })
  const updateNodeForm = useGraphStore((state) => state.updateNodeForm)

  useEffect(() => {
    if (!id || !form?.formState.isDirty) {
      return
    }

    const nextValues = form.getValues() as Record<string, unknown> & {
      prompts?: string
    }
    const promptValue =
      typeof nextValues.prompts === 'string' ? nextValues.prompts : ''

    updateNodeForm(id, {
      ...omit(nextValues, ['showStructuredOutput', 'tools', 'mcp', 'outputs']),
      prompts: [{ role: PromptRole.User, content: promptValue }],
    })
  }, [form, form?.formState.isDirty, id, updateNodeForm, values])
}
