import { cn } from '@/lib/utils'
import { useMemo, type PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Cpu } from 'lucide-react'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { resolveLLMValue } from '@/stores/model'
import { ProviderLogo } from '@/components/patterns/provider-logo'

type LabelCardProps = {
  className?: string
} & PropsWithChildren &
  React.HTMLAttributes<HTMLElement>

export function LabelCard({ children, className, ...props }: LabelCardProps) {
  return (
    <div
      className={cn(
        'rounded-radius-md border border-border-subtle bg-background-subtle px-space-sm py-space-xs text-xs leading-5 text-text-secondary',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/** The node's model: provider logo and name; a missing model reads as an error. */
export function LLMLabelCard({ llmId }: { llmId?: string }) {
  const { t } = useTranslation()
  const { myLLMs } = useFetchMyLLMs()
  const resolvedLlm = useMemo(
    () => resolveLLMValue(myLLMs, llmId, false),
    [llmId, myLLMs],
  )
  const isInvalidLlm = Boolean(llmId) && !resolvedLlm.matched
  const displayName =
    resolvedLlm.modelName || llmId || t('agent.canvas.defaultModel')

  return (
    <LabelCard
      className={cn(
        'flex items-center gap-space-sm',
        isInvalidLlm &&
          'border-status-error-border bg-status-error-subtle text-status-error',
      )}
      title={isInvalidLlm ? t('agent.canvas.modelUnavailable') : displayName}
    >
      {resolvedLlm.providerName ? (
        <ProviderLogo provider={resolvedLlm.providerName} size="xs" />
      ) : (
        <Cpu aria-hidden className="size-icon-xs shrink-0 text-text-tertiary" />
      )}
      <span
        className={cn(
          'min-w-0 flex-1 truncate',
          !isInvalidLlm && 'text-text-primary',
        )}
      >
        {displayName}
      </span>
    </LabelCard>
  )
}
