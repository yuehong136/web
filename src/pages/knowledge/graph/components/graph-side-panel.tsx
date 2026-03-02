import React, { memo } from 'react'
import { X, Circle, ArrowRight, Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { SelectedElement } from '../types'
import { NODE_TYPE_PALETTE } from '../constants'

interface GraphSidePanelProps {
  selectedElement: SelectedElement | null
  onClose: () => void
  onNodeNavigate: (nodeId: string) => void
}

function getTypeColor(type: string): string {
  const hash = type.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return NODE_TYPE_PALETTE[hash % NODE_TYPE_PALETTE.length]
}

const PropertyList: React.FC<{ properties: Record<string, unknown> }> = ({ properties }) => {
  const entries = Object.entries(properties).filter(
    ([key]) => !['rank', 'weight', 'communities'].includes(key),
  )
  if (entries.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
        属性
      </h4>
      <div className="space-y-1.5">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between items-start gap-2 py-1.5 px-2 rounded-md text-sm"
            style={{ backgroundColor: 'var(--color-background-subtle)' }}
          >
            <span className="shrink-0 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {key}
            </span>
            <span className="text-right break-all" style={{ color: 'var(--color-text-primary)' }}>
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const NodeDetail: React.FC<{
  element: Extract<SelectedElement, { type: 'node' }>
  onNodeNavigate: (nodeId: string) => void
}> = ({ element, onNodeNavigate }) => {
  const { data, neighbors, edges } = element
  const color = getTypeColor(data.type || 'default')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <h3
            className="text-base font-semibold leading-tight break-all"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {data.label}
          </h3>
        </div>
        {data.type && (
          <Badge variant="secondary">{data.type}</Badge>
        )}
      </div>

      {/* Description */}
      {data.properties?.description && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {data.properties.description}
        </p>
      )}

      {/* Properties */}
      <PropertyList properties={data.properties} />

      {/* Connected Edges */}
      {edges.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            关系 ({edges.length})
          </h4>
          <div className="space-y-1">
            {edges.map((edge) => (
              <div
                key={edge.id}
                className="flex items-center gap-1.5 py-1.5 px-2 rounded-md text-xs"
                style={{ backgroundColor: 'var(--color-background-subtle)' }}
              >
                <Link2 className="h-3 w-3 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                <span className="truncate" style={{ color: 'var(--color-text-secondary)' }}>
                  {edge.label || edge.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Neighbors */}
      {neighbors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            相邻节点 ({neighbors.length})
          </h4>
          <div className="space-y-1">
            {neighbors.map((n) => (
              <button
                key={n.id}
                className="w-full flex items-center gap-2 py-2 px-2.5 rounded-lg text-sm transition-colors cursor-pointer text-left"
                style={{ backgroundColor: 'var(--color-background-subtle)' }}
                onClick={() => onNodeNavigate(n.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-components-sidebar-item-bg-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-background-subtle)'
                }}
              >
                <Circle
                  className="h-2.5 w-2.5 shrink-0"
                  style={{ color: getTypeColor(n.type || 'default'), fill: getTypeColor(n.type || 'default') }}
                />
                <span className="truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {n.label}
                </span>
                {n.type && (
                  <span className="ml-auto text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {n.type}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const EdgeDetail: React.FC<{
  element: Extract<SelectedElement, { type: 'edge' }>
  onNodeNavigate: (nodeId: string) => void
}> = ({ element, onNodeNavigate }) => {
  const { data, source, target } = element

  return (
    <div className="space-y-5">
      {/* Relation visualization */}
      <div className="space-y-3">
        <div
          className="flex items-center gap-2 p-3 rounded-lg"
          style={{ backgroundColor: 'var(--color-background-subtle)' }}
        >
          {source && (
            <button
              className="text-sm font-medium truncate max-w-[100px] cursor-pointer underline-offset-2 hover:underline"
              style={{ color: 'var(--color-text-accent)' }}
              onClick={() => onNodeNavigate(source.id)}
            >
              {source.label}
            </button>
          )}
          <ArrowRight className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
          {target && (
            <button
              className="text-sm font-medium truncate max-w-[100px] cursor-pointer underline-offset-2 hover:underline"
              style={{ color: 'var(--color-text-accent)' }}
              onClick={() => onNodeNavigate(target.id)}
            >
              {target.label}
            </button>
          )}
        </div>
        {data.label && (
          <Badge variant="outline">{data.label}</Badge>
        )}
      </div>

      {/* Description */}
      {data.properties?.description && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {data.properties.description}
        </p>
      )}

      {/* Properties */}
      <PropertyList properties={data.properties} />
    </div>
  )
}

const GraphSidePanel: React.FC<GraphSidePanelProps> = ({
  selectedElement,
  onClose,
  onNodeNavigate,
}) => {
  if (!selectedElement) return null

  return (
    <div
      className="absolute top-3 right-3 bottom-3 w-80 rounded-xl overflow-hidden flex flex-col z-10 animate-in slide-in-from-right-4 duration-200"
      style={{
        backgroundColor: 'var(--color-background-default)',
        border: '1px solid var(--color-border-subtle)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Panel Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {selectedElement.type === 'node' ? '节点详情' : '关系详情'}
        </span>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {selectedElement.type === 'node' ? (
          <NodeDetail element={selectedElement} onNodeNavigate={onNodeNavigate} />
        ) : (
          <EdgeDetail element={selectedElement} onNodeNavigate={onNodeNavigate} />
        )}
      </div>
    </div>
  )
}

export default memo(GraphSidePanel)
export { GraphSidePanel }
