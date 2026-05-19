import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { SelectedElement } from '../types'
import { PropertyList } from './property-list'

interface EdgeDetailProps {
  element: Extract<SelectedElement, { type: 'edge' }>
  onNodeNavigate: (nodeId: string) => void
}

export function EdgeDetail({ element, onNodeNavigate }: EdgeDetailProps) {
  const { data, source, target } = element

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="rounded-radius-lg flex items-center gap-2 border border-components-card-border bg-components-card-bg p-3">
          {source && (
            <button
              type="button"
              className="max-w-[100px] cursor-pointer truncate text-sm font-medium text-text-accent underline-offset-2 hover:underline"
              onClick={() => onNodeNavigate(source.id)}
            >
              {source.label}
            </button>
          )}
          <ArrowRight className="size-4 shrink-0 text-text-muted" />
          {target && (
            <button
              type="button"
              className="max-w-[100px] cursor-pointer truncate text-sm font-medium text-text-accent underline-offset-2 hover:underline"
              onClick={() => onNodeNavigate(target.id)}
            >
              {target.label}
            </button>
          )}
        </div>
        {data.label && <Badge variant="outline">{data.label}</Badge>}
      </div>

      {data.properties?.description && (
        <p className="text-sm leading-relaxed text-text-secondary">
          {data.properties.description}
        </p>
      )}

      <PropertyList properties={data.properties} />
    </div>
  )
}
