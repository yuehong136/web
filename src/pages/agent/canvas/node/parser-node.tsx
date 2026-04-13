import { memo, useState } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { CommonHandle, LeftEndHandle } from './handle'
import { RightHandleStyle } from './handle-styles'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { LabelCard } from './card'
import { NodeHandleId } from '../../constant'
import { getParserFileTypeLabel } from '../../form/parser/constants'
import { normalizeParserSetupsForStore } from '../../form/parser/utils'
import { ToolBar } from './toolbar'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'

type ParserSetupSummary = {
  fileFormat?: string
}

function ParserSummaryCard({
  index,
  fileFormat,
  withDivider = false,
}: {
  index: number
  fileFormat?: string
  withDivider?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'flex flex-col gap-space-xs px-space-sm py-space-sm',
        withDivider && 'border-t border-border-subtle',
      )}
    >
      <span className="text-text-secondary">{`Parser ${index + 1}`}</span>
      <div className="text-sm font-semibold leading-tight text-text-primary">
        {getParserFileTypeLabel(t, fileFormat)}
      </div>
    </div>
  )
}

function ParserNodeCollapsible({
  items,
}: {
  items: ParserSetupSummary[]
}) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const visibleItems = items.slice(0, 3)
  const hiddenItems = items.slice(3)

  if (items.length === 0) {
    return (
      <div className="px-space-sm py-space-sm">
        <LabelCard>{t('flow.noParsersConfigured', 'No parsers configured')}</LabelCard>
      </div>
    )
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="px-space-sm pb-space-sm"
    >
      <div className="pt-space-xs">
        {visibleItems.map((item, idx) => (
          <ParserSummaryCard
            key={`${item.fileFormat || 'parser'}-${idx}`}
            index={idx}
            fileFormat={item.fileFormat}
            withDivider={idx > 0}
          />
        ))}

        {hiddenItems.length > 0 ? (
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            {hiddenItems.map((item, idx) => (
              <ParserSummaryCard
                key={`${item.fileFormat || 'parser'}-${idx + visibleItems.length}`}
                index={idx + visibleItems.length}
                fileFormat={item.fileFormat}
                withDivider
              />
            ))}
          </CollapsibleContent>
        ) : null}

        {hiddenItems.length > 0 ? (
          <div className="border-t border-border-subtle pt-space-sm">
            <CollapsibleTrigger
              asChild
              onClick={(event) => event.stopPropagation()}
              className="block cursor-pointer"
            >
              <button
                type="button"
                className={cn(
                  'mx-auto flex size-5 items-center justify-center rounded-radius-full bg-text-secondary text-text-inverted shadow-elevation-low transition-colors',
                  isOpen && 'bg-text-primary',
                )}
                aria-label={isOpen ? t('common.collapse', 'Collapse') : t('common.expand', 'Expand')}
              >
                {isOpen ? (
                  <ChevronUp className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </button>
            </CollapsibleTrigger>
          </div>
        ) : null}
      </div>
    </Collapsible>
  )
}

function InnerParserNode({ id, data, isConnectable, selected }: NodeProps) {
  const setups = data.form?.setups
    ? normalizeParserSetupsForStore(data.form.setups)
    : []

  return (
    <ToolBar
      selected={selected}
      id={id}
      label={data.label as string}
      showRun={needsSingleStepDebugging(data.label as string)}
      showCopy={showCopyIcon(data.label as string)}
    >
      <NodeWrapper selected={selected} id={id}>
        <LeftEndHandle />
        <CommonHandle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          id={NodeHandleId.Start}
          style={RightHandleStyle}
          isConnectableEnd={false}
          nodeId={id}
        />
        <NodeHeader
          id={id}
          name={data.name as string}
          label={data.label as string}
          icon={<></>}
          className="gap-0"
        />
        <ParserNodeCollapsible items={setups} />
      </NodeWrapper>
    </ToolBar>
  )
}

export const ParserNode = memo(InnerParserNode)
