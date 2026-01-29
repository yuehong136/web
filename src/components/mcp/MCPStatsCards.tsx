/**
 * MCP 统计卡片组件 - Dify 风格
 * 精致的统计卡片，带渐变背景和动画效果
 */

import React from 'react'
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
  gradient: string
  iconBg: string
  iconColor: string
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
  isLoading,
  delay = 0,
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 transition-all duration-300',
        'hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5',
        'border'
      )}
      style={{
        backgroundColor: 'var(--color-components-card-bg)',
        borderColor: 'var(--color-components-card-border)',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* 背景渐变装饰 */}
      <div
        className={cn(
          'absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-40 transition-opacity',
          gradient
        )}
      />
      
      <div className="relative flex items-center gap-4">
        {/* 图标 */}
        <div
          className="flex items-center justify-center w-12 h-12 rounded-xl transition-transform hover:scale-105"
          style={{ backgroundColor: iconBg }}
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
  const stats = [
    {
      icon: <Globe className="w-6 h-6" />,
      label: '总服务器',
      value: totalServers,
      gradient: 'bg-blue-500',
      iconBg: 'var(--color-state-info-subtle)',
      iconColor: 'var(--color-state-info)',
    },
    {
      icon: <Activity className="w-6 h-6" />,
      label: '活跃连接',
      value: activeServers,
      gradient: 'bg-green-500',
      iconBg: 'var(--color-state-success-subtle)',
      iconColor: 'var(--color-state-success)',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      label: '可用工具',
      value: totalTools,
      gradient: 'bg-purple-500',
      iconBg: 'var(--color-state-focus-subtle)',
      iconColor: 'var(--color-state-focus)',
    },
    {
      icon: <Settings2 className="w-6 h-6" />,
      label: '协议类型',
      value: serverTypes,
      gradient: 'bg-orange-500',
      iconBg: 'var(--color-state-warning-subtle)',
      iconColor: 'var(--color-state-warning)',
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
