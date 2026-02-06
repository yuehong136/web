import React, { useMemo } from 'react'
import {
  Database,
  FileText,
  Zap,
  HardDrive,
  RefreshCw,
  AlertCircle,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  GitCommit,
  Tag,
  Package,
} from 'lucide-react'
import { StatusCard } from '@/components/ui/status-card'
import { TaskExecutorChart } from '@/components/ui/task-executor-chart'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSystemStatus, useRefreshSystemStatus, useSystemVersion } from '@/hooks/use-system-status'

interface ComponentCardData {
  id: string
  title: string
  icon: React.ReactNode
  status: 'green' | 'red' | 'yellow'
  metrics: Record<string, string | number>
  error?: string
}

const sectionTitleClass = 'text-xs font-semibold uppercase tracking-wider text-components-system-section-title'

// 健康概览横幅
const HealthBanner: React.FC<{ cards: ComponentCardData[] }> = ({ cards }) => {
  const greenCount = cards.filter(c => c.status === 'green').length
  const yellowCount = cards.filter(c => c.status === 'yellow').length
  const redCount = cards.filter(c => c.status === 'red').length
  const allHealthy = redCount === 0 && yellowCount === 0

  const statusStyle = allHealthy
    ? {
      container: 'bg-components-system-health-ok-bg border-components-system-health-ok-border',
      text: 'text-components-system-health-ok-text',
      icon: 'text-components-system-health-ok-text',
    }
    : redCount > 0
      ? {
        container: 'bg-components-system-health-error-bg border-components-system-health-error-border',
        text: 'text-components-system-health-error-text',
        icon: 'text-components-system-health-error-text',
      }
      : {
        container: 'bg-components-system-health-warning-bg border-components-system-health-warning-border',
        text: 'text-components-system-health-warning-text',
        icon: 'text-components-system-health-warning-text',
      }

  return (
    <div className={cn('flex items-center gap-3 rounded-xl border px-5 py-3.5', statusStyle.container)}>
      {allHealthy ? (
        <CheckCircle2 className={cn('h-5 w-5 flex-shrink-0', statusStyle.icon)} />
      ) : redCount > 0 ? (
        <XCircle className={cn('h-5 w-5 flex-shrink-0', statusStyle.icon)} />
      ) : (
        <AlertTriangle className={cn('h-5 w-5 flex-shrink-0', statusStyle.icon)} />
      )}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold', statusStyle.text)}>
          {allHealthy
            ? '所有系统正常运行'
            : `${redCount > 0 ? `${redCount} 个组件异常` : ''}${redCount > 0 && yellowCount > 0 ? '，' : ''}${yellowCount > 0 ? `${yellowCount} 个组件警告` : ''}`
          }
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs text-text-tertiary flex-shrink-0">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-state-success" />
          {greenCount}
        </span>
        {yellowCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-state-warning" />
            {yellowCount}
          </span>
        )}
        {redCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-state-error" />
            {redCount}
          </span>
        )}
      </div>
    </div>
  )
}

// 紧凑版本信息标签
const VersionTag: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="inline-flex items-center gap-1.5 rounded-lg border border-components-system-version-tag-border bg-components-system-version-tag-bg px-3 py-1.5 text-xs">
    <span className="text-components-system-version-tag-label">{icon}</span>
    <span className="text-components-system-version-tag-label">{label}</span>
    <span className="font-mono font-semibold text-components-system-version-tag-value">{value}</span>
  </div>
)

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <div className="mb-4 flex items-center gap-3">
    <h2 className={sectionTitleClass}>{title}</h2>
    <div className="h-px flex-1 bg-components-system-section-divider" />
  </div>
)

