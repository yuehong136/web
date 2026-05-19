import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SelectedElement } from '../types'
import { EdgeDetail } from './edge-detail'
import { NodeDetail } from './node-detail'

interface GraphSidePanelProps {
  selectedElement: SelectedElement | null
  onClose: () => void
  onNodeNavigate: (nodeId: string) => void
}

function GraphSidePanelComponent({
  selectedElement,
  onClose,
  onNodeNavigate,
}: GraphSidePanelProps) {
  const { t } = useTranslation()

  if (!selectedElement) return null

  return (
    <div className="animate-in rounded-radius-xl shadow-elevation-high slide-in-from-right-4 absolute bottom-3 right-3 top-3 z-10 flex w-80 flex-col overflow-hidden border border-components-settings-rail-border bg-components-settings-rail-bg backdrop-blur duration-200">
      <div className="flex shrink-0 items-center justify-between border-b border-components-settings-rail-border px-4 py-3">
        <span className="text-sm font-semibold text-components-settings-rail-title">
          {selectedElement.type === 'node'
            ? t('knowledge.graph.panel.nodeDetails')
            : t('knowledge.graph.panel.edgeDetails')}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label={t('knowledge.graph.panel.close')}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
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
      </div>
    </div>
  )
}

export const GraphSidePanel = memo(GraphSidePanelComponent)
