import React from 'react'
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
  className
}) => {
  return (
    <div className={cn("flex items-center space-x-3 text-sm", className)} style={{ color: 'var(--color-components-pagination-text)' }}>
      <span>每页显示</span>
      <div className="flex items-center rounded-lg p-1" style={{ backgroundColor: 'var(--color-components-pagination-bg)', border: '1px solid var(--color-components-pagination-border)' }}>
        {options.map((size) => (
          <button
            key={size}
            onClick={() => onChange(size)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              pageSize === size && "shadow-sm"
            )}
            style={{
              backgroundColor: pageSize === size 
                ? 'var(--color-components-pagination-item-bg-active)' 
                : 'var(--color-components-pagination-item-bg)',
              color: pageSize === size 
                ? 'var(--color-components-pagination-item-text-active)'
                : 'var(--color-components-pagination-item-text)'
            }}
            onMouseEnter={(e) => {
              if (pageSize !== size) {
                e.currentTarget.style.backgroundColor = 'var(--color-components-pagination-item-bg-hover)'
              }
            }}
            onMouseLeave={(e) => {
              if (pageSize !== size) {
                e.currentTarget.style.backgroundColor = 'var(--color-components-pagination-item-bg)'
              }
            }}
          >
            {size}
          </button>
        ))}
      </div>
      <span>项</span>
    </div>
  )
}