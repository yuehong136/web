import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import { SearchExecutionMode, SearchSourceMode } from '@/types/search'

interface SearchRuntimeControlsProps {
  mode: SearchExecutionMode
  source: SearchSourceMode
  webSourceEnabled: boolean
  onModeChange: (mode: SearchExecutionMode) => void
  onSourceChange: (source: SearchSourceMode) => void
}

const MODE_OPTIONS: Array<{ label: string; value: SearchExecutionMode }> = [
  { label: '快速问答', value: SearchExecutionMode.QUICK_QA },
  { label: '深度研究', value: SearchExecutionMode.DEEP_RESEARCH },
  { label: '任务执行', value: SearchExecutionMode.TASK_EXECUTION },
]

const SOURCE_OPTIONS: Array<{ label: string; value: SearchSourceMode }> = [
  { label: '知识库', value: SearchSourceMode.KNOWLEDGE_BASE },
  { label: 'Web', value: SearchSourceMode.WEB },
  { label: '混合', value: SearchSourceMode.HYBRID },
]

const SearchRuntimeControls: React.FC<SearchRuntimeControlsProps> = ({
  mode,
  source,
  webSourceEnabled,
  onModeChange,
  onSourceChange,
}) => {
  return (
    <div className="flex items-center justify-between gap-space-sm px-space-xs py-space-xs text-xs text-text-tertiary flex-wrap">
      <div className="flex items-center gap-space-xs flex-wrap">
        <span className="text-text-secondary">Mode:</span>
        {MODE_OPTIONS.map((item) => {
          const active = item.value === mode
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onModeChange(item.value)}
              className={cn(
                'inline-flex items-center rounded-radius-full border px-space-sm py-1 transition-colors',
                active
                  ? 'border-border-accent bg-surface-accent-subtle text-text-accent'
                  : 'border-border-default bg-surface-secondary text-text-secondary hover:text-text-primary'
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-space-xs flex-wrap">
        <span className="text-text-secondary">Source:</span>
        {SOURCE_OPTIONS.map((item) => {
          const active = item.value === source
          const disabled = !webSourceEnabled && item.value !== SearchSourceMode.KNOWLEDGE_BASE
          return (
            <button
              key={item.value}
              type="button"
              disabled={disabled}
              onClick={() => onSourceChange(item.value)}
              title={disabled ? '当前应用未开启 Web 来源' : undefined}
              className={cn(
                'inline-flex items-center rounded-radius-full border px-space-sm py-1 transition-colors',
                disabled
                  ? 'cursor-not-allowed border-border-default bg-surface-secondary text-text-tertiary opacity-60'
                  : active
                    ? 'border-border-accent bg-surface-accent-subtle text-text-accent'
                    : 'border-border-default bg-surface-secondary text-text-secondary hover:text-text-primary'
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default memo(SearchRuntimeControls)
