import React from 'react'
import { Files, Download, Loader2, HelpCircle } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  tooltip?: string
  children?: React.ReactNode
  variant?: 'default' | 'info' | 'warning'
}

interface CardFooterProcessProps {
  success: number
  failed: number
  successLabel?: string
  failedLabel?: string
  successTip?: string
  failedTip?: string
}

interface LogStatsCardsProps {
  totalFiles: number
  downloading: number
  downloadSuccess: number
  downloadFailed: number
  processing: number
  processSuccess: number
  processFailed: number
  isLoading?: boolean
}

// 根据 variant 获取装饰背景颜色（使用语义化变量）
const getDecorationColor = (variant: 'default' | 'info' | 'warning') => {
  switch (variant) {
    case 'info':
      return 'var(--color-state-focus)'
    case 'warning':
      return 'var(--color-state-warning)'
    default:
      return 'var(--color-state-focus)'
  }
}

// 根据 variant 获取图标背景颜色（使用语义化变量）
const getIconBgColor = (variant: 'default' | 'info' | 'warning') => {
  switch (variant) {
    case 'info':
      return 'var(--color-state-focus-10)'
    case 'warning':
      return 'var(--color-state-warning-10)'
    default:
      return 'var(--color-state-focus-10)'
  }
}

/**
 * 单个统计卡片组件
 * 使用语义化设计令牌，自动适配主题切换
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  tooltip,
  children,
  variant = 'default',
}) => {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 transition-all duration-300 hover:shadow-md"
      style={{
        backgroundColor: 'var(--color-components-card-bg)',
        borderWidth: '1px',
        borderColor: 'var(--color-components-card-border)',
      }}
    >
      {/* 装饰性背景 */}
      <div 
        className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20"
        style={{ background: getDecorationColor(variant) }}
      />
      
      <div className="relative z-10">
        {/* 头部：标题和图标 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {title}
            </h3>
            {tooltip && (
              <Tooltip content={<p className="max-w-xs text-xs">{tooltip}</p>}>
                <HelpCircle 
                  className="w-3.5 h-3.5 cursor-help"
                  style={{ color: 'var(--color-text-tertiary)' }}
                />
              </Tooltip>
            )}
          </div>
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: getIconBgColor(variant) }}
          >
            {icon}
          </div>
        </div>

        {/* 数值 */}
        <div 
          className="text-3xl font-bold mb-3 tabular-nums"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {value.toLocaleString()}
        </div>

        {/* 子内容区域（如成功/失败统计） */}
        {children && (
          <div 
            className="pt-3"
            style={{ borderTopWidth: '1px', borderColor: 'var(--color-border-subtle)' }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 成功/失败进度条组件
 * 使用语义化设计令牌
 */
const CardFooterProcess: React.FC<CardFooterProcessProps> = ({
  success = 0,
  failed = 0,
  successLabel = '成功',
  failedLabel = '失败',
  successTip,
  failedTip,
}) => {
  const SuccessItem = (
    <div 
      className="flex-1 flex items-center justify-between p-2 rounded-lg cursor-default"
      style={{ backgroundColor: 'var(--color-state-success-10)' }}
    >
      <div className="flex items-center gap-1.5">
        <span 
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'var(--color-state-success)' }}
        />
        <span 
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {successLabel}
        </span>
      </div>
      <span 
        className="text-sm font-semibold"
        style={{ color: 'var(--color-state-success)' }}
      >
        {success}
      </span>
    </div>
  )

  const FailedItem = (
    <div 
      className="flex-1 flex items-center justify-between p-2 rounded-lg cursor-default"
      style={{ backgroundColor: 'var(--color-state-error-10)' }}
    >
      <div className="flex items-center gap-1.5">
        <span 
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'var(--color-state-error)' }}
        />
        <span 
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {failedLabel}
        </span>
      </div>
      <span 
        className="text-sm font-semibold"
        style={{ color: 'var(--color-state-error)' }}
      >
        {failed}
      </span>
    </div>
  )

  return (
    <div className="flex gap-3">
      {successTip ? (
        <Tooltip content={<p className="text-xs">{successTip}</p>}>
          {SuccessItem}
        </Tooltip>
      ) : (
        SuccessItem
      )}

      {failedTip ? (
        <Tooltip content={<p className="text-xs">{failedTip}</p>}>
          {FailedItem}
        </Tooltip>
      ) : (
        FailedItem
      )}
    </div>
  )
}

/**
 * 日志统计卡片组
 */
const LogStatsCards: React.FC<LogStatsCardsProps> = ({
  totalFiles,
  downloading,
  downloadSuccess,
  downloadFailed,
  processing,
  processSuccess,
  processFailed,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 rounded-xl animate-pulse"
            style={{ 
              backgroundColor: 'var(--color-background-subtle)',
              borderWidth: '1px',
              borderColor: 'var(--color-border-subtle)',
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* 总文件数 */}
      <StatCard
        title="总文件数"
        value={totalFiles}
        icon={
          <Files 
            className="w-5 h-5" 
            style={{ color: 'var(--color-state-focus)' }}
          />
        }
        variant="default"
        tooltip="知识库中的文件总数"
      />

      {/* 下载中 */}
      <StatCard
        title="下载中"
        value={downloading}
        icon={
          <Download 
            className="w-5 h-5" 
            style={{ color: 'var(--color-state-focus)' }}
          />
        }
        variant="info"
        tooltip="正在下载的文件数量"
      >
        <CardFooterProcess
          success={downloadSuccess}
          failed={downloadFailed}
          successTip="下载成功的文件数"
          failedTip="下载失败的文件数"
        />
      </StatCard>

      {/* 处理中 */}
      <StatCard
        title="处理中"
        value={processing}
        icon={
          <Loader2 
            className="w-5 h-5 animate-spin" 
            style={{ color: 'var(--color-state-warning)' }}
          />
        }
        variant="warning"
        tooltip="正在处理（解析）的文件数量"
      >
        <CardFooterProcess
          success={processSuccess}
          failed={processFailed}
          successTip="处理成功的文件数"
          failedTip="处理失败的文件数"
        />
      </StatCard>
    </div>
  )
}

export { LogStatsCards }
export default LogStatsCards
