import { memo, useMemo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import { Bot } from 'lucide-react'
import { get } from 'lodash'
import type { IAgentNode } from '../../types'
import { CommonHandle, LeftEndHandle } from './handle'
import { RightHandleStyle } from './handle-styles'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { NodeHandleId } from '../../constant'
import { ToolBar } from './toolbar'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'
import { isBottomSubAgent, hasSubAgent } from '../../utils/delete-node'
import useGraphStore from '../../store'
import { cn } from '@/lib/utils'

function InnerAgentNode({ id, data, isConnectable, selected }: NodeProps<IAgentNode>) {
  const edges = useGraphStore((state) => state.edges)

  // 判断是否是子Agent（通过agentTop连接的）
  const isHeadAgent = useMemo(() => {
    return !isBottomSubAgent(edges, id)
  }, [edges, id])

  // 判断是否有tools/mcp
  const hasTools = useMemo(() => {
    const tools = get(data, 'form.tools', [])
    const mcp = get(data, 'form.mcp', [])
    return tools.length > 0 || mcp.length > 0
  }, [data])

  return (
    <ToolBar
      selected={selected}
      id={id}
      label={data.label}
      showRun={needsSingleStepDebugging(data.label)}
      showCopy={showCopyIcon(data.label)}
    >
      <NodeWrapper selected={selected} className="!border-purple-500">
        {/* 主Agent的handles */}
        {isHeadAgent && (
          <>
            <LeftEndHandle />
            <CommonHandle
              type="source"
              position={Position.Right}
              isConnectable={isConnectable}
              id={NodeHandleId.Start}
              style={RightHandleStyle}
              isConnectableEnd={false}
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
            className="!bg-blue-500 !size-2"
          />
        )}
        
        {/* 底部handles：子Agent连接点 */}
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={false}
          id={NodeHandleId.AgentBottom}
          style={{ left: '70%' }}
          className={cn('!bg-blue-500 !size-2', {
            'invisible': !hasSubAgent(edges, id),
            'visible': hasSubAgent(edges, id),
          })}
        />
        
        {/* 底部handles：Tool连接点 */}
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={false}
          id={NodeHandleId.Tool}
          style={{ left: '30%' }}
          className={cn('!bg-blue-500 !size-2', {
            'invisible': !hasTools,
            'visible': hasTools,
          })}
        />
        
        <NodeHeader
          id={id}
          name={data.name}
          label={data.label}
          icon={<Bot className="w-4 h-4 text-purple-600" />}
        />
        
        <div className="px-3 py-2">
          <div className="text-xs text-gray-500 space-y-0.5">
            {data.form?.llm_id && (
              <div className="truncate text-blue-600 font-medium">
                {data.form.llm_id.split('@')[0]}
              </div>
            )}
            {data.form?.description && (
              <div className="line-clamp-2 text-gray-600">{data.form.description}</div>
            )}
          </div>
        </div>
      </NodeWrapper>
    </ToolBar>
  )
}

export const AgentNode = memo(InnerAgentNode)
