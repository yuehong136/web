import { Waves } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

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
      <span
        aria-hidden="true"
        className="flex size-7 shrink-0 items-center justify-center rounded-radius-lg bg-components-button-primary-bg text-components-button-primary-text"
      >
        <Waves className="size-icon-sm" />
      </span>
      {showName ? (
        <span className="truncate text-base font-semibold tracking-tight text-text-primary">
          {t('layout.brandName')}
        </span>
      ) : null}
    </span>
  )
}
