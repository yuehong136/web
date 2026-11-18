import React, { memo, useId } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  BrainCircuit,
  Database,
  Download,
  RotateCcw,
  Settings,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { StatusDot } from '@/components/studio/collection-identity'
import { SearchExecutionPhase } from '@/types/search'
import { SEARCH_PHASE_TONE } from './search-phase-tone'

interface SearchDetailHeaderProps {
  appName: string
  /** Search app id: keeps the avatar tone the same as on the list. */
  appId?: string
  avatar?: string | null
  description?: string
  kbCount: number
  phase?: SearchExecutionPhase
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
  appId,
  avatar,
  description,
  kbCount,
  phase = SearchExecutionPhase.IDLE,
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
  const mindmapLabel = canOpenMindmap
    ? mindmapOpen
      ? t('searchPage.workspace.closeMindmap')
      : t('searchPage.workspace.openMindmap')
    : t('searchPage.workspace.noMindmap')
  const settingsLabel = settingsOpen
    ? t('searchPage.workspace.closeSettings')
    : t('searchPage.workspace.openSettings')

  return (
    <header className="shrink-0 border-b border-line-subtle bg-surface px-space-base py-space-sm">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex min-w-0 flex-1 items-center gap-space-sm">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            title={t('searchPage.workspace.back')}
            aria-label={t('searchPage.workspace.back')}
          >
            <ArrowLeft className="size-icon-sm" aria-hidden="true" />
          </Button>
          <EntityAvatar
            name={appName}
            src={avatar}
            seed={appId}
            badge="search"
            size="lg"
          />
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-fg">
              {appName}
            </h2>
            <p className="flex min-w-0 flex-wrap items-center gap-x-space-sm gap-y-space-2xs text-xs text-fg-subtle">
              <StatusDot
                tone={SEARCH_PHASE_TONE[phase]}
                label={phaseLabel}
                className="shrink-0"
              />
              <span aria-hidden="true">·</span>
              {kbCount > 0 ? (
                <span className="inline-flex shrink-0 items-center gap-space-xs">
                  <Database className="size-icon-xs" aria-hidden="true" />
                  {t('searchPage.card.knowledgeBases', { count: kbCount })}
                </span>
              ) : (
                <StatusDot
                  tone="warning"
                  label={t('searchPage.card.noKnowledge')}
                />
              )}
              {description ? (
                <span
                  className="hidden max-w-[28rem] min-w-0 truncate md:inline"
                  title={description}
                >
                  {description}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-2xs">
          {hasTurns ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClear}
              title={t('searchPage.workspace.clear')}
              aria-label={t('searchPage.workspace.clear')}
            >
              <RotateCcw className="size-icon-sm" aria-hidden="true" />
            </Button>
          ) : null}
          {hasTurns ? (
            <Button
              variant={mindmapOpen ? 'outline' : 'ghost'}
              size="icon-sm"
              onClick={onToggleMindmap}
              disabled={!canOpenMindmap}
              title={mindmapLabel}
              aria-label={mindmapLabel}
            >
              <BrainCircuit className="size-icon-sm" aria-hidden="true" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onShare}
            title={t('searchPage.workspace.share')}
            aria-label={t('searchPage.workspace.share')}
          >
            <Share2 className="size-icon-sm" aria-hidden="true" />
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
              <Download className="size-icon-sm" aria-hidden="true" />
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
            title={settingsLabel}
            aria-label={settingsLabel}
          >
            <Settings className="size-icon-sm" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default memo(SearchDetailHeader)
