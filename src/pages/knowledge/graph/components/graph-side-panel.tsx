import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ContextPanel } from '@/components/patterns/context-panel'
import type { SelectedElement } from '../types'
import { EdgeDetail } from './edge-detail'
import { NodeDetail } from './node-detail'

interface GraphSidePanelProps {
  selectedElement: SelectedElement | null
  onClose: () => void
  onNodeNavigate: (nodeId: string) => void
}

/**
 * Node or edge details floating over the canvas. It stays inside the graph
 * (rather than the page Inspector) so it remains visible in full screen and
 * the canvas keeps its size.
 */
function GraphSidePanelComponent({
  selectedElement,
  onClose,
  onNodeNavigate,
}: GraphSidePanelProps) {
  const { t } = useTranslation()

  if (!selectedElement) return null

  return (
    <div className="absolute top-space-sm right-space-sm bottom-space-sm z-10 flex overflow-hidden rounded-radius-xl border border-border-default shadow-elevation-high">
      <ContextPanel
        title={
          selectedElement.type === 'node'
            ? t('knowledge.graph.panel.nodeDetails')
            : t('knowledge.graph.panel.edgeDetails')
        }
        onClose={onClose}
        closeLabel={t('knowledge.graph.panel.close')}
        className="border-l-0"
      >
        {selectedElement.type === 'node' ? (
          <NodeDetail
            element={selectedElement}
            onNodeNavigate={onNodeNavigate}
          />
        ) : (
          <EdgeDetail
            element={selectedElement}
            onNodeNavigate={onNodeNavigate}
          />
        )}
      </ContextPanel>
    </div>
  )
}

export const GraphSidePanel = memo(GraphSidePanelComponent)
