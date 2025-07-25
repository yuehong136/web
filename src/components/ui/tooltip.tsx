import React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  delayHide?: number // 延迟隐藏时间(ms)
  maxWidth?: string // 自定义最大宽度
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className,
  delayHide = 300,
  maxWidth = 'max-w-md'
}) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const [tooltipPosition, setTooltipPosition] = React.useState({ top: 0, left: 0 })
  const hideTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const triggerRef = React.useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setIsVisible(true)
    
    // 计算tooltip位置
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const scrollY = window.scrollY
      const scrollX = window.scrollX
      
      let top = 0
      let left = 0
      
      switch (position) {
        case 'top':
          top = rect.top + scrollY - 10
          left = rect.left + scrollX + rect.width / 2
          break
        case 'bottom':
          top = rect.bottom + scrollY + 10
          left = rect.left + scrollX + rect.width / 2
          break
        case 'left':
          top = rect.top + scrollY + rect.height / 2
          left = rect.left + scrollX - 10
          break
        case 'right':
          top = rect.top + scrollY + rect.height / 2
          left = rect.right + scrollX + 10
          break
      }
      
      setTooltipPosition({ top, left })
    }
  }

  const hideTooltip = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, delayHide)
  }

  const cancelHide = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }

  React.useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  const getTransform = () => {
    switch (position) {
      case 'top':
        return 'translate(-50%, -100%)'
      case 'bottom':
        return 'translate(-50%, 0%)'
      case 'left':
        return 'translate(-100%, -50%)'
      case 'right':
        return 'translate(0%, -50%)'
      default:
        return 'translate(-50%, -100%)'
    }
  }

  return (
    <>
      <div 
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          onMouseEnter={cancelHide}
          onMouseLeave={hideTooltip}
          className={cn(
            'fixed z-[9999] px-4 py-3 text-sm bg-white border border-gray-200 rounded-lg shadow-xl',
            'animate-in fade-in-0 zoom-in-95 duration-200 text-gray-900',
            typeof content === 'string' ? 'whitespace-nowrap' : maxWidth,
            className
          )}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform: getTransform(),
          }}
        >
          {content}
          
          {/* 箭头 */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-white border-gray-200 transform rotate-45',
              position === 'top' && 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2 border-r border-b',
              position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 border-l border-t',
              position === 'left' && 'left-full top-1/2 -translate-y-1/2 translate-x-1/2 border-t border-r',
              position === 'right' && 'right-full top-1/2 -translate-y-1/2 -translate-x-1/2 border-b border-l'
            )}
          />
        </div>
      )}
    </>
  )
}