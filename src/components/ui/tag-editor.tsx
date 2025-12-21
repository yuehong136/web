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
    bg: 'var(--color-background-subtle)',
    text: 'var(--color-text-primary)',
    border: 'var(--color-border-default)',
  },
  info: {
    bg: 'var(--color-components-badge-info-bg)',
    text: 'var(--color-components-badge-info-text)',
    border: 'var(--color-components-badge-info-bg)',
  },
  success: {
    bg: 'var(--color-components-badge-success-bg)',
    text: 'var(--color-components-badge-success-text)',
    border: 'var(--color-components-badge-success-bg)',
  },
  warning: {
    bg: 'var(--color-components-badge-warning-bg)',
    text: 'var(--color-components-badge-warning-text)',
    border: 'var(--color-components-badge-warning-bg)',
  },
}

const TagEditor = React.forwardRef<HTMLDivElement, TagEditorProps>(
  ({ 
    value = [], 
    onChange, 
    disabled = false, 
    placeholder = '输入后按回车添加...', 
    className,
    tagClassName,
    maxTags,
    variant = 'default'
  }, ref) => {
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
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-dashed transition-colors',
                tagClassName
              )}
              style={{
                backgroundColor: styles.bg,
                color: styles.text,
                borderColor: styles.border,
              }}
            >
              <span className="max-w-32 truncate">{tag}</span>
              {!disabled && (
                <X
                  className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClose(tag)
                  }}
                />
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
          canAddMore && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={showInput}
              className="h-7 px-2 border border-dashed"
              style={{
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              <span className="text-xs">添加</span>
            </Button>
          )
        )}
      </div>
    )
  }
)

TagEditor.displayName = 'TagEditor'

export { TagEditor }
export type { TagEditorProps }

