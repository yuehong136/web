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
        'rounded-radius-md border border-line-subtle bg-sunken px-space-sm py-space-xs text-xs leading-5 text-fg-muted',
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
        isInvalidLlm && 'border-danger-line bg-danger-soft text-danger-fg',
      )}
      title={isInvalidLlm ? t('agent.canvas.modelUnavailable') : displayName}
    >
      {resolvedLlm.providerName ? (
        <ProviderLogo provider={resolvedLlm.providerName} size="xs" />
      ) : (
        <Cpu aria-hidden className="size-icon-xs shrink-0 text-fg-subtle" />
      )}
      <span
        className={cn('min-w-0 flex-1 truncate', !isInvalidLlm && 'text-fg')}
      >
        {displayName}
      </span>
    </LabelCard>
  )
}
