import { memo, useMemo } from 'react'
import type { ComponentType } from 'react'
import { FormBindingProvider } from '../../hooks/form-binding'
import type { INextOperatorForm, RAGFlowNodeType } from '../../types'
import type { Operator } from '../../constant'
import { useSelectedTool } from './use-selected-tool'

function buildBoundToolNode({
  node,
  operator,
  name,
  formData,
}: {
  node?: RAGFlowNodeType
  operator?: Operator
  name?: string
  formData?: Record<string, unknown>
}) {
  if (!node || !operator) {
    return node
  }

  return {
    ...node,
    data: {
      ...node.data,
      label: operator,
      name: name || node.data.name,
      form: formData || {},
    },
  } satisfies RAGFlowNodeType
}

export function createToolFormWrapper(
  operator: Operator,
  Renderer: ComponentType<INextOperatorForm>,
) {
  const WrappedToolForm = function WrappedToolForm({
    node,
  }: INextOperatorForm) {
    const toolContext = useSelectedTool(node)

    const boundToolNode = useMemo(
      () =>
        buildBoundToolNode({
          node,
          operator: toolContext?.operator,
          name: toolContext?.name,
          formData:
            (toolContext?.tool as { params?: Record<string, unknown> } | undefined)
              ?.params || {},
        }),
      [node, toolContext?.name, toolContext?.operator, toolContext?.tool],
    )

    const bindingValue = useMemo(
      () =>
        toolContext?.operator === operator &&
        toolContext.agentNodeId != null &&
        typeof toolContext.toolIndex === 'number'
          ? {
              nodeId: toolContext.agentNodeId,
              path: ['tools', toolContext.toolIndex, 'params'] as (
                | string
                | number
              )[],
              formData:
                (
                  toolContext.tool as
                    | { params?: Record<string, unknown> }
                    | undefined
                )?.params || {},
            }
          : undefined,
      [
        toolContext?.agentNodeId,
        toolContext?.operator,
        toolContext?.tool,
        toolContext?.toolIndex,
      ],
    )

    if (!boundToolNode || !bindingValue) {
      return null
    }

    return (
      <FormBindingProvider value={bindingValue}>
        <Renderer node={boundToolNode} />
      </FormBindingProvider>
    )
  }

  WrappedToolForm.displayName = `ToolFormWrapper(${operator})`

  return memo(WrappedToolForm)
}
