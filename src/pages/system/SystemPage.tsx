import React from 'react'
import { 
  Database, 
  FileText, 
  Zap, 
  HardDrive, 
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react'
import { StatusCard } from '@/components/ui/status-card'
import { TaskExecutorChart } from '@/components/ui/task-executor-chart'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSystemStatus, useRefreshSystemStatus, useSystemVersion } from '@/hooks/use-system-status'
import type { SystemStatusResponse } from '@/api/system'

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
  const { data: versionData, isLoading: versionLoading, error: versionError } = useSystemVersion()
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
          {/* Version info placeholder */}
          <div className="h-24 bg-gray-200 rounded-lg mb-6"></div>
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

      {/* System Version Info */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Info className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">系统版本信息</h3>
              {versionLoading ? (
                <div className="mt-2">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              ) : versionError ? (
                <p className="mt-2 text-sm text-red-600">获取版本信息失败</p>
              ) : versionData ? (
                <div className="mt-2 text-sm text-gray-600">
                  {(() => {
                    // 处理版本信息显示
                    const renderVersionInfo = () => {
                      if (typeof versionData === 'string') {
                        // 处理字符串格式的版本信息
                        const versionString = versionData as string
                        const parts = versionString.split(' ')
                        const versionPart = parts[0] // "v0.2.5-537-gdb3f52a"
                        const buildType = parts[1] // "full"
                        
                        const versionMatch = versionPart?.match(/^(v[\d.]+)(?:-(\d+)-g([a-f0-9]+))?/)
                        
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <span className="font-medium">版本信息:</span> {versionString}
                            </div>
                            {versionMatch && (
                              <>
                                <div>
                                  <span className="font-medium">基础版本:</span> {versionMatch[1]}
                                </div>
                                {versionMatch[2] && (
                                  <div>
                                    <span className="font-medium">提交数:</span> {versionMatch[2]}
                                  </div>
                                )}
                                {versionMatch[3] && (
                                  <div>
                                    <span className="font-medium">Git提交:</span> {versionMatch[3]}
                                  </div>
                                )}
                              </>
                            )}
                            {buildType && (
                              <div>
                                <span className="font-medium">构建类型:</span> {buildType}
                              </div>
                            )}
                          </div>
                        )
                      } else if (versionData && typeof versionData === 'object') {
                        // 处理对象格式的版本信息（向后兼容）
                        const versionObj = versionData as any
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <span className="font-medium">版本号:</span> {versionObj.version}
                            </div>
                            {versionObj.build_time && (
                              <div>
                                <span className="font-medium">构建时间:</span> {new Date(versionObj.build_time).toLocaleString('zh-CN')}
                              </div>
                            )}
                            {versionObj.git_commit && (
                              <div>
                                <span className="font-medium">Git提交:</span> {versionObj.git_commit.substring(0, 8)}
                              </div>
                            )}
                            {versionObj.git_branch && (
                              <div>
                                <span className="font-medium">Git分支:</span> {versionObj.git_branch}
                              </div>
                            )}
                            {versionObj.python_version && (
                              <div>
                                <span className="font-medium">Python版本:</span> {versionObj.python_version}
                              </div>
                            )}
                            {versionObj.platform && (
                              <div>
                                <span className="font-medium">平台:</span> {versionObj.platform}
                              </div>
                            )}
                          </div>
                        )
                      }
                      return null
                    }
                    
                    return renderVersionInfo()
                  })()}
                </div>
              ) : null}
            </div>
          </div>
        </Card>
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