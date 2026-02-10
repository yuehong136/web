import React, { memo } from 'react'
import { Sparkles } from 'lucide-react'

interface SearchSummaryCardProps {
  summary: string
  isStreaming: boolean
}

const SearchSummaryCard: React.FC<SearchSummaryCardProps> = ({ summary, isStreaming }) => {
  if (!summary && !isStreaming) return null

  return (
    <div className="rounded-radius-xl border border-border-default bg-surface-primary overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-text-accent via-state-info to-state-success" />
      <div className="p-space-base">
        <div className="flex items-center gap-2 mb-space-sm">
          <Sparkles className="h-4 w-4 text-text-accent" />
          <span className="text-sm font-medium text-text-accent">AI 摘要</span>
        </div>

        {summary ? (
          <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {summary}
            {isStreaming ? (
              <span className="inline-block ml-1 h-4 w-1.5 rounded-radius-sm bg-text-accent animate-pulse" />
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-4 rounded-radius-md bg-background-subtle animate-pulse w-full" />
            <div className="h-4 rounded-radius-md bg-background-subtle animate-pulse w-4/5" />
            <div className="h-4 rounded-radius-md bg-background-subtle animate-pulse w-3/5" />
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(SearchSummaryCard)
