import type { INextOperatorForm } from '../../types'
import { ToolFormConfigMap } from './constant'
import { McpForm } from './mcp-form'
import { useSelectedTool } from './use-selected-tool'

export function ToolForm({ node }: INextOperatorForm) {
  const toolContext = useSelectedTool(node)

  if (
    toolContext?.mcpServer &&
    toolContext.agentNodeId &&
    typeof toolContext.mcpIndex === 'number'
  ) {
    return (
      <McpForm
        key={toolContext.id}
        agentNodeId={toolContext.agentNodeId}
        mcpIndex={toolContext.mcpIndex}
        mcpId={toolContext.id}
        selectedTools={
          (toolContext.mcp as { tools?: Record<string, unknown> } | undefined)
            ?.tools
        }
      />
    )
  }

  if (
    toolContext?.operator &&
    toolContext.agentNodeId &&
    typeof toolContext.toolIndex === 'number'
  ) {
    const ToolRenderer = ToolFormConfigMap[toolContext.operator]

    if (ToolRenderer) {
      return <ToolRenderer key={toolContext.id} node={node} />
    }
  }

  return null
}
