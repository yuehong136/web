import React, { memo } from 'react'
import { useFetchKnowledgeGraph } from '@/hooks/use-knowledge-request'
import { Loading } from '@/components/ui/loading'
import { Network } from 'lucide-react'
import { ForceGraph } from './components/force-graph'
import { GraphSidePanel } from './components/graph-side-panel'
import { GraphControls } from './components/graph-controls'
import { useGraphSelection, useGraphStats } from './hooks'

const KnowledgeGraphPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useFetchKnowledgeGraph()
  const { selectedElement, selectNode, selectEdge, clearSelection } = useGraphSelection(data)
  const stats = useGraphStats(data)
  const graphRef = React.useRef<{ zoomIn: () => void; zoomOut: () => void; fitView: () => void } | null>(null)

  const isEmpty = !data || (data.nodes.length === 0 && data.edges.length === 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading variant="spinner" size="lg" text="加载知识图谱中..." />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Network className="h-12 w-12" style={{ color: 'var(--color-text-muted)' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>加载知识图谱失败</p>
        <button
          className="text-sm underline"
          style={{ color: 'var(--color-text-accent)' }}
          onClick={() => refetch()}
        >
          重试
        </button>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-background-subtle)' }}
        >
          <Network className="h-10 w-10" style={{ color: 'var(--color-text-muted)' }} />
        </div>
        <div className="text-center">
          <p className="text-base font-medium" style={{ color: 'var(--color-text-primary)' }}>
            暂无知识图谱数据
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            请先上传文档并运行 GraphRAG 生成知识图谱
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: 'var(--color-background-body)' }}>
      <ForceGraph
        ref={graphRef}
        data={data}
        onNodeClick={selectNode}
        onEdgeClick={selectEdge}
        onCanvasClick={clearSelection}
        selectedNodeId={selectedElement?.type === 'node' ? selectedElement.data.id : undefined}
      />

      <GraphControls
        graphRef={graphRef}
        stats={stats}
      />

      <GraphSidePanel
        selectedElement={selectedElement}
        onClose={clearSelection}
        onNodeNavigate={selectNode}
      />
    </div>
  )
}

export default memo(KnowledgeGraphPage)
export { KnowledgeGraphPage }
