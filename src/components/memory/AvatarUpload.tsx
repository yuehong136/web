/**
 * 头像上传组件
 * 用于记忆库的头像设置
 */

import React, { useRef } from 'react'
import { PenLine, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AvatarUploadProps {
  /** 当前头像 URL 或 base64 */
  value?: string
  /** 头像变化回调，返回 base64 字符串 */
  onChange: (base64: string) => void
  /** 头像大小 */
  size?: 'sm' | 'md' | 'lg'
  /** 默认显示的首字母 */
  fallbackLetter?: string
  /** 渐变背景类 */
  gradientClass?: string
  /** 提示文本 */
  tips?: string
  /** 是否禁用 */
  disabled?: boolean
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
}

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

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  value,
  onChange,
  size = 'md',
  fallbackLetter = 'M',
  gradientClass = 'from-purple-500 to-pink-500',
  tips,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('头像文件大小不能超过 5MB')
      return
    }

    // 转换为 base64
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      onChange(base64)
    }
    reader.onerror = () => {
      toast.error('读取文件失败')
    }
    reader.readAsDataURL(file)

    // 清空 input 以支持重复选择同一文件
    e.target.value = ''
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div className="flex items-center gap-4">
      <div 
        className={cn(
          'relative cursor-pointer group',
          disabled && 'cursor-not-allowed opacity-60'
        )}
        onClick={handleClick}
      >
        {/* 头像容器 */}
        <div
          className={cn(
            'rounded-full flex items-center justify-center overflow-hidden',
            'bg-gradient-to-br shadow-md transition-transform',
            'group-hover:scale-105',
            sizeClasses[size],
            gradientClass
          )}
        >
          {value ? (
            <img 
              src={value} 
              alt="avatar" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className="text-white font-semibold text-xl">
              {fallbackLetter.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* 编辑图标 */}
        {!disabled && (
          <label
            className={cn(
              'absolute -bottom-0.5 -right-0.5 bg-surface-primary border border-border-default',
              'rounded-full flex items-center justify-center cursor-pointer',
              'hover:bg-surface-secondary transition-colors shadow-sm',
              editIconSizeClasses[size]
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <PenLine className={cn('text-text-secondary', editIconInnerClasses[size])} />
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
              disabled={disabled}
            />
          </label>
        )}

        {/* 删除按钮（有头像时显示） */}
        {value && !disabled && (
          <button
            type="button"
            className={cn(
              'absolute -top-0.5 -right-0.5 bg-status-error border border-surface-primary',
              'rounded-full flex items-center justify-center cursor-pointer',
              'hover:bg-status-error/80 transition-colors shadow-sm',
              'opacity-0 group-hover:opacity-100',
              editIconSizeClasses[size]
            )}
            onClick={handleRemove}
          >
            <Trash2 className={cn('text-white', editIconInnerClasses[size])} />
          </button>
        )}
      </div>

      {tips && (
        <span className="text-xs text-text-tertiary">{tips}</span>
      )}
    </div>
  )
}

AvatarUpload.displayName = 'AvatarUpload'
