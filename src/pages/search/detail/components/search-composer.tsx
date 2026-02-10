import React, { memo, useCallback, useState } from 'react'
import { ArrowUp, Loader2, Square } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface SearchComposerProps {
  onSearch: (query: string) => void
  onStop: () => void
  isSearching: boolean
  placeholder?: string
}

const SearchComposer: React.FC<SearchComposerProps> = ({
  onSearch,
  onStop,
  isSearching,
  placeholder = '输入问题并回车发送，Shift+Enter 换行',
}) => {
  const [value, setValue] = useState('')

  const handleSubmit = useCallback(() => {
    const next = value.trim()
    if (!next || isSearching) return
    onSearch(next)
    setValue('')
  }, [isSearching, onSearch, value])

  return (
    <div className="rounded-radius-xl border border-border-default bg-surface-primary p-space-sm">
      <Textarea
        variant="chat"
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        className="min-h-[64px] w-full resize-none text-sm text-text-primary placeholder:text-text-tertiary"
        placeholder={placeholder}
      />

      <div className="mt-space-xs flex items-center justify-between">
        <p className="text-xs text-text-tertiary">
          基于当前搜索应用配置进行检索与总结
        </p>
        {isSearching ? (
          <button
            type="button"
            onClick={onStop}
            className="h-9 w-9 rounded-full bg-state-error text-text-inverted flex items-center justify-center hover:brightness-90"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={cn(
              'h-9 w-9 rounded-full flex items-center justify-center transition-colors',
              value.trim()
                ? 'bg-components-button-primary-bg text-components-button-primary-text hover:bg-components-button-primary-bg-hover'
                : 'bg-background-subtle text-text-tertiary'
            )}
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

export default memo(SearchComposer)
