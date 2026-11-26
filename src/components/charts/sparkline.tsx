import { Area, AreaChart, Tooltip, YAxis } from 'recharts'

/**
 * A series as a small area with no axes, for the trend under a headline
 * number. It reports the point under the pointer so the caller can read that
 * moment out next to the number; nothing is drawn for a flat-zero series.
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
  if (values.length < 2 || !values.some((value) => value > 0))
    return <div aria-hidden="true" style={{ height }} />
  return (
    <div aria-hidden="true">
      <AreaChart
        responsive
        accessibilityLayer={false}
        data={values.map((value) => ({ value }))}
        style={{ width: '100%', height }}
        margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
        onMouseMove={(state) => {
          const index = Number(state.activeTooltipIndex)
          onActive?.(
            state.isTooltipActive && Number.isInteger(index) ? index : null,
          )
        }}
        onMouseLeave={() => onActive?.(null)}
      >
        <YAxis hide domain={[0, 'dataMax']} />
        {/* No tooltip box: the caller shows the value; this only draws the marker line. */}
        <Tooltip
          content={() => null}
          cursor={{ stroke: color, strokeWidth: 1 }}
          isAnimationActive={false}
        />
        <Area
          dataKey="value"
          type="monotone"
          stroke={color}
          strokeWidth={1.5}
          fill={color}
          fillOpacity={0.12}
          isAnimationActive={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
      </AreaChart>
    </div>
  )
}
