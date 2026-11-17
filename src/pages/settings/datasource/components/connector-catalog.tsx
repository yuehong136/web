import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { DataSourceGroups } from '../constants'
import {
  DataSourceKey,
  type IDataSourceInfo,
  type IDataSourceInfoMap,
} from '../types'
import { ConnectorLogo } from './connector-logo'

type GroupKey = keyof typeof DataSourceGroups

const GROUP_ORDER: GroupKey[] = [
  'storage',
  'collaboration',
  'codeRepository',
  'database',
  'communication',
]

/** Connector types by group; types missing from every group join the last. */
export function groupConnectorTypes(): {
  key: GroupKey
  ids: DataSourceKey[]
}[] {
  const grouped = new Set<DataSourceKey>(Object.values(DataSourceGroups).flat())
  const rest = Object.values(DataSourceKey).filter((id) => !grouped.has(id))
  return GROUP_ORDER.map((key, index) => ({
    key,
    ids: [
      ...DataSourceGroups[key],
      ...(index === GROUP_ORDER.length - 1 ? rest : []),
    ],
  }))
}

function ConnectorTile({
  source,
  onAdd,
}: {
  source: IDataSourceInfo
  onAdd: () => void
}) {
  const { t } = useTranslation()
  const descriptionId = useId()
  return (
    <li className="min-w-0">
      <button
        type="button"
        aria-label={t('datasource.addNamed', { name: source.name })}
        aria-describedby={source.description ? descriptionId : undefined}
        onClick={onAdd}
        className="group flex h-full w-full min-w-0 items-center gap-space-sm rounded-radius-lg border border-border-subtle bg-background-surface p-space-sm text-left outline-hidden transition-[border-color,box-shadow,transform] duration-150 hover:border-border-strong hover:shadow-elevation-medium focus-visible:ring-2 focus-visible:ring-state-focus motion-safe:hover:-translate-y-px"
      >
        <ConnectorLogo icon={source.icon} size="lg" />
        <span className="flex min-w-0 flex-1 flex-col gap-space-2xs">
          <span className="truncate text-sm font-medium text-text-primary">
            {source.name}
          </span>
          {source.description ? (
            <span
              id={descriptionId}
              className="line-clamp-2 text-xs text-text-tertiary"
            >
              {source.description}
            </span>
          ) : null}
        </span>
        <Plus
          aria-hidden="true"
          className="size-icon-sm shrink-0 text-text-tertiary transition-colors group-hover:text-text-primary"
        />
      </button>
    </li>
  )
}

/**
 * Every connector type that can be added, grouped by what it connects to. A
 * tile opens the add dialog for its type.
 */
export function ConnectorCatalog({
  info,
  onAdd,
}: {
  info: IDataSourceInfoMap
  onAdd: (source: IDataSourceInfo) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-space-lg">
      {groupConnectorTypes().map((group) => {
        const items = group.ids
          .filter((id) => info[id])
          .map((id) => ({ id, ...info[id] }))
        if (items.length === 0) return null
        const label = t(`datasource.groups.${group.key}`)
        return (
          <div key={group.key} className="flex flex-col gap-space-sm">
            <h4 className="text-xs font-medium text-text-tertiary">
              {label}
              <span className="ms-space-xs tabular-nums">{items.length}</span>
            </h4>
            <ul
              aria-label={label}
              data-connector-group={group.key}
              className="grid grid-cols-[repeat(auto-fill,minmax(min(15rem,100%),1fr))] gap-space-sm"
            >
              {items.map((source) => (
                <ConnectorTile
                  key={source.id}
                  source={source}
                  onAdd={() => onAdd(source)}
                />
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
