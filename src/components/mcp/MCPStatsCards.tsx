/**
 * MCP 统计卡片组件 - 使用语义化设计令牌
 * 精致的统计卡片，带彩色阴影、渐变背景和动画效果
 */

import React, { useState } from 'react'
import { Globe, Activity, Zap, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MCPStatsCardsProps {
  totalServers: number
  activeServers: number
  totalTools: number
  serverTypes: number
  isLoading?: boolean
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  /** 使用设计令牌中的渐变背景 */
  gradient: string
  iconBg: string
  iconColor: string
  shadow: string
  borderHover: string
  isLoading?: boolean
  delay?: number
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  gradient,
  iconBg,
  iconColor,
  shadow,
  borderHover,
  isLoading,
  delay = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 transition-all duration-300',
        'hover:-translate-y-1',
        'border'
      )}
      style={{
        backgroundColor: 'var(--color-components-card-bg)',
        borderColor: isHovered ? borderHover : 'var(--color-components-card-border)',
        boxShadow: isHovered ? shadow : 'none',
        animationDelay: `${delay}ms`,
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
        style={{ background: gradient }}
      />
      
      <div className="relative flex items-center gap-4">
        {/* 图标 - 使用渐变背景令牌 */}
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300',
            isHovered && 'scale-110'
          )}
          style={{ background: iconBg }}
        >
          <div style={{ color: iconColor }}>{icon}</div>
        </div>

        {/* 文本 */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {label}
          </p>
          {isLoading ? (
            <div
              className="h-8 w-16 rounded-lg animate-pulse"
              style={{ backgroundColor: 'var(--color-background-subtle)' }}
            />
          ) : (
            <p
              className="text-3xl font-bold tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {value}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export const MCPStatsCards: React.FC<MCPStatsCardsProps> = ({
  totalServers,
  activeServers,
  totalTools,
  serverTypes,
  isLoading = false,
}) => {
  // 使用 components-stats-card-* 语义化设计令牌
  const stats = [
    {
      icon: <Globe className="w-6 h-6" />,
      label: '总服务器',
      value: totalServers,
      gradient: 'var(--color-components-stats-card-blue-bg)',
      iconBg: 'var(--color-components-stats-card-blue-icon-bg)',
      iconColor: 'var(--color-components-stats-card-blue-icon-text)',
      shadow: 'var(--color-components-stats-card-blue-shadow)',
      borderHover: 'var(--color-components-stats-card-blue-border-hover)',
    },
    {
      icon: <Activity className="w-6 h-6" />,
      label: '活跃连接',
      value: activeServers,
      gradient: 'var(--color-components-stats-card-green-bg)',
      iconBg: 'var(--color-components-stats-card-green-icon-bg)',
      iconColor: 'var(--color-components-stats-card-green-icon-text)',
      shadow: 'var(--color-components-stats-card-green-shadow)',
      borderHover: 'var(--color-components-stats-card-green-border-hover)',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      label: '可用工具',
      value: totalTools,
      gradient: 'var(--color-components-stats-card-purple-bg)',
      iconBg: 'var(--color-components-stats-card-purple-icon-bg)',
      iconColor: 'var(--color-components-stats-card-purple-icon-text)',
      shadow: 'var(--color-components-stats-card-purple-shadow)',
      borderHover: 'var(--color-components-stats-card-purple-border-hover)',
    },
    {
      icon: <Settings2 className="w-6 h-6" />,
      label: '协议类型',
      value: serverTypes,
      gradient: 'var(--color-components-stats-card-orange-bg)',
      iconBg: 'var(--color-components-stats-card-orange-icon-bg)',
      iconColor: 'var(--color-components-stats-card-orange-icon-text)',
      shadow: 'var(--color-components-stats-card-orange-shadow)',
      borderHover: 'var(--color-components-stats-card-orange-border-hover)',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={stat.label} {...stat} isLoading={isLoading} delay={index * 50} />
      ))}
    </div>
  )
}
