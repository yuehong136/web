import { useIsPipeline } from '@/pages/agent/hooks/use-is-pipeline'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { createPortal } from 'react-dom'
import { memo, useEffect, useRef, type PropsWithChildren } from 'react'
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
  children?: React.ReactNode
}

function NextStepDropdownBody({
  hideModal,
  isPipeline,
  onNodeCreated,
  nodeId,
  position,
  title,
}: Pick<
  NextStepDropdownProps,
  'hideModal' | 'onNodeCreated' | 'nodeId' | 'position'
> & { isPipeline: boolean; title: string }) {
  return (
    <div className="w-[300px] overflow-hidden rounded-radius-md border border-components-dropdown-border bg-components-dropdown-bg font-semibold text-text-primary shadow-elevation-medium">
      <div className="border-b border-components-dropdown-border px-space-sm py-space-sm">
        <div className="text-sm font-medium text-text-primary">
          {title}
        </div>
      </div>
      <HideModalContext.Provider value={hideModal}>
        <OnNodeCreatedContext.Provider value={onNodeCreated}>
          {isPipeline ? (
            <PipelineAccordionOperators
              isCustomDropdown={!!position}
              mousePosition={position}
              nodeId={nodeId}
            />
          ) : (
            <AccordionOperators
              isCustomDropdown={!!position}
              mousePosition={position}
              nodeId={nodeId}
            />
          )}
        </OnNodeCreatedContext.Provider>
      </HideModalContext.Provider>
    </div>
  )
}

export function InnerNextStepDropdown({
  children,
  hideModal,
  position,
  onNodeCreated,
  nodeId,
}: PropsWithChildren<NextStepDropdownProps>) {
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

      const handlePointerDown = (event: PointerEvent) => {
        if (!dropdownRef.current?.contains(event.target as Node)) {
          hideModal()
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('pointerdown', handlePointerDown, true)

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('pointerdown', handlePointerDown, true)
      }
    }
  }, [position, hideModal])

  if (!position) {
    return (
      <Popover
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            hideModal?.()
          }
        }}
      >
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          align="start"
          side="right"
          sideOffset={12}
          onClick={(e) => e.stopPropagation()}
          className="z-[1100] w-[300px] border-components-dropdown-border bg-components-dropdown-bg p-0 text-text-primary shadow-elevation-medium"
        >
          <NextStepDropdownBody
            hideModal={hideModal}
            isPipeline={isPipeline}
            onNodeCreated={onNodeCreated}
            nodeId={nodeId}
            title={t('flow.nextStep', '下一步')}
          />
        </PopoverContent>
      </Popover>
    )
  }

  const content = (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1100,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <NextStepDropdownBody
        hideModal={hideModal}
        isPipeline={isPipeline}
        onNodeCreated={onNodeCreated}
        nodeId={nodeId}
        position={position}
        title={t('flow.nextStep', '下一步')}
      />
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content
}

export const NextStepDropdown = memo(InnerNextStepDropdown)
