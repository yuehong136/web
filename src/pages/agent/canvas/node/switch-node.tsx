import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { GitBranch } from 'lucide-react'
import type { ISwitchNode } from '../../types'
import { CommonHandle, LeftEndHandle } from './handle'
import { RightHandleStyle } from './handle-styles'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { ToolBar } from './toolbar'
import { needsSingleStepDebugging, showCopyIcon, generateSwitchHandleText } from '../../utils'
import { SwitchElseTo } from '../../constant'

// 计算Switch节点的handle位置
const useBuildSwitchHandlePositions = ({ data }: { data: ISwitchNode['data'] }) => {
  const conditions = data.form?.conditions || []
  const baseTop = 60
  const spacing = 80
  
  const positions = conditions.map((condition, index) => ({
    text: generateSwitchHandleText(index),
    top: baseTop + index * spacing,
    condition,
  }))

  // 添加Else handle
  positions.push({
    text: SwitchElseTo,
    top: baseTop + conditions.length * spacing,
    condition: null as any,
  })

  return { positions }
}

function InnerSwitchNode({ id, data, selected }: NodeProps<ISwitchNode>) {
  const { positions } = useBuildSwitchHandlePositions({ data })
  
  return (
    <ToolBar
      selected={selected}
      id={id}
      label={data.label}
      showRun={needsSingleStepDebugging(data.label)}
      showCopy={showCopyIcon(data.label)}
    >
      <NodeWrapper selected={selected} className="!border-yellow-500">
        <LeftEndHandle />
        <NodeHeader
          id={id}
          name={data.name}
          label={data.label}
          icon={<GitBranch className="w-4 h-4 text-yellow-600" />}
        />
        
        {/* 条件列表和动态handles */}
        <div className="px-3 py-2 space-y-2">
          {positions.map((position, idx) => {
            const isElse = idx === positions.length - 1
            return (
              <div key={idx} className="relative">
                <div className="text-xs">
                  <div className="font-medium text-gray-700">
                    {isElse ? 'Else' : idx === 0 ? 'If' : 'ElseIf'}
                  </div>
                  {!isElse && position.condition && (
                    <div className="text-gray-500 text-xs mt-1">
                      {position.condition.items?.length || 0} 条件
                    </div>
                  )}
                </div>
                
                {/* 动态handle */}
                <CommonHandle
                  key={position.text}
                  id={position.text}
                  type="source"
                  position={Position.Right}
                  isConnectable
                  style={{ ...RightHandleStyle, top: position.top }}
                  isConnectableEnd={false}
                />
              </div>
            )
          })}
        </div>
      </NodeWrapper>
    </ToolBar>
  )
}

export const SwitchNode = memo(InnerSwitchNode)
