import { useTranslation } from 'react-i18next'

interface PropertyListProps {
  properties: Record<string, unknown>
}

export function PropertyList({ properties }: PropertyListProps) {
  const { t } = useTranslation()
  const entries = Object.entries(properties).filter(
    ([key]) => !['rank', 'weight', 'communities'].includes(key),
  )

  if (entries.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {t('knowledge.graph.panel.properties')}
      </h4>
      <div className="space-y-1.5">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="rounded-radius-md flex items-start justify-between gap-2 border border-components-card-border bg-components-card-bg px-2 py-1.5 text-sm"
          >
            <span className="shrink-0 font-medium text-text-secondary">
              {key}
            </span>
            <span className="break-all text-right text-text-primary">
              {typeof value === 'object'
                ? JSON.stringify(value)
                : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
