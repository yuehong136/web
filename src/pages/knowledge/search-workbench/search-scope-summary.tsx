import { useTranslation } from 'react-i18next'
import { ComparisonOperators } from '@/components/chat/MetadataFilter'
import { toRetrievalOperator } from './adapters/metadata-filter'
import type { RetrievalDocAgg, SearchRequestScope } from './types'

interface SearchScopeSummaryProps {
  scope: SearchRequestScope
  docOptions: RetrievalDocAgg[]
}

export function SearchScopeSummary({
  scope,
  docOptions,
}: SearchScopeSummaryProps) {
  const { t } = useTranslation()
  const metadata = scope.metadata
  const operatorLabel = (op: string) => {
    const option = ComparisonOperators.find(
      (item) => toRetrievalOperator(item.value) === op,
    )
    return option ? t(option.labelKey) : op
  }
  const docNames = scope.docIds.map(
    (id) => docOptions.find((doc) => doc.doc_id === id)?.doc_name ?? id,
  )
  return (
    <div
      className="mt-space-sm space-y-space-xs text-xs break-words text-text-secondary"
      aria-label={t('knowledge.search.scope.title')}
    >
      <p className="font-medium">{t('knowledge.search.scope.title')}</p>
      <p>
        {docNames.length
          ? t('knowledge.search.scope.documents', {
              count: docNames.length,
              names: docNames.join(', '),
            })
          : t('knowledge.search.scope.allDocuments')}
      </p>
      <p>
        {t('knowledge.search.thresholdSummary', {
          value: scope.similarityThreshold,
        })}
      </p>
      {!metadata && <p>{t('knowledge.search.scope.metadataDisabled')}</p>}
      {metadata?.method === 'auto' && (
        <p>{t('knowledge.search.scope.metadataAuto')}</p>
      )}
      {metadata?.method === 'semi_auto' && (
        <p>
          {t('knowledge.search.scope.metadataSemiAuto', {
            fields: metadata.semi_auto
              ?.map((field) =>
                typeof field === 'string'
                  ? field
                  : `${field.key} (${field.op ? operatorLabel(field.op) : t('knowledge.search.metadataFilter.autoOperator')})`,
              )
              .join(', '),
          })}
        </p>
      )}
      {metadata?.method === 'manual' && (
        <div>
          <p>
            {t('knowledge.search.scope.metadataManual', {
              logic: t(
                `knowledge.search.metadataFilter.${metadata.logic ?? 'and'}`,
              ),
            })}
          </p>
          <ul className="space-y-space-xs">
            {metadata.manual?.map((condition, index) => (
              <li key={index}>
                {condition.key} · {operatorLabel(condition.op)}{' '}
                {condition.value}
              </li>
            ))}
          </ul>
        </div>
      )}
      {docNames.length > 0 && metadata && (
        <p>{t('knowledge.search.scope.intersection')}</p>
      )}
    </div>
  )
}
