import { useEffect, useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { initialA2UIValues } from '../../constant'
import useGraphStore from '../../store'
import type { RAGFlowNodeType } from '../../types'

interface A2UICommandItem {
  value: string
}

function toCommandObjectArray(commands: unknown): A2UICommandItem[] {
  if (!Array.isArray(commands)) {
    return initialA2UIValues.commands.map((value) => ({ value }))
  }

  const values = commands
    .map((command) => (typeof command === 'string' ? command : ''))
    .filter((command) => command.length > 0)

  return (values.length ? values : ['']).map((value) => ({ value }))
}

function toCommandStringArray(commands: unknown): string[] {
  if (!Array.isArray(commands)) {
    return []
  }

  return commands
    .map((command) => {
      if (typeof command === 'string') {
        return command
      }
      if (typeof command === 'object' && command !== null && 'value' in command) {
        const value = (command as { value?: unknown }).value
        return typeof value === 'string' ? value : ''
      }
      return ''
    })
    .filter((command) => command.length > 0)
}

export function useA2UIFormValues(node?: RAGFlowNodeType) {
  return useMemo(() => {
    const formData = node?.data?.form as Record<string, unknown> | undefined
    return {
      ...(formData || initialA2UIValues),
      commands: toCommandObjectArray(formData?.commands),
    }
  }, [node?.data?.form])
}

export function useWatchA2UIFormChange(id?: string, form?: UseFormReturn) {
  const values = useWatch({ control: form?.control })
  const updateNodeForm = useGraphStore((state) => state.updateNodeForm)

  useEffect(() => {
    if (!id || !form?.formState.isDirty) {
      return
    }

    updateNodeForm(id, {
      ...(form.getValues() || {}),
      commands: toCommandStringArray(form.getValues('commands')),
    })
  }, [form, form?.formState.isDirty, id, updateNodeForm, values])
}
