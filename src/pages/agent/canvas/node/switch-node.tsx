import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import type { ISwitchCondition, ISwitchNode } from '../../types'
import { SwitchOperatorOptions } from '../../constant'
import { CommonHandle, LeftEndHandle } from './handle'
import { RightHandleStyle } from './handle-styles'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { ToolBar } from './toolbar'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'
import { useBuildSwitchHandlePositions } from './use-build-switch-handle-positions'
import { useUpdateNodeInternals } from '@xyflow/react'

const getConditionKey = (idx: number, length: number) => {
  if (idx === 0 && length !== 1) {
    return 'If'
  } else if (idx === length - 1) {
    return 'Else'
  }

  return 'ElseIf'
}

const getOperatorLabel = (operator?: string) => {
  return (
    SwitchOperatorOptions.find((x) => x.value === operator)?.label || operator
  )
}

const ConditionBlock = ({ condition }: { condition: ISwitchCondition }) => {
  const items = condition?.items ?? []

  if (items.length === 0) {
    return null
  }

  return (
    <div className="bg-surface-secondary rounded-radius-sm p-space-xs flex flex-col gap-space-xs">
      {items.map((item, idx) => (
        <section
          key={idx}
          className="flex items-center justify-between gap-space-sm text-xs"
        >
          <div className="flex-1 truncate text-text-accent">
            {item?.cpn_id}
          </div>
          <span className="text-text-tertiary">
            {getOperatorLabel(item?.operator)}
          </span>
          <div className="flex-1 truncate text-right">{item?.value}</div>
        </section>
      ))}
    </div>
  )
}

function InnerSwitchNode({ id, data, selected }: NodeProps<ISwitchNode>) {
  const { positions } = useBuildSwitchHandlePositions({ data, id })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const headerRefs = useRef<Array<HTMLDivElement | null>>([])
  const [dynamicTops, setDynamicTops] = useState<number[]>([])
  const updateNodeInternals = useUpdateNodeInternals()

  const positionCount = positions.length

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || positionCount === 0) {
      return
    }

    const nextTops = positions.map((_, idx) => {
      const el = headerRefs.current[idx]
      if (!el) {
        return undefined
      }
      return el.offsetTop + el.offsetHeight / 2
    })

    setDynamicTops(nextTops as number[])
    updateNodeInternals(id)
  }, [id, positionCount, positions, updateNodeInternals])
  
  return (
    <ToolBar
      selected={selected}
      id={id}
      label={data.label}
      showRun={needsSingleStepDebugging(data.label)}
      showCopy={showCopyIcon(data.label)}
    >
      <NodeWrapper ref={containerRef} selected={selected} id={id}>
        <LeftEndHandle />
        <NodeHeader id={id} name={data.name} label={data.label} />

        <section className="flex flex-col gap-space-sm">
          {positions.map((position, idx) => (
            <div key={position.text}>
              <section className="flex flex-col text-xs">
                <div
                  ref={(el) => {
                    headerRefs.current[idx] = el
                  }}
                  className="text-right"
                >
                  <span>{getConditionKey(idx, positions.length)}</span>
                  <div className="text-text-secondary">
                    {idx < positions.length - 1 && position.text}
                  </div>
                </div>
                <span className="text-text-accent">
                  {idx < positions.length - 1 &&
                    position.condition?.logical_operator?.toUpperCase()}
                </span>
                {position.condition && (
                  <ConditionBlock condition={position.condition} />
                )}
              </section>

              <CommonHandle
                key={position.text}
                id={position.text}
                type="source"
                position={Position.Right}
                isConnectable
                style={{
                  ...RightHandleStyle,
                  top:
                    typeof dynamicTops[idx] === 'number'
                      ? dynamicTops[idx]
                      : position.top,
                }}
                isConnectableEnd={false}
                nodeId={id}
              />
            </div>
          ))}
        </section>
      </NodeWrapper>
    </ToolBar>
  )
}

export const SwitchNode = memo(InnerSwitchNode)
