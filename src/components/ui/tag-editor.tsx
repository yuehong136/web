import { useTranslation } from 'react-i18next'
import React, { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Button } from './button'
import { Tooltip } from './tooltip'

interface TagEditorProps {
  value?: string[]
  onChange?: (tags: string[]) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  tagClassName?: string
  maxTags?: number
  variant?: 'default' | 'info' | 'success' | 'warning'
}

const variantStyles = {
  default: {
    bg: 'var(--color-sunken)',
    text: 'var(--color-fg)',
    border: 'var(--color-line)',
  },
  info: {
    bg: 'var(--color-info-soft)',
    text: 'var(--color-info-fg)',
    border: 'var(--color-info-soft)',
  },
  success: {
    bg: 'var(--color-success-soft)',
    text: 'var(--color-success-fg)',
    border: 'var(--color-success-soft)',
  },
  warning: {
    bg: 'var(--color-warning-soft)',
    text: 'var(--color-warning-fg)',
    border: 'var(--color-warning-soft)',
  },
}

const TagEditor = React.forwardRef<HTMLDivElement, TagEditorProps>(
  (
    {
      value = [],
      onChange,
      disabled = false,
      placeholder = '输入后按回车添加...',
      className,
      tagClassName,
      maxTags,
      variant = 'default',
    },
    ref,
  ) => {
    const { t } = useTranslation()
    const [inputVisible, setInputVisible] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const styles = variantStyles[variant]

    useEffect(() => {
      if (inputVisible) {
        inputRef.current?.focus()
      }
    }, [inputVisible])

    const handleClose = (removedTag: string) => {
      if (disabled) return
      const newTags = value.filter((tag) => tag !== removedTag)
      onChange?.(newTags)
    }

    const showInput = () => {
      if (disabled) return
      if (maxTags && value.length >= maxTags) return
      setInputVisible(true)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
    }

    const handleInputConfirm = () => {
      if (disabled) return
      if (inputValue.trim()) {
        // 支持分号分隔多个标签
        const newTags = inputValue
          .split(/[;；]/)
          .map((tag) => tag.trim())
          .filter((tag) => tag && !value.includes(tag))

        if (maxTags) {
          const remaining = maxTags - value.length
          newTags.splice(remaining)
        }

        if (newTags.length > 0) {
          onChange?.([...value, ...newTags])
        }
      }
      setInputVisible(false)
      setInputValue('')
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleInputConfirm()
      } else if (e.key === 'Escape') {
        setInputVisible(false)
        setInputValue('')
      }
    }

    const canAddMore = !maxTags || value.length < maxTags

    return (
      <div ref={ref} className={cn('flex flex-wrap gap-2', className)}>
        {value.map((tag, index) => (
          <Tooltip key={`${tag}-${index}`} content={tag}>
            <div
              className={cn(
                'inline-flex items-center gap-space-xs rounded-radius-sm border border-dashed px-space-sm py-space-2xs text-xs leading-4 font-medium transition-colors',
                tagClassName,
              )}
              style={{
                backgroundColor: styles.bg,
                color: styles.text,
                borderColor: styles.border,
              }}
            >
              <span className="max-w-32 truncate">{tag}</span>
              {!disabled && (
                <button
                  type="button"
                  aria-label={t('common.remove')}
                  title={tag}
                  className="rounded-radius-sm opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-line-focus"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClose(tag)
                  }}
                >
                  <X className="size-icon-sm" />
                </button>
              )}
            </div>
          </Tooltip>
        ))}

        {inputVisible ? (
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputConfirm}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-7 w-32 text-xs"
            disabled={disabled}
          />
        ) : (
          canAddMore &&
          !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={showInput}
              className="h-7 border border-dashed px-2"
              style={{
                borderColor: 'var(--color-line)',
                color: 'var(--color-fg-muted)',
              }}
            >
              <Plus className="mr-1 h-3 w-3" />
              <span className="text-xs">{t('common.add')}</span>
            </Button>
          )
        )}
      </div>
    )
  },
)

TagEditor.displayName = 'TagEditor'

export { TagEditor }
export type { TagEditorProps }
