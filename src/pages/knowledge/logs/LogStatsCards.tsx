import React from 'react'
import { useTranslation } from 'react-i18next'
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
        className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-20 blur-2xl"
        style={{ background: getDecorationColor(variant) }}
      />

      <div className="relative z-10">
        {/* 头部：标题和图标 */}
        <div className="mb-3 flex items-center justify-between">
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
                  className="h-3.5 w-3.5 cursor-help"
                  style={{ color: 'var(--color-text-tertiary)' }}
                />
              </Tooltip>
            )}
          </div>
          <div
            className="rounded-lg p-2"
            style={{ backgroundColor: getIconBgColor(variant) }}
          >
            {icon}
          </div>
        </div>

        {/* 数值 */}
        <div
          className="mb-3 text-3xl font-bold tabular-nums"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {value.toLocaleString()}
        </div>

        {/* 子内容区域（如成功/失败统计） */}
        {children && (
          <div
            className="pt-3"
            style={{
              borderTopWidth: '1px',
              borderColor: 'var(--color-border-subtle)',
            }}
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
      className="flex flex-1 cursor-default items-center justify-between rounded-lg p-2"
      style={{ backgroundColor: 'var(--color-state-success-10)' }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 rounded-full"
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
      className="flex flex-1 cursor-default items-center justify-between rounded-lg p-2"
      style={{ backgroundColor: 'var(--color-state-error-10)' }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 rounded-full"
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
  const { t } = useTranslation()
  if (isLoading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl"
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
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* 总文件数 */}
      <StatCard
        title={t('knowledge.logs.stats.totalFiles')}
        value={totalFiles}
        icon={
          <Files
            className="h-5 w-5"
            style={{ color: 'var(--color-state-focus)' }}
          />
        }
        variant="default"
        tooltip={t('knowledge.logs.stats.totalFilesTooltip')}
      />

      {/* 下载中 */}
      <StatCard
        title={t('knowledge.logs.stats.downloading')}
        value={downloading}
        icon={
          <Download
            className="h-5 w-5"
            style={{ color: 'var(--color-state-focus)' }}
          />
        }
        variant="info"
        tooltip={t('knowledge.logs.stats.downloadingTooltip')}
      >
        <CardFooterProcess
          success={downloadSuccess}
          failed={downloadFailed}
          successLabel={t('knowledge.logs.stats.success')}
          failedLabel={t('knowledge.logs.stats.failed')}
          successTip={t('knowledge.logs.stats.downloadSuccessTip')}
          failedTip={t('knowledge.logs.stats.downloadFailedTip')}
        />
      </StatCard>

      {/* 处理中 */}
      <StatCard
        title={t('knowledge.logs.stats.processing')}
        value={processing}
        icon={
          <Loader2
            className="h-5 w-5 animate-spin"
            style={{ color: 'var(--color-state-warning)' }}
          />
        }
        variant="warning"
        tooltip={t('knowledge.logs.stats.processingTooltip')}
      >
        <CardFooterProcess
          success={processSuccess}
          failed={processFailed}
          successLabel={t('knowledge.logs.stats.success')}
          failedLabel={t('knowledge.logs.stats.failed')}
          successTip={t('knowledge.logs.stats.processSuccessTip')}
          failedTip={t('knowledge.logs.stats.processFailedTip')}
        />
      </StatCard>
    </div>
  )
}

export { LogStatsCards }
export default LogStatsCards
