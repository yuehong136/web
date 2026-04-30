import { memo, useMemo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { GalleryVerticalEnd } from 'lucide-react'
import type { IA2UINode } from '../../types'
import { A2UIBasicCatalogId } from '../../constant'
import { LeftEndHandle } from './handle'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { ToolBar } from './toolbar'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'
import { LabelCard } from './card'
import { SummaryList } from './summary-list'

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
  const summary = useMemo(() => {
    const parsedCommands = parseCommands(data.form?.commands)
    const surfaceIds = parsedCommands
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

    return {
      firstSurfaceId: surfaceIds[0],
      surfaceCount: new Set(surfaceIds).size,
    }
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
        <SummaryList
          items={[
            `Catalog: ${A2UIBasicCatalogId}`,
            `Surfaces: ${summary.surfaceCount || 0}`,
            summary.firstSurfaceId ? `First: ${summary.firstSurfaceId}` : '',
          ].filter(Boolean)}
          empty={<LabelCard>暂无卡片命令</LabelCard>}
          renderItem={(item) => <LabelCard key={item}>{item}</LabelCard>}
        />
      </NodeWrapper>
    </ToolBar>
  )
}

export const A2UINode = memo(InnerA2UINode)
