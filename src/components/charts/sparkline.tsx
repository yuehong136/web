import { Bar, BarChart, Tooltip, YAxis } from 'recharts'
import { useChartTheme } from './chart-theme'

/**
 * A series as a row of small bars with no axes, for the trend under a
 * headline number. Bars, not a smoothed line: a line through two busy days in
 * a quiet week draws a hill that never happened. It reports the bucket under
 * the pointer so the caller can read that moment out next to the number;
 * nothing is drawn for a flat-zero series.
 */
export function Sparkline({
  values,
  color,
  onActive,
  height = 36,
}: {
  values: number[]
  color: string
  onActive?: (index: number | null) => void
  height?: number
}) {
  const theme = useChartTheme()
  if (values.length < 2 || !values.some((value) => value > 0))
    return <div aria-hidden="true" style={{ height }} />
  return (
    <div aria-hidden="true" className="border-b border-line-subtle">
      <BarChart
        responsive
        accessibilityLayer={false}
        data={values.map((value) => ({ value }))}
        style={{ width: '100%', height }}
        margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
        barCategoryGap="18%"
        onMouseMove={(state) => {
          const index = Number(state.activeTooltipIndex)
          onActive?.(
            state.isTooltipActive && Number.isInteger(index) ? index : null,
          )
        }}
        onMouseLeave={() => onActive?.(null)}
      >
        <YAxis hide domain={[0, 'dataMax']} />
        {/* No tooltip box: the caller shows the value; this only highlights the bucket. */}
        <Tooltip
          content={() => null}
          cursor={{ fill: theme.cursor, stroke: 'none' }}
          isAnimationActive={false}
        />
        <Bar
          dataKey="value"
          fill={color}
          radius={[2, 2, 0, 0]}
          minPointSize={1}
          isAnimationActive={false}
        />
      </BarChart>
    </div>
  )
}
