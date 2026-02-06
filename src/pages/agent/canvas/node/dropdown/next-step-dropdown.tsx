import { useIsPipeline } from '@/pages/agent/hooks/use-is-pipeline'
import { memo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AccordionOperators,
  PipelineAccordionOperators,
} from './accordion-operators'
import { HideModalContext, OnNodeCreatedContext } from './operator-item-context'

export interface NextStepDropdownProps {
  hideModal?: () => void
  position?: { x: number; y: number }
  onNodeCreated?: (newNodeId: string) => void
  nodeId?: string
}

export function InnerNextStepDropdown({
  hideModal,
  position,
  onNodeCreated,
  nodeId,
}: NextStepDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isPipeline = useIsPipeline()
  const { t } = useTranslation()

  useEffect(() => {
    if (position && hideModal) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          hideModal()
        }
      }

      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [position, hideModal])

  // 如果没有 position，不渲染任何内容
  if (!position) {
    return null
  }

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-[300px] font-semibold bg-surface-primary border border-border-default rounded-radius-md shadow-elevation-medium">
        <div className="px-space-sm py-space-sm border-b border-border-default">
          <div className="text-sm font-medium text-text-title">
            {t('flow.nextStep', '下一步')}
          </div>
        </div>
        <HideModalContext.Provider value={hideModal}>
          <OnNodeCreatedContext.Provider value={onNodeCreated}>
            {isPipeline ? (
              <PipelineAccordionOperators
                isCustomDropdown={true}
                mousePosition={position}
                nodeId={nodeId}
              />
            ) : (
              <AccordionOperators
                isCustomDropdown={true}
                mousePosition={position}
                nodeId={nodeId}
              />
            )}
          </OnNodeCreatedContext.Provider>
        </HideModalContext.Provider>
      </div>
    </div>
  )
}

export const NextStepDropdown = memo(InnerNextStepDropdown)
