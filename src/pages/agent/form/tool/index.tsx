import type { INextOperatorForm } from '../../types'
import { FormWrapper } from '../components'
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

  return (
    <FormWrapper>
      <div className="rounded-radius-md border border-border-default bg-surface-secondary/40 p-space-base">
        <div className="text-sm font-medium text-text-primary">
          {toolContext?.name || 'Tool'}
        </div>
        <p className="mt-space-xs text-sm text-text-secondary">
          {!toolContext
            ? '请先在 Agent 的工具列表中选择要编辑的工具。'
            : '当前工具还没有接入最新的 tool-form 参数面板。'}
        </p>
      </div>
    </FormWrapper>
  )
}
