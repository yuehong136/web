import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/spinner'
import type { RAGFlowNodeType } from '../../../types'
import {
  legacyFormRenderers,
  migratedFormRenderers,
} from './form-renderer-registry'

interface FormRendererProps {
  node?: RAGFlowNodeType
  rendererKey?: string
  operatorType?: string
}

export function FormRenderer({
  node,
  rendererKey,
  operatorType,
}: FormRendererProps) {
  const { t } = useTranslation()

  if (!node) {
    return null
  }

  const FormComponent = rendererKey
    ? migratedFormRenderers[rendererKey] || legacyFormRenderers[rendererKey]
    : null

  if (!FormComponent) {
    return (
      <div className="space-y-space-md p-space-base">
        <div className="rounded-radius-md border border-line bg-sunken p-space-base">
          <div className="text-sm font-medium text-fg">
            {t('agent.runtimePanel.formSheet.unsupportedTitle')}
          </div>
          <p className="mt-space-xs text-sm text-fg-muted">
            {t('agent.runtimePanel.formSheet.unsupportedDescription', {
              type: operatorType || 'unknown',
            })}
          </p>
        </div>
        <pre className="max-h-[24rem] overflow-auto rounded-radius-md border border-line bg-sunken p-space-base text-xs text-fg-muted">
          {JSON.stringify(node.data?.form || {}, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <output
          className="flex items-center justify-center gap-space-sm p-space-lg text-sm text-fg-muted"
          aria-live="polite"
        >
          <Spinner size="sm" />
          {t('common.loading')}
        </output>
      }
    >
      <FormComponent node={node} nodeId={node.id} />
    </Suspense>
  )
}
