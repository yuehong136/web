import type { TaskExecutorHeartbeat } from '@/api/system'

// 定义颜色常量
export const COLORS = {
  done: {
    main: 'var(--color-components-system-chart-done)',
    light: 'var(--color-components-system-chart-done-soft)',
  },
  failed: {
    main: 'var(--color-components-system-chart-failed)',
    light: 'var(--color-components-system-chart-failed-soft)',
  },
  pending: {
    main: 'var(--color-components-system-chart-pending)',
    light: 'var(--color-components-system-chart-pending-soft)',
  },
  lag: 'var(--color-components-system-chart-lag)',
} as const

export interface ChartDataPoint {
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

// 自定义可点击的圆点组件
export const CustomDot = ({
  cx,
  cy,
  payload,
  fill,
  onPin,
}: ChartDotProps & { onPin: (data: ChartDataPoint) => void }) => {
  if (cx === undefined || cy === undefined || !fill) return null
  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation()
        if (payload) onPin(payload)
      }}
    >
      <circle cx={cx} cy={cy} r={6} fill={fill} fillOpacity={0.15} />
      <circle
        cx={cx}
        cy={cy}
        r={3.5}
        fill="var(--color-components-system-chart-tooltip-bg)"
        stroke={fill}
        strokeWidth={2}
      />
    </g>
  )
}

// 自定义活跃圆点组件
export const CustomActiveDot = ({
  cx,
  cy,
  payload,
  fill,
  onPin,
}: ChartDotProps & { onPin: (data: ChartDataPoint) => void }) => {
  if (cx === undefined || cy === undefined || !fill) return null
  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation()
        if (payload) onPin(payload)
      }}
    >
      <circle cx={cx} cy={cy} r={10} fill={fill} fillOpacity={0.2} />
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="var(--color-components-system-chart-tooltip-bg)"
        stroke={fill}
        strokeWidth={2.5}
      />
    </g>
  )
}

// 自定义Tooltip（悬停时的简单提示）
export const CustomTooltip = ({
  active,
  payload,
  label,
  pinned,
}: ChartTooltipProps & { pinned: boolean }) => {
  // 如果有固定数据，不显示悬停 tooltip
  if (pinned) return null

  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-components-system-chart-tooltip-border bg-components-system-chart-tooltip-bg px-3 py-2 shadow-shadow-md">
        <p className="mb-1 text-xs font-semibold text-components-system-chart-tooltip-text">
          时间: {label ?? '-'}
        </p>
        <p className="text-xs text-components-system-chart-tooltip-muted">
          点击查看详细信息
        </p>
      </div>
    )
  }
  return null
}

// 固定显示的详细信息组件
export const PinnedTooltip = ({
  data,
  onClose,
}: {
  data: ChartDataPoint
  onClose: () => void
}) => {
  const hasCurrentTask = data?.current && Object.keys(data.current).length > 0

  return (
    <div className="absolute right-4 top-4 z-10 max-w-sm overflow-hidden rounded-xl border border-components-system-chart-tooltip-border bg-components-system-chart-tooltip-bg shadow-shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-components-system-section-divider bg-components-system-chart-info-pill-bg px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: COLORS.done.main }}
          />
          <h4 className="text-sm font-semibold text-components-system-chart-tooltip-text">
            时间: {data.time}
          </h4>
        </div>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-components-icon-button-bg-hover"
          style={{
            color: 'var(--color-components-system-chart-tooltip-muted)',
          }}
          title="关闭"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4 p-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ backgroundColor: COLORS.done.light }}
          >
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS.done.main }}
            />
            <div>
              <p className="text-xs text-components-system-chart-tooltip-muted">
                已完成
              </p>
              <p
                className="text-sm font-semibold"
                style={{ color: COLORS.done.main }}
              >
                {data.done}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ backgroundColor: COLORS.failed.light }}
          >
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS.failed.main }}
            />
            <div>
              <p className="text-xs text-components-system-chart-tooltip-muted">
                失败
              </p>
              <p
                className="text-sm font-semibold"
                style={{ color: COLORS.failed.main }}
              >
                {data.failed}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ backgroundColor: COLORS.pending.light }}
          >
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS.pending.main }}
            />
            <div>
              <p className="text-xs text-components-system-chart-tooltip-muted">
                待处理
              </p>
              <p
                className="text-sm font-semibold"
                style={{ color: COLORS.pending.main }}
              >
                {data.pending}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-components-system-chart-info-pill-bg px-3 py-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS.lag }}
            />
            <div>
              <p className="text-xs text-components-system-chart-tooltip-muted">
                延迟
              </p>
              <p className="text-sm font-semibold text-components-system-chart-tooltip-text">
                {data.lag}s
              </p>
            </div>
          </div>
        </div>

        {/* 当前任务信息 */}
        {hasCurrentTask && (
          <div className="border-t border-components-system-section-divider pt-3">
            <p className="mb-2 text-xs font-medium text-components-system-chart-tooltip-muted">
              当前任务
            </p>
            <div className="max-h-48 space-y-2 overflow-y-auto scrollbar-thin">
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
                    <span className="text-xs font-medium text-components-system-chart-tooltip-muted">
                      {key}:
                    </span>
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
            <p className="text-xs text-components-system-chart-tooltip-muted">
              暂无当前任务
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
