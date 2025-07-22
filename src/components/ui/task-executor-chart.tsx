import React from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card } from './card'
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

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload as ChartDataPoint
      const hasCurrentTask = data?.current && Object.keys(data.current).length > 0
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-sm">
          <p className="font-medium text-gray-900 mb-2">{`时间: ${label}`}</p>
          
          {/* 基础指标 */}
          <div className="space-y-1 mb-2">
            {payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {`${entry.name}: ${entry.value}`}
              </p>
            ))}
            <p className="text-sm text-gray-600">延迟: {data?.lag || 0}s</p>
          </div>

          {/* 当前任务信息 */}
          {hasCurrentTask && (
            <div className="border-t pt-2 mt-2">
              <p className="font-medium text-gray-800 text-sm mb-1">当前任务:</p>
              <div className="text-xs text-gray-600 space-y-1">
                {Object.entries(data.current).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span className="ml-2 break-all">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!hasCurrentTask && (
            <p className="text-xs text-gray-500 border-t pt-2 mt-2">暂无当前任务</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">任务执行器</h3>
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
                  dot={false}
                  name="已完成"
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                  name="失败"
                />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={false}
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
    </Card>
  )
}

export { TaskExecutorChart }