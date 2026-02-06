import React, { useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 最大高度（px），超出后显示滚动条 */
  maxHeight?: number
}

/**
 * 自动扩展高度的 Textarea
 * - 默认单行高度，随内容自动增长
 * - 超过 maxHeight 后显示滚动条
 * - 使用设计令牌系统的 Input 样式
 */
export const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(({ className, maxHeight = 120, value, onChange, onFocus, onBlur, style, ...props }, ref) => {
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef
  const [isFocused, setIsFocused] = React.useState(false)

  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    // 重置高度以获取准确的 scrollHeight
    el.style.height = 'auto'
    const newHeight = Math.min(el.scrollHeight, maxHeight)
    el.style.height = `${newHeight}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [maxHeight, textareaRef])

  useEffect(() => {
    resize()
  }, [value, resize])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e)
    resize()
  }

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false)
    onBlur?.(e)
  }

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      rows={1}
      className={cn(
        "flex w-full rounded-xl border px-4 py-2 text-sm",
        "focus:ring-0 focus-visible:ring-0 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors resize-none leading-normal",
        className
      )}
      style={{
        backgroundColor: isFocused
          ? 'var(--color-components-input-bg-focus)'
          : 'var(--color-components-input-bg)',
        borderColor: isFocused
          ? 'var(--color-components-input-border-focus)'
          : 'var(--color-components-input-border)',
        color: 'var(--color-components-input-text)',
        minHeight: '36px',
        ...style,
      }}
      {...props}
    />
  )
})

AutoResizeTextarea.displayName = 'AutoResizeTextarea'
