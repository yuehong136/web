import React, { memo, useId } from 'react'
import {
  ArrowLeft,
  BrainCircuit,
  Download,
  RotateCcw,
  Settings,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchDetailHeaderProps {
  appName: string
  kbCount: number
  phaseLabel: string
  hasTurns: boolean
  canOpenMindmap: boolean
  mindmapOpen: boolean
  settingsOpen: boolean
  canExport: boolean
  exportLabel: string
  exportDisabledReason: string
  onBack: () => void
  onClear: () => void
  onToggleMindmap: () => void
  onShare: () => void
  onExport: () => void
  onToggleSettings: () => void
}

const SearchDetailHeader: React.FC<SearchDetailHeaderProps> = ({
  appName,
  kbCount,
  phaseLabel,
  hasTurns,
  canOpenMindmap,
  mindmapOpen,
  settingsOpen,
  canExport,
  exportLabel,
  exportDisabledReason,
  onBack,
  onClear,
  onToggleMindmap,
  onShare,
  onExport,
  onToggleSettings,
}) => {
  const exportDisabledReasonId = useId()

  return (
    <header className="bg-surface-primary px-space-base py-space-sm shrink-0 border-b border-border-default">
      <div className="gap-space-sm flex items-center justify-between">
        <div className="gap-space-sm flex min-w-0 items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            title="返回搜索列表"
            aria-label="返回搜索列表"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-text-primary">
              {appName}
            </h2>
            <p className="text-xs text-text-tertiary">
              {kbCount} 个知识库 · 当前状态 {phaseLabel}
            </p>
          </div>
        </div>

        <div className="gap-space-xs flex items-center">
          {hasTurns ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClear}
              title="清空当前会话"
              aria-label="清空当前会话"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          ) : null}
          {hasTurns ? (
            <Button
              variant={mindmapOpen ? 'outline' : 'ghost'}
              size="icon-sm"
              onClick={onToggleMindmap}
              disabled={!canOpenMindmap}
              title={
                canOpenMindmap
                  ? mindmapOpen
                    ? '收起思维导图'
                    : '打开思维导图'
                  : '当前轮次暂无思维导图数据'
              }
              aria-label={
                canOpenMindmap
                  ? mindmapOpen
                    ? '收起思维导图'
                    : '打开思维导图'
                  : '当前轮次暂无思维导图数据'
              }
            >
              <BrainCircuit className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onShare}
            title="复制分享链接"
            aria-label="复制分享链接"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          {hasTurns ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onExport}
              disabled={!canExport}
              title={canExport ? exportLabel : exportDisabledReason}
              aria-label={exportLabel}
              aria-describedby={canExport ? undefined : exportDisabledReasonId}
            >
              <Download className="size-icon-sm" />
            </Button>
          ) : null}
          {hasTurns && !canExport ? (
            <span id={exportDisabledReasonId} className="sr-only">
              {exportDisabledReason}
            </span>
          ) : null}
          <Button
            variant={settingsOpen ? 'outline' : 'ghost'}
            size="icon-sm"
            onClick={onToggleSettings}
            title={settingsOpen ? '收起配置' : '配置'}
            aria-label={settingsOpen ? '收起配置' : '配置'}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default memo(SearchDetailHeader)
