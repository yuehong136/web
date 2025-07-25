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
    <div className={cn("flex items-center space-x-3 text-sm text-gray-600", className)}>
      <span>每页显示</span>
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        {options.map((size) => (
          <button
            key={size}
            onClick={() => onChange(size)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              pageSize === size
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            {size}
          </button>
        ))}
      </div>
      <span>项</span>
    </div>
  )
}