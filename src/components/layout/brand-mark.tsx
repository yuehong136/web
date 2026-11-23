import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { BrandGlyph } from './brand-glyph'

/**
 * The product wordmark: the 承 glyph and the name. The glyph is decorative;
 * the name is the readable part, or pass `showName={false}` where a label sits
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
      className={cn(
        'inline-flex min-w-0 items-center gap-[0.36em] text-base text-fg',
        className,
      )}
    >
      <BrandGlyph className="size-[1.15em]" />
      {showName ? (
        <span className="truncate font-semibold tracking-tight">
          {t('layout.brandName')}
        </span>
      ) : null}
    </span>
  )
}
