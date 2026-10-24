import React, { memo, useId } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const exportDisabledReasonId = useId()

  return (
    <header className="shrink-0 border-b border-border-default bg-surface-primary px-space-base py-space-sm">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex min-w-0 items-center gap-space-sm">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            title={t('searchPage.workspace.back')}
            aria-label={t('searchPage.workspace.back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-text-primary">
              {appName}
            </h2>
            <p className="text-xs text-text-tertiary">
              {t('searchPage.workspace.status', {
                count: kbCount,
                phase: phaseLabel,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-xs">
          {hasTurns ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClear}
              title={t('searchPage.workspace.clear')}
              aria-label={t('searchPage.workspace.clear')}
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
                    ? t('searchPage.workspace.closeMindmap')
                    : t('searchPage.workspace.openMindmap')
                  : t('searchPage.workspace.noMindmap')
              }
              aria-label={
                canOpenMindmap
                  ? mindmapOpen
                    ? t('searchPage.workspace.closeMindmap')
                    : t('searchPage.workspace.openMindmap')
                  : t('searchPage.workspace.noMindmap')
              }
            >
              <BrainCircuit className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onShare}
            title={t('searchPage.workspace.share')}
            aria-label={t('searchPage.workspace.share')}
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
            title={
              settingsOpen
                ? t('searchPage.workspace.closeSettings')
                : t('searchPage.workspace.openSettings')
            }
            aria-label={
              settingsOpen
                ? t('searchPage.workspace.closeSettings')
                : t('searchPage.workspace.openSettings')
            }
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default memo(SearchDetailHeader)
