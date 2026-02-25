import React, { memo } from 'react'

interface SearchDetailStatusBarProps {
  kbCount: number
  latencyMs?: number
}

const formatLatency = (latencyMs?: number) => {
  if (!latencyMs) return '--'
  if (latencyMs < 1000) return `${latencyMs}ms`
  return `${(latencyMs / 1000).toFixed(1)}s`
}

const SearchDetailStatusBar: React.FC<SearchDetailStatusBarProps> = ({ kbCount, latencyMs }) => {
  return (
    <div className="shrink-0 h-7 border-t border-border-default bg-surface-secondary px-space-base">
      <div className="h-full flex items-center justify-between gap-space-sm text-xs text-text-tertiary">
        <div className="flex items-center gap-space-sm">
          <span>Knowledge Bases: {kbCount}</span>
          <span>·</span>
          <span>Retrieval v2</span>
          <span>·</span>
          <span>Latency {formatLatency(latencyMs)}</span>
        </div>
        <span>Cost: --</span>
      </div>
    </div>
  )
}

export default memo(SearchDetailStatusBar)
