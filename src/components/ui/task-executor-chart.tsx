import React from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card } from './card'
import { cn } from '../../lib/utils'
import type { TaskExecutorHeartbeat } from '../../api/system'

interface TaskExecutorChartProps {
  executorId: string
  heartbeats: TaskExecutorHeartbeat[]
  className?: string
}

interface ChartDataPoint {
  time: string
  done: number
  failed: number
  pending: number
  lag: number
  timestamp: number
  current: Record<string, any>
  heartbeat: TaskExecutorHeartbeat // 完整的心跳数据，用于 tooltip
}

const TaskExecutorChart: React.FC<TaskExecutorChartProps> = ({
  executorId,
  heartbeats,
  className
}) => {
  // 固定显示的数据点状态
  const [pinnedData, setPinnedData] = React.useState<ChartDataPoint | null>(null)
  // 转换数据格式
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    return heartbeats
      .map(item => {
        const nowDate = new Date(item.now)
        return {
          time: nowDate.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          done: item.done,
          failed: item.failed,
          pending: item.pending,
          lag: item.lag,
          timestamp: nowDate.getTime(),
          current: item.current,
          heartbeat: item
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-20) // 只显示最近20个数据点
  }, [heartbeats])

  // 计算当前状态
  const latestHeartbeat = heartbeats[heartbeats.length - 1]
  const currentLag = latestHeartbeat ? latestHeartbeat.lag : 0

  // 自定义可点击的圆点组件
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={props.fill}
        stroke={props.stroke}
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation() // 防止事件冒泡
          console.log('Dot clicked:', payload) // 调试日志
          if (payload) {
            setPinnedData(payload as ChartDataPoint)
          }
        }}
      />
    )
  }

  // 自定义活跃圆点组件
  const CustomActiveDot = (props: any) => {
    const { cx, cy, payload } = props
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={props.fill}
        stroke={props.stroke}
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation() // 防止事件冒泡
          console.log('Active dot clicked:', payload) // 调试日志
          if (payload) {
            setPinnedData(payload as ChartDataPoint)
          }
        }}
      />
    )
  }

  // 自定义Tooltip（悬停时的简单提示）
  const CustomTooltip = ({ active, payload, label }: any) => {
    // 如果有固定数据，不显示悬停 tooltip
    if (pinnedData) return null
    
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-md">
          <p className="text-sm font-medium text-gray-900">{`时间: ${label}`}</p>
          <p className="text-xs text-gray-600">点击查看详细信息</p>
        </div>
      )
    }
    return null
  }

  // 固定显示的详细信息组件
  const PinnedTooltip = ({ data }: { data: ChartDataPoint }) => {
    const hasCurrentTask = data?.current && Object.keys(data.current).length > 0
    
    return (
      <div className="absolute top-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-md z-10">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">详细信息</h4>
          <button
            onClick={() => setPinnedData(null)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            title="关闭"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="font-medium text-gray-900 mb-2">时间: {data.time}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2" />
                <span>已完成: {data.done}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-2" />
                <span>失败: {data.failed}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded mr-2" />
                <span>待处理: {data.pending}</span>
              </div>
              <div>
                <span className="text-gray-600">延迟: {data.lag}s</span>
              </div>
            </div>
          </div>

          {/* 当前任务信息 */}
          {hasCurrentTask && (
            <div className="border-t pt-3">
              <p className="font-medium text-gray-800 mb-2">当前任务:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(data.current).map(([key, value]) => {
                  // 格式化值的显示
                  const formatValue = (val: any): string => {
                    if (val === null || val === undefined) return '无'
                    if (typeof val === 'object') {
                      try {
                        return JSON.stringify(val, null, 2)
                      } catch {
                        return '[复杂对象]'
                      }
                    }
                    return String(val)
                  }

                  return (
                    <div key={key} className="space-y-1">
                      <span className="font-medium text-sm text-gray-700">{key}:</span>
                      <pre className="text-xs bg-gray-50 p-2 rounded border overflow-auto max-h-32">
                        {formatValue(value)}
                      </pre>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {!hasCurrentTask && (
            <div className="border-t pt-3">
              <p className="text-sm text-gray-500">暂无当前任务</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('relative', className)}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-gray-900">任务执行器</h3>
            {!pinnedData && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                点击数据点查看详情
              </span>
            )}
          </div>
          <div className="flex space-x-4 text-sm text-gray-600">
            <span>ID: {latestHeartbeat?.name || executorId}</span>
            <span>延迟: {currentLag}s</span>
            <span>待处理: {latestHeartbeat?.pending || 0}</span>
            {latestHeartbeat?.boot_at && (
              <span title={`启动时间: ${new Date(latestHeartbeat.boot_at).toLocaleString('zh-CN')}`}>
                启动: {new Date(latestHeartbeat.boot_at).toLocaleDateString('zh-CN')}
              </span>
            )}
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="done" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={<CustomDot />}
                  activeDot={<CustomActiveDot />}
                  name="已完成"
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={<CustomDot />}
                  activeDot={<CustomActiveDot />}
                  name="失败"
                />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={<CustomDot />}
                  activeDot={<CustomActiveDot />}
                  name="待处理"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            暂无数据
          </div>
        )}

        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2" />
            <span>已完成</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2" />
            <span>失败</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2" />
            <span>待处理</span>
          </div>
        </div>
      </div>
      
      {/* 固定显示的详细信息 */}
      {pinnedData && <PinnedTooltip data={pinnedData} />}
    </Card>
  )
}

export { TaskExecutorChart }