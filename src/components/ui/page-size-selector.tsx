import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface PageSizeSelectorProps {
  pageSize: number
  onChange: (size: number) => void
  options?: number[]
  className?: string
}

export const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  pageSize,
  onChange,
  options = [10, 20, 30, 50],
  className,
}) => {
  const { t } = useTranslation()
  return (
    <div
      className={cn('flex items-center space-x-3 text-sm', className)}
      style={{ color: 'var(--color-fg-muted)' }}
    >
      <span>{t('common.pagination.pageSizePrefix', 'Items per page')}</span>
      <div
        className="flex items-center rounded-lg p-1"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-line)',
        }}
      >
        {options.map((size) => (
          <button
            key={size}
            onClick={() => onChange(size)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              pageSize === size && 'shadow-xs',
            )}
            style={{
              backgroundColor:
                pageSize === size
                  ? 'var(--color-fill-selected)'
                  : 'var(--color-surface)',
              color:
                pageSize === size ? 'var(--color-fg)' : 'var(--color-fg-muted)',
            }}
            onMouseEnter={(e) => {
              if (pageSize !== size) {
                e.currentTarget.style.backgroundColor =
                  'var(--color-fill-hover)'
              }
            }}
            onMouseLeave={(e) => {
              if (pageSize !== size) {
                e.currentTarget.style.backgroundColor = 'var(--color-surface)'
              }
            }}
          >
            {size}
          </button>
        ))}
      </div>
      <span>{t('common.pagination.pageSizeSuffix', 'items')}</span>
    </div>
  )
}
