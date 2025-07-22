import React from 'react'
import { 
  Database, 
  FileText, 
  Zap, 
  HardDrive, 
  RefreshCw,
  AlertCircle 
} from 'lucide-react'
import { StatusCard } from '../../components/ui/status-card'
import { TaskExecutorChart } from '../../components/ui/task-executor-chart'
import { Button } from '../../components/ui/button'
import { useSystemStatus, useRefreshSystemStatus } from '../../hooks/use-system-status'
import type { SystemStatusResponse } from '../../api/system'

interface ComponentCardData {
  id: string
  title: string
  icon: React.ReactNode
  status: 'green' | 'red' | 'yellow'
  metrics: Record<string, string | number>
  error?: string
}

const SystemPage: React.FC = () => {
  const { data, isLoading, error, isRefetching } = useSystemStatus()
  const refreshStatus = useRefreshSystemStatus()

  // 转换API数据为组件所需格式
  const transformToCardData = (data: SystemStatusResponse): ComponentCardData[] => {
    const cards: ComponentCardData[] = []

    // Database
    if (data.database) {
      cards.push({
        id: 'database',
        title: 'Database',
        icon: <Database className="h-5 w-5" />,
        status: data.database.status,
        metrics: {
          'Database': data.database.database,
          'Elapsed': `${data.database.elapsed} ms`
        },
        error: data.database.error
      })
    }

    // Doc Engine (Milvus)
    if (data.doc_engine) {
      cards.push({
        id: 'doc_engine',
        title: 'Doc Engine',
        icon: <FileText className="h-5 w-5" />,
        status: data.doc_engine.status,
        metrics: {
          'Type': data.doc_engine.type,
          'Version': data.doc_engine.version || 'N/A',
          'Elapsed': `${data.doc_engine.elapsed} ms`
        },
        error: data.doc_engine.error
      })
    }

    // Redis
    if (data.redis) {
      cards.push({
        id: 'redis',
        title: 'Redis',
        icon: <Zap className="h-5 w-5" />,
        status: data.redis.status,
        metrics: {
          'Elapsed': `${data.redis.elapsed} ms`
        },
        error: data.redis.error
      })
    }

    // Storage
    if (data.storage) {
      cards.push({
        id: 'storage',
        title: 'Object Storage',
        icon: <HardDrive className="h-5 w-5" />,
        status: data.storage.status,
        metrics: {
          'Storage': data.storage.storage,
          'Elapsed': `${data.storage.elapsed} ms`
        },
        error: data.storage.error
      })
    }

    return cards
  }

  const handleRefresh = () => {
    refreshStatus()
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">系统状态</h1>
          <Button 
            onClick={handleRefresh}
            disabled={isRefetching}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">加载系统状态失败</h3>
              <p className="text-red-700 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const cards = data ? transformToCardData(data) : []
  const taskExecutors = data?.task_executor_heartbeats || {}

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">系统状态</h1>
        <Button 
          onClick={handleRefresh}
          disabled={isRefetching}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* System Components Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
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

      {/* Task Executors */}
      {Object.keys(taskExecutors).length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">任务执行器</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">任务执行器</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">暂无任务执行器数据</p>
          </div>
        </div>
      )}
    </div>
  )
}

export { SystemPage }