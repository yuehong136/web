import type { ReactNode } from 'react'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useChartTheme } from './chart-theme'

export interface TimeSeriesMark {
  /** The numeric field of each row this mark draws. */
  key: string
  label: string
  color: string
  /** Bars for counts per bucket, an area for a quantity that flows. */
  kind: 'bar' | 'area'
  /** Marks with the same id stack from one baseline. */
  stackId?: string
}

interface TimeSeriesChartProps<Row> {
  data: Row[]
  /** The field of each row that names its bucket on the axis. */
  xKey: keyof Row & string
  marks: TimeSeriesMark[]
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
  formatValue,
  renderTooltip,
  label,
  height = 208,
}: TimeSeriesChartProps<Row>) {
  const theme = useChartTheme()
  const tick = { fill: theme.tick, fontSize: 12 }
  const lastBar = marks.filter((mark) => mark.kind === 'bar').at(-1)?.key
  // A bar chart highlights the whole bucket under the pointer; a mixed one marks it with a line.
  const barsOnly = marks.every((mark) => mark.kind === 'bar')
  const Chart = barsOnly ? BarChart : ComposedChart
  return (
    <Chart
      responsive
      data={data}
      title={label}
      style={{ width: '100%', height }}
      margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      barCategoryGap="12%"
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
        width={48}
        tick={tick}
        tickLine={false}
        axisLine={false}
        tickCount={4}
        tickFormatter={formatValue}
      />
      <Tooltip
        cursor={
          barsOnly
            ? { fill: theme.cursor, stroke: 'none' }
            : { stroke: theme.axis }
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
        mark.kind === 'bar' ? (
          <Bar
            key={mark.key}
            dataKey={mark.key}
            name={mark.label}
            stackId={mark.stackId}
            fill={mark.color}
            maxBarSize={48}
            isAnimationActive={false}
            radius={mark.key === lastBar ? [3, 3, 0, 0] : 0}
          />
        ) : (
          <Area
            key={mark.key}
            dataKey={mark.key}
            name={mark.label}
            stackId={mark.stackId}
            type="monotone"
            stroke={mark.color}
            strokeWidth={2}
            fill={mark.color}
            fillOpacity={0.14}
            isAnimationActive={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ),
      )}
    </Chart>
  )
}
