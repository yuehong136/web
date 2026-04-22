import { cn } from '@/lib/utils'
import { useMemo, type PropsWithChildren } from 'react'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { resolveLLMValue } from '@/stores/model'
import { ProviderIcon } from '@/components/ui/provider-icon'

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

export function LLMLabelCard({ llmId }: { llmId?: string }) {
  const { myLLMs } = useFetchMyLLMs()
  const resolvedLlm = useMemo(
    () => resolveLLMValue(myLLMs, llmId, false),
    [llmId, myLLMs],
  )
  const isInvalidLlm = Boolean(llmId) && !resolvedLlm.matched
  const displayName = resolvedLlm.modelName || llmId || 'Default LLM'

  return (
    <LabelCard
      className={cn(
        'flex items-center gap-space-sm',
        isInvalidLlm && 'border-status-error bg-status-error/10 text-status-error',
      )}
    >
      <ProviderIcon
        provider={resolvedLlm.providerName || ''}
        className="size-4 shrink-0"
        size={16}
      />
      <span className="min-w-0 flex-1 truncate">
        {displayName}
      </span>
    </LabelCard>
  )
}
