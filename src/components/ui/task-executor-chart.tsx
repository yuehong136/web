import React from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceArea } from 'recharts'
import { Card } from './card'
import { cn } from '@/lib/utils'
import type { TaskExecutorHeartbeat } from '@/api/system'

// 定义颜色常量
const COLORS = {
  done: { main: 'var(--color-components-system-chart-done)', light: 'var(--color-components-system-chart-done-soft)' },
  failed: { main: 'var(--color-components-system-chart-failed)', light: 'var(--color-components-system-chart-failed-soft)' },
  pending: { main: 'var(--color-components-system-chart-pending)', light: 'var(--color-components-system-chart-pending-soft)' },
  lag: 'var(--color-components-system-chart-lag)',
} as const

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
  current: Record<string, unknown>
  heartbeat: TaskExecutorHeartbeat // 完整的心跳数据，用于 tooltip
}

interface ChartDotProps {
  cx?: number
  cy?: number
  payload?: ChartDataPoint
  fill?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: unknown[]
  label?: string
}

type AnomalyLevel = 'error' | 'warning'

interface AnomalyRegion {
  x1: string
  x2: string
  level: AnomalyLevel
}

const getAnomalyLevel = (point: ChartDataPoint): AnomalyLevel | null => {
  if (point.failed > 0) return 'error'
  if (point.lag >= 5) return 'warning'
  return null
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
          current: item.current as Record<string, unknown>,
          heartbeat: item
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-20) // 只显示最近20个数据点
  }, [heartbeats])

  const anomalyRegions: AnomalyRegion[] = React.useMemo(() => {
    if (chartData.length === 0) return []

    const regions: AnomalyRegion[] = []
    let activeLevel: AnomalyLevel | null = null
    let startIndex = -1

    const closeRegion = (endIndexCandidate: number) => {
      if (!activeLevel || startIndex === -1) return
      const endIndex = Math.min(endIndexCandidate, chartData.length - 1)
      regions.push({
        x1: chartData[startIndex].time,
        x2: chartData[endIndex].time,
        level: activeLevel,
      })
    }

    chartData.forEach((point, index) => {
      const level = getAnomalyLevel(point)
      if (level === activeLevel) return

      if (activeLevel) closeRegion(index)

      if (level) {
        activeLevel = level
        startIndex = index
      } else {
        activeLevel = null
        startIndex = -1
      }
    })

    if (activeLevel) closeRegion(chartData.length - 1)
    return regions
  }, [chartData])

  const anomalySummary = React.useMemo(() => {
    return anomalyRegions.reduce(
      (acc, region) => {
        if (region.level === 'error') acc.error += 1
        if (region.level === 'warning') acc.warning += 1
        return acc
      },
      { error: 0, warning: 0 }
    )
  }, [anomalyRegions])

  // 计算当前状态
  const latestHeartbeat = heartbeats[heartbeats.length - 1]
  const currentLag = latestHeartbeat ? latestHeartbeat.lag : 0

  // 自定义可点击的圆点组件
  const CustomDot = ({ cx, cy, payload, fill }: ChartDotProps) => {
    if (cx === undefined || cy === undefined || !fill) return null
    return (
      <g style={{ cursor: 'pointer' }} onClick={(e) => {
        e.stopPropagation()
        if (payload) setPinnedData(payload)
      }}>
        <circle cx={cx} cy={cy} r={6} fill={fill} fillOpacity={0.15} />
        <circle cx={cx} cy={cy} r={3.5} fill="var(--color-components-system-chart-tooltip-bg)" stroke={fill} strokeWidth={2} />
      </g>
    )
  }

  // 自定义活跃圆点组件
  const CustomActiveDot = ({ cx, cy, payload, fill }: ChartDotProps) => {
    if (cx === undefined || cy === undefined || !fill) return null
    return (
      <g style={{ cursor: 'pointer' }} onClick={(e) => {
        e.stopPropagation()
        if (payload) setPinnedData(payload)
      }}>
        <circle cx={cx} cy={cy} r={10} fill={fill} fillOpacity={0.2} />
        <circle cx={cx} cy={cy} r={5} fill="var(--color-components-system-chart-tooltip-bg)" stroke={fill} strokeWidth={2.5} />
      </g>
    )
  }

  // 自定义Tooltip（悬停时的简单提示）
  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    // 如果有固定数据，不显示悬停 tooltip
    if (pinnedData) return null
    
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-components-system-chart-tooltip-border bg-components-system-chart-tooltip-bg px-3 py-2 shadow-shadow-md">
          <p className="mb-1 text-xs font-semibold text-components-system-chart-tooltip-text">时间: {label ?? '-'}</p>
          <p className="text-xs text-components-system-chart-tooltip-muted">点击查看详细信息</p>
        </div>
      )
    }
    return null
  }

  // 固定显示的详细信息组件
  const PinnedTooltip = ({ data }: { data: ChartDataPoint }) => {
    const hasCurrentTask = data?.current && Object.keys(data.current).length > 0
    
    return (
      <div className="absolute right-4 top-4 z-10 max-w-sm overflow-hidden rounded-xl border border-components-system-chart-tooltip-border bg-components-system-chart-tooltip-bg shadow-shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-components-system-section-divider bg-components-system-chart-info-pill-bg px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.done.main }} />
            <h4 className="text-sm font-semibold text-components-system-chart-tooltip-text">时间: {data.time}</h4>
          </div>
          <button
            onClick={() => setPinnedData(null)}
            className="w-6 h-6 flex items-center justify-center rounded-md transition-colors hover:bg-components-icon-button-bg-hover"
            style={{ color: 'var(--color-components-system-chart-tooltip-muted)' }}
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
                <p className="text-xs text-components-system-chart-tooltip-muted">已完成</p>
                <p className="text-sm font-semibold" style={{ color: COLORS.done.main }}>{data.done}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: COLORS.failed.light }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.failed.main }} />
              <div>
                <p className="text-xs text-components-system-chart-tooltip-muted">失败</p>
                <p className="text-sm font-semibold" style={{ color: COLORS.failed.main }}>{data.failed}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: COLORS.pending.light }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.pending.main }} />
              <div>
                <p className="text-xs text-components-system-chart-tooltip-muted">待处理</p>
                <p className="text-sm font-semibold" style={{ color: COLORS.pending.main }}>{data.pending}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-components-system-chart-info-pill-bg px-3 py-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.lag }} />
              <div>
                <p className="text-xs text-components-system-chart-tooltip-muted">延迟</p>
                <p className="text-sm font-semibold text-components-system-chart-tooltip-text">{data.lag}s</p>
              </div>
            </div>
          </div>

          {/* 当前任务信息 */}
          {hasCurrentTask && (
            <div className="border-t border-components-system-section-divider pt-3">
              <p className="mb-2 text-xs font-medium text-components-system-chart-tooltip-muted">当前任务</p>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {Object.entries(data.current).map(([key, value]) => {
                  const formatValue = (val: unknown): string => {
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
                      <span className="text-xs font-medium text-components-system-chart-tooltip-muted">{key}:</span>
                      <pre className="max-h-24 overflow-auto rounded-md border border-components-system-section-divider bg-components-system-chart-info-pill-bg p-2 text-xs text-components-system-chart-tooltip-text scrollbar-thin">
                        {formatValue(value)}
                      </pre>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {!hasCurrentTask && (
            <div className="border-t border-components-system-section-divider pt-3 text-center">
              <p className="text-xs text-components-system-chart-tooltip-muted">暂无当前任务</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('relative border-components-system-status-card-border border-t-2 border-t-components-system-accent-border bg-components-system-status-card-bg shadow-components-system-status-card-shadow', className)}>
      <div className="p-4 md:p-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-components-system-accent-text" />
            <h3 className="font-semibold text-components-system-header-title">任务执行器</h3>
            {!pinnedData && (
              <span className="rounded-full border border-components-system-accent-border bg-components-system-accent-bg px-2 py-1 text-xs text-components-system-accent-text">
                点击数据点查看详情
              </span>
            )}
            {pinnedData && (
              <span className="rounded-full bg-components-system-chart-info-pill-bg px-2 py-1 text-xs text-components-system-chart-info-pill-text">
                详情已固定
              </span>
            )}
            {(anomalySummary.error > 0 || anomalySummary.warning > 0) && (
              <span className="rounded-full border border-components-system-health-warning-border bg-components-system-health-warning-bg px-2 py-1 text-xs text-components-system-health-warning-text">
                异常窗口 {anomalySummary.error + anomalySummary.warning}
              </span>
            )}
          </div>
          <div className="hidden items-center gap-4 text-xs text-components-system-chart-tooltip-muted 2xl:flex">
            <div className="flex items-center gap-1.5">
              <span>ID:</span>
              <span className="font-medium text-components-system-header-title">{latestHeartbeat?.name || executorId}</span>
            </div>
            <div className="h-3 w-px bg-components-system-section-divider" />
            <div className="flex items-center gap-1.5">
              <span>延迟:</span>
              <span className="font-medium text-components-system-header-title">{currentLag}s</span>
            </div>
            <div className="h-3 w-px bg-components-system-section-divider" />
            <div className="flex items-center gap-1.5">
              <span>待处理:</span>
              <span className="font-medium text-components-system-header-title">{latestHeartbeat?.pending || 0}</span>
            </div>
            {latestHeartbeat?.boot_at && (
              <>
                <div className="h-3 w-px bg-components-system-section-divider" />
                <div className="flex items-center gap-1.5" title={`启动时间: ${new Date(latestHeartbeat.boot_at).toLocaleString('zh-CN')}`}>
                  <span>启动:</span>
                  <span className="font-medium text-components-system-header-title">{new Date(latestHeartbeat.boot_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="h-52 md:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-components-system-chart-grid)" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 11, fill: 'var(--color-components-system-chart-axis)' }}
                  axisLine={{ stroke: 'var(--color-components-system-chart-grid)' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'var(--color-components-system-chart-axis)' }} 
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                {anomalyRegions.map((region, index) => (
                  <ReferenceArea
                    key={`${region.level}-${region.x1}-${region.x2}-${index}`}
                    x1={region.x1}
                    x2={region.x2}
                    y1={0}
                    y2="auto"
                    ifOverflow="extendDomain"
                    fill={region.level === 'error'
                      ? 'var(--color-components-system-health-error-bg)'
                      : 'var(--color-components-system-health-warning-bg)'}
                    stroke={region.level === 'error'
                      ? 'var(--color-components-system-health-error-border)'
                      : 'var(--color-components-system-health-warning-border)'}
                    fillOpacity={0.45}
                    strokeOpacity={0.75}
                  />
                ))}
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
          <div className="flex h-64 items-center justify-center rounded-lg border border-components-system-empty-border bg-components-system-empty-bg">
            <p className="text-sm text-components-system-chart-tooltip-muted">暂无数据</p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 border-t border-components-system-section-divider pt-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.done.main }} />
              <div className="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-20" style={{ backgroundColor: COLORS.done.main }} />
            </div>
            <span className="text-xs font-medium text-components-system-chart-info-pill-text">已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.failed.main }} />
            <span className="text-xs font-medium text-components-system-chart-info-pill-text">失败</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.pending.main }} />
            <span className="text-xs font-medium text-components-system-chart-info-pill-text">待处理</span>
          </div>
          {anomalySummary.error > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-4 rounded-sm border border-components-system-health-error-border bg-components-system-health-error-bg" />
              <span className="text-xs font-medium text-components-system-chart-info-pill-text">失败异常区间</span>
            </div>
          )}
          {anomalySummary.warning > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-4 rounded-sm border border-components-system-health-warning-border bg-components-system-health-warning-bg" />
              <span className="text-xs font-medium text-components-system-chart-info-pill-text">高延迟区间</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 固定显示的详细信息 */}
      {pinnedData && <PinnedTooltip data={pinnedData} />}
    </Card>
  )
}

export { TaskExecutorChart }
