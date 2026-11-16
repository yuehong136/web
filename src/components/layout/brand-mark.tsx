import { Waves } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const TIDE_SIZES = {
  xs: 'size-5 rounded-radius-full [&_svg]:size-3',
  sm: 'size-7 rounded-radius-lg [&_svg]:size-icon-sm',
  md: 'size-8 rounded-radius-lg [&_svg]:size-icon-md',
} as const

/**
 * The tide mark: the wave glyph on the tide gradient. It is the brand tile and
 * the home greeting's mark, so it may carry the AI gradient; it is always
 * decorative.
 */
export const TideMark = ({
  size = 'sm',
  className,
}: {
  size?: keyof typeof TIDE_SIZES
  className?: string
}) => (
  <span
    aria-hidden="true"
    data-tide-mark
    className={cn(
      'flex shrink-0 items-center justify-center bg-ai-tide text-text-on-accent',
      TIDE_SIZES[size],
      className,
    )}
  >
    <Waves />
  </span>
)

/**
 * The product wordmark: the brand tile and name. The tile is decorative; the
 * name is the readable part, or pass `showName={false}` where a label sits
 * elsewhere.
 */
export const BrandMark = ({
  showName = true,
  className,
}: {
  showName?: boolean
  className?: string
}) => {
  const { t } = useTranslation()
  return (
    <span
      data-brand-mark
      className={cn('inline-flex min-w-0 items-center gap-space-sm', className)}
    >
      <TideMark />
      {showName ? (
        <span className="truncate text-base font-semibold tracking-tight text-text-primary">
          {t('layout.brandName')}
        </span>
      ) : null}
    </span>
  )
}
