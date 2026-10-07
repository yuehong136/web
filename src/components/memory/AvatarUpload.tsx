/**
 * 头像上传组件
 * 用于记忆库的头像设置
 */

import { useRef, type ChangeEvent, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PenLine, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { EntityAvatar } from '@/components/patterns/entity-avatar'

interface AvatarUploadProps {
  /** 当前头像 URL 或 base64 */
  value?: string
  /** 头像变化回调，返回 base64 字符串 */
  onChange: (base64: string) => void
  /** 头像大小 */
  size?: 'sm' | 'md' | 'lg'
  /** 没有头像时用名称生成单字头像 */
  name?: string
  /** 头像色调的稳定种子（如记忆库 id），省略时使用名称 */
  seed?: string
  /** 提示文本 */
  tips?: string
  /** 是否禁用 */
  disabled?: boolean
}

const avatarSizes = {
  sm: { size: 'xl', className: undefined },
  md: { size: '2xl', className: undefined },
  lg: { size: '2xl', className: 'size-20' },
} as const

const editIconSizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
}

const editIconInnerClasses = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
}

export function AvatarUpload({
  value,
  onChange,
  size = 'md',
  name,
  seed,
  tips,
  disabled = false,
}: AvatarUploadProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error(t('memory.upload.invalidType'))
      return
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('memory.upload.tooLarge'))
      return
    }

    // 转换为 base64
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      onChange(base64)
    }
    reader.onerror = () => {
      toast.error(t('memory.upload.readFailed'))
    }
    reader.readAsDataURL(file)

    // 清空 input 以支持重复选择同一文件
    e.target.value = ''
  }

  const handleRemove = (e: MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          'group relative',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        {/* 头像容器 */}
        <button
          type="button"
          aria-label={t('memory.upload.changeAvatar')}
          disabled={disabled}
          onClick={handleClick}
          className={cn(
            'flex cursor-pointer rounded-radius-xl transition-transform',
            'group-hover:scale-105 disabled:cursor-not-allowed',
            'focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden',
          )}
        >
          <EntityAvatar
            name={name}
            src={value}
            seed={seed}
            size={avatarSizes[size].size}
            className={avatarSizes[size].className}
          />
        </button>

        {/* 编辑图标 */}
        {!disabled && (
          <button
            type="button"
            aria-label={t('memory.upload.changeAvatar')}
            className={cn(
              'absolute -right-0.5 -bottom-0.5 border border-border-default bg-surface-primary',
              'flex cursor-pointer items-center justify-center rounded-full',
              'shadow-xs transition-colors hover:bg-surface-secondary',
              editIconSizeClasses[size],
            )}
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
          >
            <PenLine
              className={cn('text-text-secondary', editIconInnerClasses[size])}
            />
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        {/* 删除按钮（有头像时显示） */}
        {value && !disabled && (
          <button
            type="button"
            aria-label={t('memory.upload.removeAvatar')}
            className={cn(
              'absolute -top-0.5 -right-0.5 border border-surface-primary bg-status-error-solid',
              'flex cursor-pointer items-center justify-center rounded-full',
              'shadow-xs transition-colors hover:bg-status-error-solid-hover',
              'opacity-0 group-hover:opacity-100',
              editIconSizeClasses[size],
            )}
            onClick={handleRemove}
          >
            <Trash2
              className={cn(
                'text-status-error-on-solid',
                editIconInnerClasses[size],
              )}
            />
          </button>
        )}
      </div>

      {tips && <span className="text-xs text-text-tertiary">{tips}</span>}
    </div>
  )
}
