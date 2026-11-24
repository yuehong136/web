import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  messageMemoryOperationHref,
  parseMessageMemoryOutput,
} from '@/pages/agent/adapters/message-memory-operations'

const needsAttention = (state: string) =>
  state === 'unknown' || state === 'failed'

export function MessageMemoryOperations({
  output,
  componentType,
}: {
  output: unknown
  componentType?: string
}) {
  const { t } = useTranslation()
  const result = parseMessageMemoryOutput(output, componentType)
  if (!result) return null
  return (
    <section className="min-w-0 space-y-space-sm rounded-radius-lg border border-line p-space-base">
      <h3 className="text-sm font-semibold">{t('flow.memoryTrace.title')}</h3>
      <p className="text-xs text-fg-muted">
        {t('flow.memoryTrace.description')}
      </p>
      {result.hasError && (
        <Alert variant="warning">{t('flow.memoryTrace.error')}</Alert>
      )}
      {result.invalidMetadata && (
        <Alert variant="warning">{t('flow.memoryTrace.invalid')}</Alert>
      )}
      {!result.operations.length && (
        <p className="text-sm text-fg-muted">
          {t('flow.memoryTrace.noHandle')}
        </p>
      )}
      <ul className="min-w-0 space-y-space-sm">
        {result.operations.map((operation) => (
          <li
            key={`${operation.memoryId}/${operation.operationId}`}
            className="min-w-0 space-y-space-sm rounded-radius-md border border-line-subtle p-space-sm"
          >
            <Badge
              tone={needsAttention(operation.state) ? 'warning' : 'neutral'}
              variant={needsAttention(operation.state) ? 'soft' : 'outline'}
              className="max-w-full whitespace-normal"
            >
              {t(`flow.memoryTrace.${operation.state}`)}
            </Badge>
            <dl className="min-w-0 space-y-space-xs text-xs">
              <dt className="text-fg-muted">{t('flow.memoryTrace.bank')}</dt>
              <dd className="font-mono break-all">{operation.memoryId}</dd>
              <dt className="text-fg-muted">
                {t('flow.memoryTrace.operation')}
              </dt>
              <dd className="font-mono break-all">{operation.operationId}</dd>
              {operation.sourceId && (
                <>
                  <dt className="text-fg-muted">
                    {t('flow.memoryTrace.source')}
                  </dt>
                  <dd className="font-mono break-all">{operation.sourceId}</dd>
                </>
              )}
            </dl>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-auto max-w-full whitespace-normal"
            >
              <Link to={messageMemoryOperationHref(operation)}>
                {t('flow.memoryTrace.open')}
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
