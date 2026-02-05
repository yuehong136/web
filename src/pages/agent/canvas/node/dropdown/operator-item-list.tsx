import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Operator } from '@/pages/agent/constant'
import { AgentInstanceContext, HandleContext } from '@/pages/agent/context'
import OperatorIcon from '@/pages/agent/operator-icon'
import { Position } from '@xyflow/react'
import { lowerFirst } from 'lodash'
import { createContext, useContext } from 'react'
import { useTranslation } from 'react-i18next'

export type OperatorItemProps = {
  operators: Operator[]
  isCustomDropdown?: boolean
  mousePosition?: { x: number; y: number }
}

export const HideModalContext = createContext<(() => void) | undefined>(undefined)
export const OnNodeCreatedContext = createContext<
  ((newNodeId: string) => void) | undefined
>(undefined)

export function OperatorItemList({
  operators,
  isCustomDropdown = false,
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
    const content = (
      <div 
        className="hover:bg-surface-secondary py-space-xs px-space-sm cursor-pointer rounded-radius-sm flex gap-space-sm items-center justify-start"
        onClick={handleClick(operator)}
      >
        <OperatorIcon name={operator} />
        <span>{t(`flow.${lowerFirst(operator)}`, operator)}</span>
      </div>
    )

    return (
      <TooltipProvider key={operator} delayDuration={300}>
        <TooltipRoot>
          <TooltipTrigger asChild>
            <li>{content}</li>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={24}>
            <p>{t(`flow.${lowerFirst(operator)}Description`, `${operator} node`)}</p>
          </TooltipContent>
        </TooltipRoot>
      </TooltipProvider>
    )
  }

  return (
    <ul className="space-y-space-xs text-text-primary font-normal">
      {operators.map(renderOperatorItem)}
    </ul>
  )
}
