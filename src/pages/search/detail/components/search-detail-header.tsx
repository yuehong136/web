import React, { memo } from 'react'
import { ArrowLeft, BrainCircuit, Download, RotateCcw, Settings, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchDetailHeaderProps {
  appName: string
  kbCount: number
  phaseLabel: string
  hasTurns: boolean
  canOpenMindmap: boolean
  mindmapOpen: boolean
  settingsOpen: boolean
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
  onBack,
  onClear,
  onToggleMindmap,
  onShare,
  onExport,
  onToggleSettings,
}) => {
  return (
    <header className="shrink-0 border-b border-border-default bg-surface-primary px-space-base py-space-sm">
      <div className="flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm min-w-0">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-text-primary truncate">{appName}</h2>
            <p className="text-xs text-text-tertiary">
              {kbCount} 个知识库 · 当前状态 {phaseLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-xs">
          {hasTurns ? (
            <Button variant="ghost" size="icon-sm" onClick={onClear} title="清空当前会话">
              <RotateCcw className="h-4 w-4" />
            </Button>
          ) : null}
          {hasTurns ? (
            <Button
              variant={mindmapOpen ? 'outline' : 'ghost'}
              size="icon-sm"
              onClick={onToggleMindmap}
              disabled={!canOpenMindmap}
              title={canOpenMindmap ? (mindmapOpen ? '收起思维导图' : '打开思维导图') : '当前轮次暂无思维导图数据'}
            >
              <BrainCircuit className="h-4 w-4" />
            </Button>
          ) : null}
          <Button variant="ghost" size="icon-sm" onClick={onShare} title="复制分享链接">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onExport} title="导出">
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant={settingsOpen ? 'outline' : 'ghost'}
            size="icon-sm"
            onClick={onToggleSettings}
            title={settingsOpen ? '收起配置' : '配置'}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default memo(SearchDetailHeader)
