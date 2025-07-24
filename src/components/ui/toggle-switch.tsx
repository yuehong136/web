import React from 'react'
import { cn } from '../../lib/utils'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
  description?: string
  className?: string
  leftLabel?: string  // 左侧标签，如 "禁用"
  rightLabel?: string // 右侧标签，如 "启用"
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  className,
  leftLabel,
  rightLabel
}) => {
  const sizeClasses = {
    sm: {
      switch: 'h-5 w-9',
      thumb: 'h-4 w-4',
      translate: 'translate-x-4'
    },
    md: {
      switch: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5'
    },
    lg: {
      switch: 'h-7 w-12',
      thumb: 'h-6 w-6',
      translate: 'translate-x-5'
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={cn('flex items-center', className)}>
      {leftLabel && (
        <span className={cn(
          'text-sm font-medium mr-3 transition-colors',
          checked ? 'text-gray-500' : 'text-gray-900'
        )}>
          {leftLabel}
        </span>
      )}
      
      <div className="flex flex-col">
        {label && (
          <label className="text-sm font-medium text-gray-900 mb-1">
            {label}
          </label>
        )}
        
        <button
          type="button"
          className={cn(
            'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            currentSize.switch,
            checked 
              ? 'bg-blue-600 shadow-md' 
              : 'bg-gray-200',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          role="switch"
          aria-checked={checked}
          onClick={() => !disabled && onChange(!checked)}
        >
          <span className="sr-only">
            {label || (checked ? '启用' : '禁用')}
          </span>
          
          {/* 滑块 */}
          <span
            className={cn(
              'pointer-events-none inline-block rounded-full bg-white shadow-lg transform ring-0 transition-transform duration-200 ease-in-out',
              currentSize.thumb,
              checked ? currentSize.translate : 'translate-x-0'
            )}
          >
            {/* 内部图标 */}
            <span
              className={cn(
                'absolute inset-0 flex items-center justify-center transition-opacity duration-100',
                checked ? 'opacity-0' : 'opacity-100'
              )}
            >
              <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                <path
                  d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            
            <span
              className={cn(
                'absolute inset-0 flex items-center justify-center transition-opacity duration-100',
                checked ? 'opacity-100' : 'opacity-0'
              )}
            >
              <svg className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 12 12">
                <path
                  d="M3.5 6L5 7.5L8.5 4"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
        </button>
        
        {description && (
          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        )}
      </div>
      
      {rightLabel && (
        <span className={cn(
          'text-sm font-medium ml-3 transition-colors',
          checked ? 'text-blue-600 font-semibold' : 'text-gray-500'
        )}>
          {rightLabel}
        </span>
      )}
    </div>
  )
}

export { ToggleSwitch } 