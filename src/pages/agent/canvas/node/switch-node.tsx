import { memo, useLayoutEffect, useRef, useState } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position, useUpdateNodeInternals } from '@xyflow/react'
import { useTranslation } from 'react-i18next'
import type { ISwitchCondition, ISwitchNode } from '../../types'
import { ComparisonOperator, SwitchOperatorOptions } from '../../constant'
import { useGetVariableLabelOrTypeByValue } from '../../hooks/use-get-begin-query'
import { CommonHandle, LeftEndHandle } from './handle'
import { RightHandleStyle } from './handle-icon'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { ToolBar } from './toolbar'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'
import { useBuildSwitchHandlePositions } from './use-build-switch-handle-positions'

const getConditionLabel = (
  t: ReturnType<typeof useTranslation>['t'],
  idx: number,
  length: number,
) => {
  if (idx === 0 && length !== 1) {
    return t('flow.switchBranchLabels.if', 'If')
  } else if (idx === length - 1) {
    return t('flow.switchBranchLabels.else', 'Else')
  }

  return t('flow.switchBranchLabels.elseIf', 'Else if')
}

const SwitchOperatorGlyphMap: Record<string, string> = {
  [ComparisonOperator.Equal]: '=',
  [ComparisonOperator.NotEqual]: '!=',
  [ComparisonOperator.GreatThan]: '>',
  [ComparisonOperator.GreatEqual]: '>=',
  [ComparisonOperator.LessThan]: '<',
  [ComparisonOperator.LessEqual]: '<=',
  [ComparisonOperator.Contains]: 'has',
  [ComparisonOperator.NotContains]: '!has',
  [ComparisonOperator.StartWith]: '^=',
  [ComparisonOperator.EndWith]: '$=',
  [ComparisonOperator.Empty]: '0',
  [ComparisonOperator.NotEmpty]: '!0',
  [ComparisonOperator.In]: 'in',
  [ComparisonOperator.NotIn]: '!in',
}

const getOperatorLabelKey = (operator?: string) => {
  return SwitchOperatorOptions.find((x) => x.value === operator)?.label
}

const getOperatorGlyph = (operator?: string) => {
  return SwitchOperatorGlyphMap[operator || ''] || operator || '?'
}

const ConditionBlock = ({
  condition,
  nodeId,
}: {
  condition: ISwitchCondition
  nodeId: string
}) => {
  const { t } = useTranslation()
  const { getLabel } = useGetVariableLabelOrTypeByValue({ nodeId })
  const items = condition?.items ?? []

  if (items.length === 0) {
    return null
  }

  return (
    <div className="bg-surface-secondary rounded-radius-sm p-space-xs gap-space-xs flex flex-col">
      {items.map((item, idx) => {
        const operatorLabelKey = getOperatorLabelKey(item?.operator)
        const operatorLabel = operatorLabelKey
          ? t(
              `flow.switchOperatorOptions.${operatorLabelKey}`,
              operatorLabelKey,
            )
          : item?.operator || ''

        return (
          <section
            key={idx}
            className="gap-space-sm flex items-center justify-between text-xs"
          >
            <div className="flex-1 truncate text-text-accent">
              {getLabel(item?.cpn_id)}
            </div>
            <span
              title={operatorLabel}
              className="rounded-radius-sm bg-surface-primary px-space-xs inline-flex min-w-10 shrink-0 items-center justify-center border border-border-default py-px font-mono text-[11px] leading-5 text-text-secondary"
            >
              {getOperatorGlyph(item?.operator)}
            </span>
            <div className="flex-1 truncate text-right">{item?.value}</div>
          </section>
        )
      })}
    </div>
  )
}

function InnerSwitchNode({ id, data, selected }: NodeProps<ISwitchNode>) {
  const { t } = useTranslation()
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
        <LeftEndHandle nodeId={id} />
        <NodeHeader id={id} name={data.name} label={data.label} />

        <section className="gap-space-sm flex flex-col">
          {positions.map((position, idx) => (
            <div key={position.text}>
              <section className="flex flex-col text-xs">
                <div
                  ref={(el) => {
                    headerRefs.current[idx] = el
                  }}
                  className="text-right"
                >
                  <span>{getConditionLabel(t, idx, positions.length)}</span>
                  <div className="text-text-secondary">
                    {idx < positions.length - 1 &&
                      t('flow.switchBranchLabels.case', {
                        index: idx + 1,
                        defaultValue: position.text,
                      })}
                  </div>
                </div>
                <span className="text-text-accent">
                  {idx < positions.length - 1 &&
                    position.condition?.logical_operator &&
                    t(
                      `flow.switchLogicOperatorOptions.${position.condition.logical_operator}`,
                      position.condition.logical_operator.toUpperCase(),
                    )}
                </span>
                {position.condition && (
                  <ConditionBlock condition={position.condition} nodeId={id} />
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
