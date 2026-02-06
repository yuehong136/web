import React from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { Card } from './card'
import { cn } from '@/lib/utils'
import type { TaskExecutorHeartbeat } from '@/api/system'

// 定义颜色常量
const COLORS = {
  done: { main: '#10b981', light: 'rgba(16, 185, 129, 0.1)', gradient: 'url(#doneGradient)' },
  failed: { main: '#f43f5e', light: 'rgba(244, 63, 94, 0.1)', gradient: 'url(#failedGradient)' },
  pending: { main: '#f59e0b', light: 'rgba(245, 158, 11, 0.1)', gradient: 'url(#pendingGradient)' },
}

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
    const { cx, cy, payload, fill } = props
    if (cx === undefined || cy === undefined) return null
    return (
      <g style={{ cursor: 'pointer' }} onClick={(e) => {
        e.stopPropagation()
        if (payload) setPinnedData(payload as ChartDataPoint)
      }}>
        <circle cx={cx} cy={cy} r={6} fill={fill} fillOpacity={0.15} />
        <circle cx={cx} cy={cy} r={3.5} fill="#fff" stroke={fill} strokeWidth={2} />
      </g>
    )
  }

  // 自定义活跃圆点组件
  const CustomActiveDot = (props: any) => {
    const { cx, cy, payload, fill } = props
    if (cx === undefined || cy === undefined) return null
    return (
      <g style={{ cursor: 'pointer' }} onClick={(e) => {
        e.stopPropagation()
        if (payload) setPinnedData(payload as ChartDataPoint)
      }}>
        <circle cx={cx} cy={cy} r={10} fill={fill} fillOpacity={0.2} />
        <circle cx={cx} cy={cy} r={5} fill="#fff" stroke={fill} strokeWidth={2.5} />
      </g>
    )
  }

  // 自定义Tooltip（悬停时的简单提示）
  const CustomTooltip = ({ active, payload, label }: any) => {
    // 如果有固定数据，不显示悬停 tooltip
    if (pinnedData) return null
    
    if (active && payload && payload.length) {
      return (
        <div className="px-3 py-2 rounded-lg shadow-lg border" style={{
          backgroundColor: 'var(--color-background-elevated, #fff)',
          borderColor: 'var(--color-border-default, #e5e7eb)'
        }}>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-primary, #111827)' }}>时间: {label}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted, #9ca3af)' }}>点击查看详细信息</p>
        </div>
      )
    }
    return null
  }

  // 固定显示的详细信息组件
  const PinnedTooltip = ({ data }: { data: ChartDataPoint }) => {
    const hasCurrentTask = data?.current && Object.keys(data.current).length > 0
    
    return (
      <div className="absolute top-4 right-4 rounded-xl shadow-xl max-w-sm z-10 overflow-hidden" style={{
        backgroundColor: 'var(--color-background-elevated, #fff)',
        border: '1px solid var(--color-border-default, #e5e7eb)'
      }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{
          backgroundColor: 'var(--color-background-subtle, #f9fafb)',
          borderBottom: '1px solid var(--color-border-subtle, #f3f4f6)'
        }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.done.main }} />
            <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary, #111827)' }}>时间: {data.time}</h4>
          </div>
          <button
            onClick={() => setPinnedData(null)}
            className="w-6 h-6 flex items-center justify-center rounded-md transition-colors hover:bg-components-icon-button-bg-hover"
            style={{ color: 'var(--color-text-muted, #9ca3af)' }}
            title="关闭"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: COLORS.done.light }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.done.main }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted, #6b7280)' }}>已完成</p>
                <p className="text-sm font-semibold" style={{ color: COLORS.done.main }}>{data.done}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: COLORS.failed.light }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.failed.main }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted, #6b7280)' }}>失败</p>
                <p className="text-sm font-semibold" style={{ color: COLORS.failed.main }}>{data.failed}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: COLORS.pending.light }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.pending.main }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted, #6b7280)' }}>待处理</p>
                <p className="text-sm font-semibold" style={{ color: COLORS.pending.main }}>{data.pending}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-background-subtle, #f9fafb)' }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--color-text-muted, #9ca3af)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted, #6b7280)' }}>延迟</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary, #374151)' }}>{data.lag}s</p>
              </div>
            </div>
          </div>

          {/* 当前任务信息 */}
          {hasCurrentTask && (
            <div className="pt-3 border-t" style={{ borderColor: 'var(--color-border-subtle, #f3f4f6)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>当前任务</p>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {Object.entries(data.current).map(([key, value]) => {
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
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>{key}:</span>
                      <pre className="text-xs p-2 rounded-md overflow-auto max-h-24 scrollbar-thin" style={{
                        backgroundColor: 'var(--color-background-subtle, #f9fafb)',
                        color: 'var(--color-text-primary, #374151)',
                        border: '1px solid var(--color-border-subtle, #f3f4f6)'
                      }}>
                        {formatValue(value)}
                      </pre>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {!hasCurrentTask && (
            <div className="pt-3 border-t text-center" style={{ borderColor: 'var(--color-border-subtle, #f3f4f6)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted, #9ca3af)' }}>暂无当前任务</p>
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
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary, #111827)' }}>任务执行器</h3>
            {!pinnedData && (
              <span className="text-xs px-2 py-1 rounded-full" style={{ 
                backgroundColor: 'var(--color-background-subtle, #f3f4f6)',
                color: 'var(--color-text-muted, #6b7280)'
              }}>
                点击数据点查看详情
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>
            <div className="flex items-center gap-1.5">
              <span style={{ color: 'var(--color-text-muted, #9ca3af)' }}>ID:</span>
              <span className="font-medium" style={{ color: 'var(--color-text-primary, #374151)' }}>{latestHeartbeat?.name || executorId}</span>
            </div>
            <div className="w-px h-3" style={{ backgroundColor: 'var(--color-border-default, #e5e7eb)' }} />
            <div className="flex items-center gap-1.5">
              <span style={{ color: 'var(--color-text-muted, #9ca3af)' }}>延迟:</span>
              <span className="font-medium" style={{ color: 'var(--color-text-primary, #374151)' }}>{currentLag}s</span>
            </div>
            <div className="w-px h-3" style={{ backgroundColor: 'var(--color-border-default, #e5e7eb)' }} />
            <div className="flex items-center gap-1.5">
              <span style={{ color: 'var(--color-text-muted, #9ca3af)' }}>待处理:</span>
              <span className="font-medium" style={{ color: 'var(--color-text-primary, #374151)' }}>{latestHeartbeat?.pending || 0}</span>
            </div>
            {latestHeartbeat?.boot_at && (
              <>
                <div className="w-px h-3" style={{ backgroundColor: 'var(--color-border-default, #e5e7eb)' }} />
                <div className="flex items-center gap-1.5" title={`启动时间: ${new Date(latestHeartbeat.boot_at).toLocaleString('zh-CN')}`}>
                  <span style={{ color: 'var(--color-text-muted, #9ca3af)' }}>启动:</span>
                  <span className="font-medium" style={{ color: 'var(--color-text-primary, #374151)' }}>{new Date(latestHeartbeat.boot_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="doneGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.done.main} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.done.main} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.failed.main} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.failed.main} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.pending.main} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.pending.main} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle, #e5e7eb)" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted, #9ca3af)' }}
                  axisLine={{ stroke: 'var(--color-border-default, #e5e7eb)' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted, #9ca3af)' }} 
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="done" 
                  stroke={COLORS.done.main}
                  strokeWidth={2.5}
                  dot={<CustomDot fill={COLORS.done.main} />}
                  activeDot={<CustomActiveDot fill={COLORS.done.main} />}
                  name="已完成"
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke={COLORS.failed.main}
                  strokeWidth={2.5}
                  dot={<CustomDot fill={COLORS.failed.main} />}
                  activeDot={<CustomActiveDot fill={COLORS.failed.main} />}
                  name="失败"
                />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  stroke={COLORS.pending.main}
                  strokeWidth={2.5}
                  dot={<CustomDot fill={COLORS.pending.main} />}
                  activeDot={<CustomActiveDot fill={COLORS.pending.main} />}
                  name="待处理"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-background-subtle, #f9fafb)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-muted, #9ca3af)' }}>暂无数据</p>
          </div>
        )}

        {/* Legend */}
        <div className="flex justify-center items-center gap-6 mt-5 pt-4 border-t" style={{ borderColor: 'var(--color-border-subtle, #f3f4f6)' }}>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.done.main }} />
              <div className="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-20" style={{ backgroundColor: COLORS.done.main }} />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.failed.main }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>失败</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.pending.main }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>待处理</span>
          </div>
        </div>
      </div>
      
      {/* 固定显示的详细信息 */}
      {pinnedData && <PinnedTooltip data={pinnedData} />}
    </Card>
  )
}

export { TaskExecutorChart }