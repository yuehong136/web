import React from 'react'
import { Card } from './card'
import { cn } from '@/lib/utils'

interface StatusCardProps {
  title: string
  icon: React.ReactNode
  status: 'green' | 'red' | 'yellow'
  metrics: Record<string, string | number>
  error?: string
  className?: string
}

const statusColors = {
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500'
} as const

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  icon,
  status,
  metrics,
  error,
  className
}) => {
  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-blue-600">{icon}</div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <div 
          className={cn(
            'w-2 h-2 rounded-full',
            statusColors[status]
          )}
          title={`状态: ${status === 'green' ? '正常' : status === 'red' ? '异常' : '警告'}`}
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-500">{key}:</span>
            <span className="font-medium text-gray-900">{value}</span>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 rounded border-l-4 border-red-400">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </Card>
  )
}

export { StatusCard }