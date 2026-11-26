import type { ReactNode } from 'react'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartVariant } from './chart-card'
import { useChartTheme } from './chart-theme'

export interface TimeSeriesMark {
  /** The numeric field of each row this mark draws. */
  key: string
  label: string
  color: string
  /** Marks with the same id add up: stacked bars, or stacked areas as lines. Without one a mark stands alone. */
  stackId?: string
}

interface TimeSeriesChartProps<Row> {
  data: Row[]
  /** The field of each row that names its bucket on the axis. */
  xKey: keyof Row & string
  marks: TimeSeriesMark[]
  /** Bars for amounts per bucket, lines for how a quantity moves. */
  variant: ChartVariant
  formatValue: (value: number) => string
  /** The tooltip of one bucket; the chart places it and follows the pointer or arrow keys. */
  renderTooltip: (row: Row) => ReactNode
  /** What a screen reader calls the chart. */
  label: string
  height?: number
}

/**
 * One or more series over time buckets, drawn by Recharts with the product's
 * colours, a gridded value axis and a tooltip that lists a bucket's figures.
 * Recharts' accessibility layer makes the chart focusable and moves the
 * tooltip with the arrow keys.
 */
export function TimeSeriesChart<Row extends object>({
  data,
  xKey,
  marks,
  variant,
  formatValue,
  renderTooltip,
  label,
  height = 208,
}: TimeSeriesChartProps<Row>) {
  const theme = useChartTheme()
  const tick = { fill: theme.tick, fontSize: 12 }
  const bars = variant === 'bar'
  // A bar chart highlights the whole bucket under the pointer; a line chart marks it with a rule.
  const Chart = bars ? BarChart : ComposedChart
  const lastOfStack = new Map(marks.map((mark) => [mark.stackId, mark.key]))
  return (
    <Chart
      responsive
      data={data}
      title={label}
      style={{ width: '100%', height }}
      margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      barCategoryGap="16%"
      barGap={2}
    >
      <CartesianGrid
        vertical={false}
        stroke={theme.grid}
        strokeDasharray="3 3"
      />
      <XAxis
        dataKey={xKey as string}
        tick={tick}
        tickLine={false}
        axisLine={{ stroke: theme.axis }}
        minTickGap={24}
        interval="preserveStartEnd"
      />
      <YAxis
        width="auto"
        tick={tick}
        tickLine={false}
        axisLine={false}
        tickCount={4}
        tickFormatter={formatValue}
      />
      <Tooltip
        cursor={
          bars ? { fill: theme.cursor, stroke: 'none' } : { stroke: theme.axis }
        }
        isAnimationActive={false}
        offset={12}
        content={({ active, payload }) => {
          const row = active
            ? (payload?.[0]?.payload as Row | undefined)
            : undefined
          return row ? renderTooltip(row) : null
        }}
      />
      {marks.map((mark) =>
        bars ? (
          <Bar
            key={mark.key}
            dataKey={mark.key}
            name={mark.label}
            stackId={mark.stackId}
            fill={mark.color}
            maxBarSize={40}
            isAnimationActive={false}
            radius={
              mark.stackId === undefined ||
              lastOfStack.get(mark.stackId) === mark.key
                ? [3, 3, 0, 0]
                : 0
            }
          />
        ) : mark.stackId === undefined ? (
          <Line
            key={mark.key}
            dataKey={mark.key}
            name={mark.label}
            type="linear"
            stroke={mark.color}
            strokeWidth={2}
            dot={{ r: 2, strokeWidth: 0, fill: mark.color }}
            activeDot={{ r: 4, strokeWidth: 0 }}
            connectNulls
            isAnimationActive={false}
          />
        ) : (
          <Area
            key={mark.key}
            dataKey={mark.key}
            name={mark.label}
            stackId={mark.stackId}
            type="linear"
            stroke={mark.color}
            strokeWidth={2}
            fill={mark.color}
            fillOpacity={0.16}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        ),
      )}
    </Chart>
  )
}
