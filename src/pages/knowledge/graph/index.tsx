import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetchKnowledgeGraph } from '@/hooks/use-knowledge-request'
import { Loading } from '@/components/ui/loading'
import { Network } from 'lucide-react'
import { WorkspacePageTemplate } from '@/components/page-templates'
import { PageEmptyState, PageErrorState } from '@/components/patterns'
import { ForceGraph } from './components/force-graph'
import { GraphSidePanel } from './components/graph-side-panel'
import { GraphControls } from './components/graph-controls'
import { useGraphSelection, useGraphStats } from './hooks'

const KnowledgeGraphPage: React.FC = () => {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useFetchKnowledgeGraph()
  const { selectedElement, selectNode, selectEdge, clearSelection } =
    useGraphSelection(data)
  const stats = useGraphStats(data)
  const graphRef = React.useRef<{
    zoomIn: () => void
    zoomOut: () => void
    fitView: () => void
  } | null>(null)

  const isEmpty = !data || (data.nodes.length === 0 && data.edges.length === 0)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loading
          variant="spinner"
          size="lg"
          text={t('knowledge.graph.loading')}
        />
      </div>
    )
  }

  if (isError) {
    return (
      <PageErrorState
        title={t('knowledge.graph.errorTitle')}
        retryLabel={t('knowledge.common.retry')}
        onRetry={() => refetch()}
      />
    )
  }

  if (isEmpty) {
    return (
      <PageEmptyState
        title={t('knowledge.graph.emptyTitle')}
        description={t('knowledge.graph.emptyDescription')}
        icon={<Network className="h-6 w-6" />}
      />
    )
  }

  return (
    <WorkspacePageTemplate className="h-full">
      <div className="relative h-full w-full overflow-hidden bg-background-body">
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

        <GraphControls graphRef={graphRef} stats={stats} />

        <GraphSidePanel
          selectedElement={selectedElement}
          onClose={clearSelection}
          onNodeNavigate={selectNode}
        />
      </div>
    </WorkspacePageTemplate>
  )
}

export default memo(KnowledgeGraphPage)
export { KnowledgeGraphPage }
