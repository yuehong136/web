import { memo, useMemo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { GalleryVerticalEnd, Layers, BookOpen } from 'lucide-react'
import type { IA2UINode } from '../../types'
import { LeftEndHandle } from './handle'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { ToolBar } from './toolbar'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'
import { LabelCard } from './card'
import { SummaryList } from './summary-list'
import { cn } from '@/lib/utils'

const CATALOG_LABEL = 'Basic v0.9'

function parseCommands(commands: unknown) {
  if (!Array.isArray(commands)) return []
  return commands.flatMap((commandBlock) => {
    if (typeof commandBlock !== 'string') return []
    try {
      const parsed = JSON.parse(commandBlock)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return commandBlock
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .flatMap((line) => {
          try {
            return [JSON.parse(line)]
          } catch {
            return []
          }
        })
    }
  })
}

function InnerA2UINode({ id, data, selected }: NodeProps<IA2UINode>) {
  const surfaceIds = useMemo(() => {
    const parsedCommands = parseCommands(data.form?.commands)
    const ids = parsedCommands
      .map((command) => {
        if (typeof command !== 'object' || command === null) return undefined
        const record = command as Record<string, Record<string, unknown>>
        return (
          record.createSurface?.surfaceId ||
          record.updateComponents?.surfaceId ||
          record.updateDataModel?.surfaceId ||
          record.deleteSurface?.surfaceId
        )
      })
      .filter((surfaceId): surfaceId is string => typeof surfaceId === 'string')
    return Array.from(new Set(ids))
  }, [data.form?.commands])

  return (
    <ToolBar
      selected={selected}
      id={id}
      label={data.label}
      showRun={needsSingleStepDebugging(data.label)}
      showCopy={showCopyIcon(data.label)}
    >
      <NodeWrapper selected={selected} id={id}>
        <LeftEndHandle nodeId={id} />
        <NodeHeader
          id={id}
          name={data.name}
          label={data.label}
          icon={<GalleryVerticalEnd className="h-icon-md w-icon-md text-text-secondary" />}
        />
        <section className="flex flex-col gap-space-xs px-space-sm pb-space-xs">
          <LabelCard className="flex items-center gap-space-sm">
            <BookOpen className="size-3.5 shrink-0 text-text-tertiary" />
            <span className="text-text-tertiary">Catalog</span>
            <span className="ml-auto truncate font-medium text-text-primary">
              {CATALOG_LABEL}
            </span>
          </LabelCard>
        </section>
        <SummaryList
          items={surfaceIds}
          empty={
            <LabelCard className="flex items-center gap-space-sm text-text-tertiary">
              <Layers className="size-3.5 shrink-0" />
              <span>暂无 Surface</span>
            </LabelCard>
          }
          renderItem={(surfaceId, index, { withDivider }) => (
            <section
              key={`${id}-surface-${surfaceId}`}
              className={cn(withDivider && 'border-t border-border-subtle pt-space-sm')}
            >
              <LabelCard className="flex items-center gap-space-sm">
                <Layers className="size-3.5 shrink-0 text-text-tertiary" />
                <span className="min-w-0 flex-1 truncate font-medium text-text-primary">
                  {surfaceId}
                </span>
                <span className="shrink-0 text-text-tertiary">#{index + 1}</span>
              </LabelCard>
            </section>
          )}
        />
      </NodeWrapper>
    </ToolBar>
  )
}

export const A2UINode = memo(InnerA2UINode)