const SystemPage: React.FC = () => {
  const { data, isLoading, error, isRefetching } = useSystemStatus()
  const { data: versionData, isLoading: versionLoading } = useSystemVersion()
  const refreshStatus = useRefreshSystemStatus()

  // 转换API数据为组件所需格式
  const cards = useMemo(() => {
    if (!data) return []
    const result: ComponentCardData[] = []

    if (data.database) {
      result.push({
        id: 'database',
        title: `数据库 (${data.database.database.toUpperCase()})`,
        icon: <Database className="h-4 w-4" />,
        status: data.database.status,
        metrics: { '响应时间': `${data.database.elapsed}ms` },
        error: data.database.error
      })
    }

    if (data.database_pool) {
      result.push({
        id: 'database_pool',
        title: '数据库连接池',
        icon: <Activity className="h-4 w-4" />,
        status: data.database_pool.status,
        metrics: {
          '响应时间': `${data.database_pool.elapsed}ms`,
          '连接池大小': data.database_pool.pool_size,
          '活动连接': data.database_pool.checked_out,
          '空闲连接': data.database_pool.checked_in,
          '总连接数': data.database_pool.total_connections,
          '使用率': data.database_pool.usage_rate,
        },
        error: data.database_pool.error
      })
    }

    if (data.doc_engine) {
      result.push({
        id: 'doc_engine',
        title: `向量引擎 (${data.doc_engine.type.charAt(0).toUpperCase() + data.doc_engine.type.slice(1)})`,
        icon: <FileText className="h-4 w-4" />,
        status: data.doc_engine.status,
        metrics: {
          '响应时间': `${data.doc_engine.elapsed}ms`,
          '版本': data.doc_engine.version || 'N/A',
        },
        error: data.doc_engine.error
      })
    }

    if (data.redis) {
      result.push({
        id: 'redis',
        title: '缓存 (Redis)',
        icon: <Zap className="h-4 w-4" />,
        status: data.redis.status,
        metrics: { '响应时间': `${data.redis.elapsed}ms` },
        error: data.redis.error
      })
    }

    if (data.storage) {
      result.push({
        id: 'storage',
        title: `对象存储 (${data.storage.storage.toUpperCase()})`,
        icon: <HardDrive className="h-4 w-4" />,
        status: data.storage.status,
        metrics: { '响应时间': `${data.storage.elapsed}ms` },
        error: data.storage.error
      })
    }

    return result
  }, [data])

  const taskExecutors = data?.task_executor_heartbeats || {}

  // 解析版本信息
  const versionInfo = useMemo(() => {
    if (!versionData) return null
    if (typeof versionData === 'string') {
      const parts = versionData.split(' ')
      const versionPart = parts[0]
      const buildType = parts[1]
      const versionMatch = versionPart?.match(/^(v[\d.]+)(?:-(\d+)-g([a-f0-9]+))?/)
      return {
        version: versionMatch?.[1] || versionPart || '',
        commits: versionMatch?.[2],
        gitCommit: versionMatch?.[3],
        buildType,
      }
    }
    if (typeof versionData === 'object' && versionData !== null) {
      const obj = versionData as Record<string, unknown>
      return {
        version: typeof obj.version === 'string' ? obj.version : '',
        gitCommit: typeof obj.git_commit === 'string' ? obj.git_commit.substring(0, 8) : undefined,
        buildType: typeof obj.platform === 'string' ? obj.platform : undefined,
      }
    }
    return null
  }, [versionData])

  if (isLoading) {
    return (
      <div className="min-h-full bg-components-system-page-bg p-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 bg-components-skeleton-bg rounded-lg w-40" />
            <div className="h-9 bg-components-skeleton-bg rounded-lg w-20" />
          </div>
          <div className="h-12 bg-components-skeleton-bg rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-40 bg-components-skeleton-bg rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-full bg-components-system-page-bg p-8">
        <div className="space-y-6 rounded-2xl border border-components-system-panel-border bg-components-system-panel-bg p-6 shadow-components-system-panel-shadow backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-components-system-header-title">系统状态</h1>
            <Button onClick={() => refreshStatus()} disabled={isRefetching} variant="outline" size="sm">
              <RefreshCw className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')} />
              刷新
            </Button>
          </div>
          <div className="rounded-xl border border-components-system-health-error-border bg-components-system-health-error-bg p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-components-system-health-error-text" />
              <div>
                <h3 className="text-sm font-semibold text-components-system-health-error-text">加载系统状态失败</h3>
                <p className="mt-0.5 text-sm text-components-system-health-error-text/90">{error.message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-components-system-page-bg p-8">
      <div className="space-y-6 rounded-2xl border border-components-system-panel-border bg-components-system-panel-bg p-6 shadow-components-system-panel-shadow backdrop-blur-md">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-components-system-header-title">系统状态</h1>
            <p className="mt-0.5 text-sm text-components-system-header-description">监控组件运行状况和任务执行器心跳</p>
          </div>
          <Button onClick={() => refreshStatus()} disabled={isRefetching} variant="outline" size="sm">
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')} />
            刷新
          </Button>
        </div>

        {/* Health Banner */}
        {cards.length > 0 && <HealthBanner cards={cards} />}

        {/* Version Info Tags */}
        {!versionLoading && versionInfo && (
          <div className="flex flex-wrap items-center gap-2">
            {versionInfo.version && (
              <VersionTag icon={<Tag className="h-3 w-3" />} label="版本" value={versionInfo.version} />
            )}
            {versionInfo.gitCommit && (
              <VersionTag icon={<GitCommit className="h-3 w-3" />} label="提交" value={versionInfo.gitCommit} />
            )}
            {versionInfo.commits && (
              <VersionTag icon={<Package className="h-3 w-3" />} label="提交数" value={versionInfo.commits} />
            )}
            {versionInfo.buildType && (
              <VersionTag icon={<Package className="h-3 w-3" />} label="构建" value={versionInfo.buildType} />
            )}
          </div>
        )}

        {/* System Components Status Cards */}
        {cards.length > 0 && (
          <div>
            <SectionTitle title="组件状态" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {cards.map((card) => (
                <StatusCard
                  key={card.id}
                  title={card.title}
                  icon={card.icon}
                  status={card.status}
                  metrics={card.metrics}
                  error={card.error}
                />
              ))}
            </div>
          </div>
        )}

        {/* Task Executors */}
        {Object.keys(taskExecutors).length > 0 && (
          <div>
            <SectionTitle title="任务执行器" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {Object.entries(taskExecutors).map(([executorId, heartbeats]) => (
                <TaskExecutorChart
                  key={executorId}
                  executorId={executorId}
                  heartbeats={heartbeats}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State for Task Executors */}
        {Object.keys(taskExecutors).length === 0 && (
          <div>
            <SectionTitle title="任务执行器" />
            <div className="rounded-xl border border-components-system-empty-border bg-components-system-empty-bg p-10 text-center">
              <Activity className="mx-auto mb-2 h-8 w-8 text-text-muted" />
              <p className="text-sm text-text-tertiary">暂无任务执行器数据</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export { SystemPage }
