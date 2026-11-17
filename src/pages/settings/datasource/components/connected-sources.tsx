import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Settings2, Trash2 } from 'lucide-react'
import { ResourceCard, ResourceGrid } from '@/components/patterns/resource-card'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { DataSourceStatusDot } from '../detail/status-display'
import type { IDataSource, IDataSourceInfoMap } from '../types'
import { ConnectorLogo } from './connector-logo'

export const dataSourceDetailPath = (id: string) =>
  `/settings/datasource-detail?id=${encodeURIComponent(id)}`

/**
 * Connected sources as identity cards: the connector's logo tile, the
 * connection name, its type and sync status. The card opens the source's
 * settings; the settings link and delete stay separately reachable.
 */
export function ConnectedSources({
  sources,
  info,
  onDelete,
}: {
  sources: IDataSource[]
  info: IDataSourceInfoMap
  onDelete: (source: IDataSource, returnFocus: HTMLElement) => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <ResourceGrid label={t('datasource.addedSources')} className="p-0">
      {sources.map((source) => {
        const type = info[source.source]
        const settingsLabel = t('datasource.settingsNamed', {
          name: source.name,
        })
        const deleteLabel = t('datasource.deleteNamed', { name: source.name })
        return (
          <ResourceCard
            key={source.id}
            name={source.name}
            leading={<ConnectorLogo icon={type.icon} size="lg" />}
            eyebrow={type.name}
            status={<DataSourceStatusDot status={source.status} />}
            onOpen={() => navigate(dataSourceDetailPath(source.id))}
            actions={
              <>
                <Tooltip content={settingsLabel} asChild>
                  <Button asChild variant="ghost" size="icon-sm">
                    <Link
                      to={dataSourceDetailPath(source.id)}
                      aria-label={settingsLabel}
                    >
                      <Settings2 className="size-icon-sm" aria-hidden="true" />
                    </Link>
                  </Button>
                </Tooltip>
                <Tooltip content={deleteLabel} asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={deleteLabel}
                    onClick={(event) => onDelete(source, event.currentTarget)}
                  >
                    <Trash2 className="size-icon-sm" aria-hidden="true" />
                  </Button>
                </Tooltip>
              </>
            }
          />
        )
      })}
    </ResourceGrid>
  )
}
