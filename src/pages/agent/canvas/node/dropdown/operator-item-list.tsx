import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Operator } from '@/pages/agent/constant'
import { AgentInstanceContext, HandleContext } from '@/pages/agent/context'
import OperatorIcon from '@/pages/agent/operator-icon'
import { getOperatorDefinition } from '@/pages/agent/operators/registry'
import { Position } from '@xyflow/react'
import lowerFirst from 'lodash/lowerFirst.js'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { HideModalContext, OnNodeCreatedContext } from './operator-item-context'

export type OperatorItemProps = {
  operators: Operator[]
  isCustomDropdown?: boolean
  mousePosition?: { x: number; y: number }
}

export function OperatorItemList({
  operators,
  mousePosition,
}: OperatorItemProps) {
  const { addCanvasNode } = useContext(AgentInstanceContext)
  const handleContext = useContext(HandleContext)
  const hideModal = useContext(HideModalContext)
  const onNodeCreated = useContext(OnNodeCreatedContext)
  const { t } = useTranslation()

  const handleClick =
    (operator: Operator): React.MouseEventHandler<HTMLElement> =>
    (e) => {
      const contextData = handleContext || {
        nodeId: '',
        id: '',
        type: 'source' as const,
        position: Position.Right,
        isFromConnectionDrag: true,
      }

      const mockEvent = mousePosition
        ? {
            clientX: mousePosition.x,
            clientY: mousePosition.y,
          }
        : e

      const newNodeId = addCanvasNode(operator, contextData)(mockEvent)

      if (onNodeCreated && newNodeId) {
        onNodeCreated(newNodeId)
      }

      hideModal?.()
    }

  const renderOperatorItem = (operator: Operator) => {
    const operatorDefinition = getOperatorDefinition(operator)
    const fallbackName = operatorDefinition?.defaultName || operator
    const fallbackDescription =
      operatorDefinition?.description || `${fallbackName} node`
    const content = (
      <div
        className="gap-space-sm rounded-radius-sm px-space-sm py-space-xs flex cursor-pointer items-center justify-start transition-colors hover:bg-components-dropdown-item-bg-hover"
        onClick={handleClick(operator)}
      >
        <OperatorIcon name={operator} />
        <span className="text-text-primary">
          {t(`flow.${lowerFirst(operator)}`, fallbackName)}
        </span>
      </div>
    )

    return (
      <TooltipProvider key={operator} delayDuration={300}>
        <TooltipRoot>
          <TooltipTrigger asChild>
            <li>{content}</li>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={24}>
            <p>
              {t(
                `flow.${lowerFirst(operator)}Description`,
                fallbackDescription,
              )}
            </p>
          </TooltipContent>
        </TooltipRoot>
      </TooltipProvider>
    )
  }

  return (
    <ul className="space-y-space-xs font-normal text-text-primary">
      {operators.map(renderOperatorItem)}
    </ul>
  )
}
