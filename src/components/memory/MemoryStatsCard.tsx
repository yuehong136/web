/**
 * 记忆库统计卡片组件
 * 使用语义化设计令牌系统，带彩色阴影和渐变效果
 */

import React, { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MemoryStatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isUp: boolean
  }
  /** 颜色主题，对应统计卡片令牌中的颜色变体 */
  color?: 'info' | 'success' | 'warning' | 'purple'
  className?: string
}

// 颜色映射到设计令牌 - 使用 components-stats-card-* 令牌
const colorTokens = {
  info: {
    gradient: 'var(--color-components-stats-card-blue-bg)',
    iconBg: 'var(--color-components-stats-card-blue-icon-bg)',
    iconText: 'var(--color-components-stats-card-blue-icon-text)',
    shadow: 'var(--color-components-stats-card-blue-shadow)',
    borderHover: 'var(--color-components-stats-card-blue-border-hover)',
  },
  success: {
    gradient: 'var(--color-components-stats-card-green-bg)',
    iconBg: 'var(--color-components-stats-card-green-icon-bg)',
    iconText: 'var(--color-components-stats-card-green-icon-text)',
    shadow: 'var(--color-components-stats-card-green-shadow)',
    borderHover: 'var(--color-components-stats-card-green-border-hover)',
  },
  warning: {
    gradient: 'var(--color-components-stats-card-orange-bg)',
    iconBg: 'var(--color-components-stats-card-orange-icon-bg)',
    iconText: 'var(--color-components-stats-card-orange-icon-text)',
    shadow: 'var(--color-components-stats-card-orange-shadow)',
    borderHover: 'var(--color-components-stats-card-orange-border-hover)',
  },
  purple: {
    gradient: 'var(--color-components-stats-card-purple-bg)',
    iconBg: 'var(--color-components-stats-card-purple-icon-bg)',
    iconText: 'var(--color-components-stats-card-purple-icon-text)',
    shadow: 'var(--color-components-stats-card-purple-shadow)',
    borderHover: 'var(--color-components-stats-card-purple-border-hover)',
  },
}

export const MemoryStatsCard: React.FC<MemoryStatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'info',
  className,
}) => {
  const tokens = colorTokens[color]
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 transition-all duration-300',
        'hover:-translate-y-1',
        'border',
        className
      )}
      style={{
        backgroundColor: 'var(--color-components-card-bg)',
        borderColor: isHovered ? tokens.borderHover : 'var(--color-components-card-border)',
        boxShadow: isHovered ? tokens.shadow : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 背景渐变装饰 - 使用设计令牌中的渐变 */}
      <div
        className={cn(
          'absolute -right-4 -top-4 w-28 h-28 rounded-full blur-2xl transition-all duration-300',
          isHovered ? 'opacity-80 scale-110' : 'opacity-50'
        )}
        style={{ background: tokens.gradient }}
      />
      
      <div className="relative flex items-center gap-4">
        {/* 图标 - 使用渐变背景令牌 */}
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300',
            isHovered && 'scale-110'
          )}
          style={{ background: tokens.iconBg }}
        >
          <Icon className="h-6 w-6" style={{ color: tokens.iconText }} />
        </div>

        {/* 文本 */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {title}
          </p>
          <div className="flex items-baseline gap-space-sm">
            <p
              className="text-3xl font-bold tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && (
              <span
                className={cn(
                  'flex items-center text-xs font-medium',
                  trend.isUp ? 'text-text-success' : 'text-text-error'
                )}
              >
                {trend.isUp ? (
                  <TrendingUp className="w-icon-xs h-icon-xs mr-0.5" />
                ) : (
                  <TrendingDown className="w-icon-xs h-icon-xs mr-0.5" />
                )}
                {trend.value}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

MemoryStatsCard.displayName = 'MemoryStatsCard'
