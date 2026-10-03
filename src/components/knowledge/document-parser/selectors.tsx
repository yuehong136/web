import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '@/components/ui'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { useDocumentParserPipelines } from '@/hooks/use-document-parser-pipelines'
import { resolveLocalizedText } from '@/lib/agent'
import {
  DOCUMENT_PARSER_TYPE_LABELS,
  DocumentParserType,
} from '@/types/document-parser'
import type { Document } from '@/types/api'
import { requiredSourceParser } from './draft'

const prefix = 'knowledge.documents.chunkMethodModal.'

export function ParserModeSelector({
  value,
  onChange,
  disabled,
}: {
  value: 1 | 2
  onChange: (value: 1 | 2) => void
  disabled: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-space-sm">
      <div className="text-sm font-medium text-text-primary">
        {t(`${prefix}parseMethod`)}
      </div>
      <RadioGroup
        value={String(value)}
        onValueChange={(value) => onChange(Number(value) as 1 | 2)}
        disabled={disabled}
        className="flex gap-space-lg"
      >
        {[1, 2].map((mode) => (
          <label key={mode} className="flex items-center gap-space-xs">
            <RadioGroupItem value={String(mode)} />
            <span>
              {t(`${prefix}${mode === 1 ? 'builtin' : 'selectPipeline'}`)}
            </span>
          </label>
        ))}
      </RadioGroup>
    </div>
  )
}

export function DocumentBuiltinSelector({
  document,
  value,
  onChange,
  disabled,
}: {
  document: Document
  value: string
  onChange: (value: string) => void
  disabled: boolean
}) {
  const { t } = useTranslation()
  const required = requiredSourceParser(document)
  const options = Object.values(DocumentParserType).map((parser) => ({
    value: parser,
    label: DOCUMENT_PARSER_TYPE_LABELS[parser],
    disabled: !!required && required !== parser,
  }))
  return (
    <div className="space-y-space-sm">
      <SelectWithSearch
        value={value}
        onChange={onChange}
        options={options}
        disabled={disabled}
        placeholder={
          value === 'general' ? value : t(`${prefix}parserPlaceholder`)
        }
        emptyText={t(`${prefix}parserEmpty`)}
      />
      {required && (
        <p className="text-xs text-text-secondary">
          {t(`${prefix}sourceParserHint`)}
        </p>
      )}
    </div>
  )
}

export function DocumentPipelineSelector({
  value,
  onChange,
  datasetId,
  tenantId,
  actorKey,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  datasetId: string
  tenantId: string
  actorKey: number
  disabled: boolean
}) {
  const { t } = useTranslation()
  const [keywords, setKeywords] = useState('')
  const catalog = useDocumentParserPipelines({
    enabled: true,
    datasetId,
    tenantId,
    actorKey,
    keywords,
    selectedId: value,
  })
  const rows = [...catalog.rows]
  if (
    catalog.selectedRow &&
    !rows.some((row) => row.id === catalog.selectedRow?.id)
  )
    rows.unshift(catalog.selectedRow)
  const options = [
    ...new Map(
      rows.map((row) => [
        row.id,
        {
          value: row.id,
          label: resolveLocalizedText(
            row.title,
            t(`${prefix}untitledPipeline`),
          ),
        },
      ]),
    ).values(),
  ]
  return (
    <div className="space-y-space-sm">
      <Input
        value={keywords}
        onChange={(event) => setKeywords(event.target.value)}
        disabled={disabled}
        aria-label={t(`${prefix}pipelineSearch`)}
        placeholder={t(`${prefix}pipelineSearch`)}
      />
      <SelectWithSearch
        value={value}
        onChange={onChange}
        options={options}
        disabled={disabled || catalog.isPending}
        placeholder={t(`${prefix}pipelinePlaceholder`)}
        emptyText={t(`${prefix}pipelineEmpty`)}
      />
      {(catalog.isPending || catalog.selectedLoading) && (
        <p role="status">{t(`${prefix}pipelineLoading`)}</p>
      )}
      {catalog.isError && (
        <div role="alert" className="text-status-error">
          {t(`${prefix}pipelineError`)}{' '}
          <Button
            type="button"
            variant="outline"
            onClick={() => void catalog.refetch()}
          >
            {t('common.retry')}
          </Button>
        </div>
      )}
      {!catalog.isPending && !catalog.isError && !options.length && (
        <p>{t(`${prefix}pipelineEmpty`)}</p>
      )}
      {catalog.selectedUnavailable && (
        <p role="status" className="text-status-warning">
          {t(`${prefix}pipelineUnavailable`)} <span>{value}</span>
        </p>
      )}
      {catalog.hasNextPage && (
        <Button
          type="button"
          variant="outline"
          loading={catalog.isFetchingNextPage}
          onClick={() => void catalog.fetchNextPage()}
        >
          {t(`${prefix}pipelineMore`)}
        </Button>
      )}
      <p className="text-xs text-text-secondary">{t(`${prefix}pipelineTip`)}</p>
    </div>
  )
}
