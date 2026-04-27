import React from 'react'
import { Loader2, Search, SendHorizontal, Settings as SettingsIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface SearchPanelProps {
  query: string
  isSearching: boolean
  searchModeLabel: string
  activeConfigBadges: string[]
  onQueryChange: (value: string) => void
  onSearch: () => void
  onOpenConfig: () => void
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  query,
  isSearching,
  searchModeLabel,
  activeConfigBadges,
  onQueryChange,
  onSearch,
  onOpenConfig,
}) => {
  return (
    <section className="flex h-full w-[420px] shrink-0 flex-col overflow-hidden border-r border-border-default pr-space-xl">
      <div className="flex items-start justify-between gap-space-base pb-space-lg">
        <div className="flex items-start gap-space-sm">
          <Search className="mt-1 h-5 w-5 text-text-accent" />
          <div>
            <h2 className="text-base font-semibold text-text-primary">查询条件</h2>
            <p className="mt-1 text-xs text-text-tertiary">配置一次检索任务</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onOpenConfig} className="shrink-0">
          <SettingsIcon className="h-4 w-4" />
          {searchModeLabel}
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <div className="space-y-space-sm">
          <label className="block text-sm font-medium text-text-primary">查询文本</label>
          <div className="relative rounded-radius-lg border border-components-input-border bg-background-surface transition-colors focus-within:border-components-input-border-focus">
            <Textarea
              variant="chat"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  onSearch()
                }
              }}
              placeholder="请输入要检索的问题或文本..."
              className="h-[200px] resize-none px-space-base py-space-base pb-space-2xl leading-relaxed"
            />
            <span className="absolute bottom-space-sm left-space-base right-space-2xl truncate pr-space-md text-xs text-text-tertiary">
              {query.length} 字符
              <span className="ml-space-sm hidden md:inline">Enter 检索，Shift+Enter 换行</span>
            </span>
            <Button
              type="button"
              onClick={onSearch}
              disabled={!query.trim() || isSearching}
              size="icon-sm"
              aria-label="开始检索"
              title="开始检索"
              className="absolute bottom-space-sm right-space-sm"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="mt-space-xl border-t border-border-default pt-space-base">
          <div className="mb-space-sm flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">检索参数（高级）</h3>
            <Button variant="ghost" size="sm" onClick={onOpenConfig} className="h-7 px-space-xs text-xs">
              设置
            </Button>
          </div>
          <div className="flex flex-wrap gap-space-xs">
            {activeConfigBadges.map((badge) => (
              <Badge key={badge} variant="secondary" className="text-xs font-normal">
                {badge}
              </Badge>
            ))}
          </div>
          <p className="mt-space-sm text-xs text-text-tertiary">如需修改参数，请在设置中调整。</p>
        </div>
      </div>
    </section>
  )
}
