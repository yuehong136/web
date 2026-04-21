import get from 'lodash/get.js'
import omit from 'lodash/omit.js'
import { useCallback, useMemo, useState } from 'react'
import type { JSONSchema } from '@/components/jsonjoy-builder/types/json-schema'
import { AgentStructuredOutputField } from '../../constant'
import useGraphStore from '../../store'

export function useStructuredOutputDialog(nodeId?: string) {
  const [visible, setVisible] = useState(false)
  const getNode = useGraphStore((state) => state.getNode)
  const updateNodeForm = useGraphStore((state) => state.updateNodeForm)

  const initialValues = useMemo(
    () =>
      get(
        getNode(nodeId),
        `data.form.outputs.${AgentStructuredOutputField}`,
      ) as JSONSchema | undefined,
    [getNode, nodeId],
  )

  const show = useCallback(() => setVisible(true), [])
  const hide = useCallback(() => setVisible(false), [])

  const handleOk = useCallback(
    (values: JSONSchema) => {
      if (nodeId) {
        updateNodeForm(nodeId, values, ['outputs', AgentStructuredOutputField])
      }
      hide()
    },
    [hide, nodeId, updateNodeForm],
  )

  const toggle = useCallback(
    (nextValue: boolean) => {
      if (!nodeId) {
        return
      }

      const node = getNode(nodeId)
      const outputs = (get(node, 'data.form.outputs') || {}) as Record<
        string,
        unknown
      >

      if (nextValue) {
        updateNodeForm(
          nodeId,
          get(outputs, AgentStructuredOutputField, { type: 'object' }),
          ['outputs', AgentStructuredOutputField],
        )
        return
      }

      updateNodeForm(
        nodeId,
        omit(outputs, [AgentStructuredOutputField]),
        ['outputs'],
      )
    },
    [getNode, nodeId, updateNodeForm],
  )

  return {
    visible,
    show,
    hide,
    handleOk,
    toggle,
    initialValues,
  }
}
