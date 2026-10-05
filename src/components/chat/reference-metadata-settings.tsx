import { useId } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { knowledgeMetadataAPI } from '@/api/knowledge-metadata'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { MultiSelectWithSearch } from '@/components/ui/multi-select-with-search'
import type { ReferenceMetadataConfig } from '@/types/reference-metadata'

export function ReferenceMetadataSettings({
  datasetIds,
  value = {},
  onChange,
}: {
  datasetIds: string[]
  value?: ReferenceMetadataConfig
  onChange: (value: ReferenceMetadataConfig) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const ids = [...new Set(datasetIds)].sort()
  const {
    data = [],
    isError,
    isPending,
  } = useQuery({
    queryKey: ['metadata', 'keys', ids],
    queryFn: () => knowledgeMetadataAPI.getKeys(ids),
    enabled: ids.length > 0,
  })
  // Retain selected keys when datasets change or a key is currently absent.
  const keys = [...new Set([...data, ...(value.fields ?? [])])].sort()
  const all = value.fields == null
  return (
    <div className="space-y-space-sm">
      <div className="flex items-center justify-between gap-space-sm">
        <Label htmlFor={id}>{t('common.referenceMetadata.include')}</Label>
        <Switch
          id={id}
          checked={value.include ?? false}
          onCheckedChange={(include) => onChange({ ...value, include })}
        />
      </div>
      {value.include && (
        <>
          <p className="text-xs text-text-secondary">
            {t('common.referenceMetadata.hint')}
          </p>
          <div className="flex items-center justify-between gap-space-sm">
            <Label htmlFor={`${id}-all`}>
              {t('common.referenceMetadata.all')}
            </Label>
            <Switch
              id={`${id}-all`}
              checked={all}
              onCheckedChange={(checked) =>
                onChange({ ...value, fields: checked ? null : [] })
              }
            />
          </div>
          {!all && (
            <MultiSelectWithSearch
              options={keys.map((key) => ({ label: key, value: key }))}
              value={value.fields ?? []}
              onChange={(fields) => onChange({ ...value, fields })}
              allowClear
              placeholder={t('common.referenceMetadata.none')}
              emptyText={t('common.referenceMetadata.empty')}
              disabled={ids.length > 0 && isPending}
            />
          )}
          {isError && (
            <p role="alert" className="text-xs text-status-error">
              {t('common.referenceMetadata.error')}
            </p>
          )}
        </>
      )}
    </div>
  )
}
