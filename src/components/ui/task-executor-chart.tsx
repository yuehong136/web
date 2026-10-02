import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
} from 'recharts'
import { Card } from './card'
import { cn } from '@/lib/utils'
import type { TaskExecutorHeartbeat } from '@/api/system'

import {
  COLORS,
  CustomDot,
  CustomActiveDot,
  CustomTooltip,
  PinnedTooltip,
  type ChartDataPoint,
} from '@/components/ui/task-executor-chart-parts'

interface TaskExecutorChartProps {
  executorId: string
  heartbeats: TaskExecutorHeartbeat[]
  className?: string
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
  className,
}) => {
  // 固定显示的数据点状态
  const [pinnedData, setPinnedData] = React.useState<ChartDataPoint | null>(
    null,
  )
  // 转换数据格式
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    return heartbeats
      .map((item) => {
        const nowDate = new Date(item.now)
        return {
          time: nowDate.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          done: item.done,
          failed: item.failed,
          pending: item.pending,
          lag: item.lag,
          timestamp: nowDate.getTime(),
          current: item.current as Record<string, unknown>,
          heartbeat: item,
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
      { error: 0, warning: 0 },
    )
  }, [anomalyRegions])

  // 计算当前状态
  const latestHeartbeat = heartbeats[heartbeats.length - 1]
  const currentLag = latestHeartbeat ? latestHeartbeat.lag : 0

  return (
    <Card
      className={cn(
        'relative border-t-2 border-components-system-status-card-border border-t-components-system-accent-border bg-components-system-status-card-bg shadow-components-system-status-card-shadow',
        className,
      )}
    >
      <div className="p-4 md:p-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-components-system-accent-text" />
            <h3 className="font-semibold text-components-system-header-title">
              任务执行器
            </h3>
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
              <span className="font-medium text-components-system-header-title">
                {latestHeartbeat?.name || executorId}
              </span>
            </div>
            <div className="h-3 w-px bg-components-system-section-divider" />
            <div className="flex items-center gap-1.5">
              <span>延迟:</span>
              <span className="font-medium text-components-system-header-title">
                {currentLag}s
              </span>
            </div>
            <div className="h-3 w-px bg-components-system-section-divider" />
            <div className="flex items-center gap-1.5">
              <span>待处理:</span>
              <span className="font-medium text-components-system-header-title">
                {latestHeartbeat?.pending || 0}
              </span>
            </div>
            {latestHeartbeat?.boot_at && (
              <>
                <div className="h-3 w-px bg-components-system-section-divider" />
                <div
                  className="flex items-center gap-1.5"
                  title={`启动时间: ${new Date(latestHeartbeat.boot_at).toLocaleString('zh-CN')}`}
                >
                  <span>启动:</span>
                  <span className="font-medium text-components-system-header-title">
                    {new Date(latestHeartbeat.boot_at).toLocaleDateString(
                      'zh-CN',
                    )}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="h-52 md:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-components-system-chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: 11,
                    fill: 'var(--color-components-system-chart-axis)',
                  }}
                  axisLine={{
                    stroke: 'var(--color-components-system-chart-grid)',
                  }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: 'var(--color-components-system-chart-axis)',
                  }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip
                  content={<CustomTooltip pinned={pinnedData !== null} />}
                />
                {anomalyRegions.map((region, index) => (
                  <ReferenceArea
                    key={`${region.level}-${region.x1}-${region.x2}-${index}`}
                    x1={region.x1}
                    x2={region.x2}
                    y1={0}
                    y2="auto"
                    ifOverflow="extendDomain"
                    fill={
                      region.level === 'error'
                        ? 'var(--color-components-system-health-error-bg)'
                        : 'var(--color-components-system-health-warning-bg)'
                    }
                    stroke={
                      region.level === 'error'
                        ? 'var(--color-components-system-health-error-border)'
                        : 'var(--color-components-system-health-warning-border)'
                    }
                    fillOpacity={0.45}
                    strokeOpacity={0.75}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="done"
                  stroke={COLORS.done.main}
                  strokeWidth={2.5}
                  dot={
                    <CustomDot onPin={setPinnedData} fill={COLORS.done.main} />
                  }
                  activeDot={
                    <CustomActiveDot
                      onPin={setPinnedData}
                      fill={COLORS.done.main}
                    />
                  }
                  name="已完成"
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke={COLORS.failed.main}
                  strokeWidth={2.5}
                  dot={
                    <CustomDot
                      onPin={setPinnedData}
                      fill={COLORS.failed.main}
                    />
                  }
                  activeDot={
                    <CustomActiveDot
                      onPin={setPinnedData}
                      fill={COLORS.failed.main}
                    />
                  }
                  name="失败"
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke={COLORS.pending.main}
                  strokeWidth={2.5}
                  dot={
                    <CustomDot
                      onPin={setPinnedData}
                      fill={COLORS.pending.main}
                    />
                  }
                  activeDot={
                    <CustomActiveDot
                      onPin={setPinnedData}
                      fill={COLORS.pending.main}
                    />
                  }
                  name="待处理"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-lg border border-components-system-empty-border bg-components-system-empty-bg">
            <p className="text-sm text-components-system-chart-tooltip-muted">
              暂无数据
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 border-t border-components-system-section-divider pt-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS.done.main }}
              />
              <div
                className="absolute inset-0 h-3 w-3 animate-ping rounded-full opacity-20"
                style={{ backgroundColor: COLORS.done.main }}
              />
            </div>
            <span className="text-xs font-medium text-components-system-chart-info-pill-text">
              已完成
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: COLORS.failed.main }}
            />
            <span className="text-xs font-medium text-components-system-chart-info-pill-text">
              失败
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: COLORS.pending.main }}
            />
            <span className="text-xs font-medium text-components-system-chart-info-pill-text">
              待处理
            </span>
          </div>
          {anomalySummary.error > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-4 rounded-sm border border-components-system-health-error-border bg-components-system-health-error-bg" />
              <span className="text-xs font-medium text-components-system-chart-info-pill-text">
                失败异常区间
              </span>
            </div>
          )}
          {anomalySummary.warning > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-4 rounded-sm border border-components-system-health-warning-border bg-components-system-health-warning-bg" />
              <span className="text-xs font-medium text-components-system-chart-info-pill-text">
                高延迟区间
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 固定显示的详细信息 */}
      {pinnedData && (
        <PinnedTooltip data={pinnedData} onClose={() => setPinnedData(null)} />
      )}
    </Card>
  )
}

export { TaskExecutorChart }
