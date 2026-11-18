import { memo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetchKnowledgeGraph } from '@/hooks/use-knowledge-request'
import { Network } from 'lucide-react'
import {
  InlineStats,
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns'
import { KnowledgeSectionTemplate } from '../components/knowledge-section-template'
import { ForceGraph } from './components/force-graph'
import { GraphSidePanel } from './components/graph-side-panel'
import { GraphControls } from './components/graph-controls'
import { useGraphSelection, useGraphStats } from './hooks'

function KnowledgeGraphPageComponent() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useFetchKnowledgeGraph()
  const { selectedElement, selectNode, selectEdge, clearSelection } =
    useGraphSelection(data)
  const stats = useGraphStats(data)
  const graphRef = useRef<{
    zoomIn: () => void
    zoomOut: () => void
    fitView: () => void
  } | null>(null)
  const fullscreenTargetRef = useRef<HTMLDivElement | null>(null)

  const isEmpty = !data || (data.nodes.length === 0 && data.edges.length === 0)

  return (
    <KnowledgeSectionTemplate
      title={t('knowledge.nav.graph')}
      subline={
        isEmpty ? null : (
          <InlineStats
            aria-label={t('knowledge.graph.stats.label')}
            items={[
              {
                key: 'nodes',
                label: t('knowledge.graph.stats.nodesLabel'),
                value: stats.nodeCount.toLocaleString(),
              },
              {
                key: 'edges',
                label: t('knowledge.graph.stats.edgesLabel'),
                value: stats.edgeCount.toLocaleString(),
              },
            ]}
          />
        )
      }
      state={isLoading ? 'loading' : isError ? 'error' : 'content'}
      loadingState={<PageLoadingState title={t('knowledge.graph.loading')} />}
      errorState={
        <PageErrorState
          title={t('knowledge.graph.errorTitle')}
          retryLabel={t('knowledge.common.retry')}
          onRetry={() => refetch()}
        />
      }
      bodyScroll="none"
    >
      {isEmpty ? (
        <PageEmptyState
          title={t('knowledge.graph.emptyTitle')}
          description={t('knowledge.graph.emptyDescription')}
          icon={<Network className="size-icon-lg" />}
        />
      ) : (
        <div
          ref={fullscreenTargetRef}
          className="relative min-h-0 flex-1 overflow-hidden bg-surface"
        >
          <ForceGraph
            ref={graphRef}
            data={data}
            onNodeClick={selectNode}
            onEdgeClick={selectEdge}
            onCanvasClick={clearSelection}
            selectedNodeId={
              selectedElement?.type === 'node'
                ? selectedElement.data.id
                : undefined
            }
          />

          <GraphControls
            graphRef={graphRef}
            fullscreenTargetRef={fullscreenTargetRef}
          />

          <GraphSidePanel
            selectedElement={selectedElement}
            onClose={clearSelection}
            onNodeNavigate={selectNode}
          />
        </div>
      )}
    </KnowledgeSectionTemplate>
  )
}

export const KnowledgeGraphPage = memo(KnowledgeGraphPageComponent)
