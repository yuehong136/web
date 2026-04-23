import { memo, useMemo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import get from 'lodash/get.js'
import { useTranslation } from 'react-i18next'
import type { IAgentNode } from '../../types'
import { AgentExceptionMethod, NodeHandleId } from '../../constant'
import { CommonHandle, LeftEndHandle } from './handle'
import { RightHandleStyle } from './handle-icon'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { ToolBar } from './toolbar'
import { needsSingleStepDebugging, showCopyIcon, hasSubAgent, isBottomSubAgent } from '../../utils'
import useGraphStore from '../../store'
import { cn } from '@/lib/utils'
import { LLMLabelCard } from './card'

function InnerAgentNode({ id, data, isConnectable, selected }: NodeProps<IAgentNode>) {
  const edges = useGraphStore((state) => state.edges)
  const { t } = useTranslation()

  // 判断是否是子Agent（通过agentTop连接的）
  const isHeadAgent = useMemo(() => {
    return !isBottomSubAgent(edges, id)
  }, [edges, id])

  const exceptionMethod = useMemo(() => {
    return get(data, 'form.exception_method')
  }, [data])

  // 判断是否有tools/mcp
  const hasTools = useMemo(() => {
    const tools = get(data, 'form.tools', [])
    const mcp = get(data, 'form.mcp', [])
    return tools.length > 0 || mcp.length > 0
  }, [data])

  const isGotoMethod = useMemo(() => {
    return exceptionMethod === AgentExceptionMethod.Goto
  }, [exceptionMethod])

  return (
    <ToolBar
      selected={selected}
      id={id}
      label={data.label}
      showRun={needsSingleStepDebugging(data.label)}
      showCopy={showCopyIcon(data.label)}
    >
      <NodeWrapper selected={selected} id={id}>
        {/* 主Agent的handles */}
        {isHeadAgent && (
          <>
            <LeftEndHandle nodeId={id} />
            <CommonHandle
              type="source"
              position={Position.Right}
              isConnectable={isConnectable}
              id={NodeHandleId.Start}
              style={RightHandleStyle}
              isConnectableEnd={false}
              nodeId={id}
            />
          </>
        )}
        
        {/* 子Agent的顶部handle */}
        {!isHeadAgent && (
          <Handle
            type="target"
            position={Position.Top}
            isConnectable={false}
            id={NodeHandleId.AgentTop}
            className="!size-2 !border-none !bg-components-canvas-handle-bg"
          />
        )}
        
        {/* 底部handles：子Agent连接点 */}
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={false}
          id={NodeHandleId.AgentBottom}
          style={{ left: 180 }}
          className={cn(
            '!size-2 !border-none !bg-components-canvas-handle-bg invisible',
            {
            visible: hasSubAgent(edges, id),
            },
          )}
        />
        
        {/* 底部handles：Tool连接点 */}
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={false}
          id={NodeHandleId.Tool}
          style={{ left: 20 }}
          className={cn(
            '!size-2 !border-none !bg-components-canvas-handle-bg invisible',
            {
            visible: hasTools,
            },
          )}
        />
        
        <NodeHeader id={id} name={data.name} label={data.label} />

        <section className="flex flex-col gap-space-sm">
          <LLMLabelCard llmId={get(data, 'form.llm_id')} />
          {(isGotoMethod || exceptionMethod === AgentExceptionMethod.Comment) && (
            <div className="bg-surface-secondary rounded-radius-sm p-space-xs flex justify-between gap-space-sm">
              <span className="text-text-secondary">{t('flow.onFailure')}</span>
              <span className="truncate flex-1 text-right">
                {t(`flow.${exceptionMethod}`)}
              </span>
            </div>
          )}
        </section>

        {isGotoMethod && (
          <CommonHandle
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            className="!bg-state-error"
            style={{ ...RightHandleStyle, top: 94 }}
            nodeId={id}
            id={NodeHandleId.AgentException}
            isConnectableEnd={false}
          />
        )}
      </NodeWrapper>
    </ToolBar>
  )
}

export const AgentNode = memo(InnerAgentNode)
