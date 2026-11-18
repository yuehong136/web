import { ProviderIcon } from '@/components/ui/provider-icon'
import { cn } from '@/lib/utils'

const SIZES = {
  xs: { tile: 'size-4.5 rounded-radius-sm', icon: 'size-3', px: 12 },
  sm: { tile: 'size-5.5 rounded-radius-sm', icon: 'size-3.5', px: 14 },
  md: { tile: 'size-7 rounded-radius-md', icon: 'size-4.5', px: 18 },
  lg: { tile: 'size-10 rounded-radius-lg', icon: 'size-6', px: 24 },
} as const

export type ProviderLogoSize = keyof typeof SIZES

export interface ProviderLogoProps {
  /** Provider (factory) name, e.g. "OpenAI", "Tongyi-Qianwen". */
  provider: string
  size?: ProviderLogoSize
  /**
   * Seats the logo on a neutral tile so colored and single-color logos read
   * the same in both themes. Turn off inside dense text runs.
   */
  tile?: boolean
  className?: string
}

/**
 * A provider's brand logo. Color logos keep their colors; single-color ones
 * follow the text color. Brand marks are not UI icons, so they never come
 * from the UI icon set.
 */
export function ProviderLogo({
  provider,
  size = 'md',
  tile = true,
  className,
}: ProviderLogoProps) {
  const spec = SIZES[size]
  const icon = (
    <ProviderIcon provider={provider} className={spec.icon} size={spec.px} />
  )
  if (!tile)
    return (
      <span
        data-slot="provider-logo"
        className={cn('inline-flex shrink-0', className)}
      >
        {icon}
      </span>
    )
  return (
    <span
      data-slot="provider-logo"
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-sunken text-fg ring-1 ring-line-subtle ring-inset',
        spec.tile,
        className,
      )}
    >
      {icon}
    </span>
  )
}
