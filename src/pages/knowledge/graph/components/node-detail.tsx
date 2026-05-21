import { useTranslation } from 'react-i18next'
import { Circle, Link2 } from 'lucide-react'
import { useIsDarkTheme } from '@/themes'
import type { ThemeMode } from '@/lib/design-tokens'
import { Badge } from '@/components/ui/badge'
import type { SelectedElement } from '../types'
import {
  getNodeColorStyle,
  getNodeIconStyle,
  getTypeColor,
} from './graph-node-colors'
import { PropertyList } from './property-list'

interface NodeDetailProps {
  element: Extract<SelectedElement, { type: 'node' }>
  onNodeNavigate: (nodeId: string) => void
}

export function NodeDetail({ element, onNodeNavigate }: NodeDetailProps) {
  const { t } = useTranslation()
  const theme: ThemeMode = useIsDarkTheme() ? 'dark' : 'light'
  const { data, neighbors, edges } = element
  const color = getTypeColor(data.type || 'default', theme)

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="rounded-radius-full size-3 shrink-0"
            style={getNodeColorStyle(color)}
          />
          <h3 className="break-all text-base font-semibold leading-tight text-text-primary">
            {data.label}
          </h3>
        </div>
        {data.type && <Badge variant="secondary">{data.type}</Badge>}
      </div>

      {data.properties?.description && (
        <p className="text-sm leading-relaxed text-text-secondary">
          {data.properties.description}
        </p>
      )}

      <PropertyList properties={data.properties} />

      {edges.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t('knowledge.graph.panel.relations', { count: edges.length })}
          </h4>
          <div className="space-y-1">
            {edges.map((edge) => (
              <div
                key={edge.id}
                className="rounded-radius-md flex items-center gap-1.5 border border-components-card-border bg-components-card-bg px-2 py-1.5 text-xs"
              >
                <Link2 className="size-3 shrink-0 text-text-muted" />
                <span className="truncate text-text-secondary">
                  {edge.label || edge.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {neighbors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t('knowledge.graph.panel.neighbors', {
              count: neighbors.length,
            })}
          </h4>
          <div className="space-y-1">
            {neighbors.map((node) => (
              <button
                key={node.id}
                type="button"
                className="rounded-radius-lg flex w-full cursor-pointer items-center gap-2 border border-components-card-border bg-components-card-bg px-2.5 py-2 text-left text-sm transition-colors hover:bg-components-card-bg-hover"
                onClick={() => onNodeNavigate(node.id)}
              >
                <Circle
                  className="size-2.5 shrink-0"
                  style={getNodeIconStyle(
                    getTypeColor(node.type || 'default', theme),
                  )}
                />
                <span className="truncate text-text-primary">{node.label}</span>
                {node.type && (
                  <span className="ml-auto shrink-0 text-xs text-text-muted">
                    {node.type}
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
