import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/patterns'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Compass,
  History,
  Link2,
  MessageSquareCode,
  Play,
  Save,
  Settings2,
} from 'lucide-react'
import type { EmbedShowKey } from './use-embed-access'
import type { EmbedNavigateTarget } from './protocol'

export interface EmbedToolbarProps {
  /** Display title (editable input). */
  title: string
  onTitleChange: (next: string) => void

  /** The agent's identity: avatar, tone seed and agent/workflow badge. */
  avatar?: string
  avatarSeed?: string
  kind?: 'agent' | 'workflow'

  /** Whitelist of buttons to render. */
  show: ReadonlySet<EmbedShowKey>

  /** Save handler: directly invokes useSaveGraph in the parent component. */
  onSave: () => void
  saving: boolean

  /** Runtime workbench opener (P0: optional, gated by `show=run`). */
  onRun?: () => void

  /** Only true route exits get bridged to the host via postMessage. */
  onNavigateRequest: (target: EmbedNavigateTarget) => void
  onOpenVersions: () => void
  onOpenWebhook: () => void
  onOpenVariables: () => void
  onOpenSettings: () => void

  /** Optional banner / description below the title. */
  description?: string
}

/**
 * Toolbar for the embed shell. Imports the main project's PageHeader and
 * Button so any visual upgrade to those primitives automatically propagates
 * here. The shape mirrors `AgentEditorHeader` but with embed-specific
 * wiring: save calls useSaveGraph (real backend write), editor actions open
 * the same dialogs/sheets as the full editor, and only true route exits
 * postMessage to the host instead of `navigate(...)`.
 *
 * The `share` button is intentionally absent — embedded surfaces must never
 * generate further embedding links (套娃 / scope inflation).
 */
export function EmbedToolbar({
  title,
  onTitleChange,
  avatar,
  avatarSeed,
  kind = 'agent',
  show,
  onSave,
  saving,
  onRun,
  onNavigateRequest,
  onOpenVersions,
  onOpenWebhook,
  onOpenVariables,
  onOpenSettings,
  description,
}: EmbedToolbarProps) {
  const { t } = useTranslation()
  const handleNav = useCallback(
    (target: EmbedNavigateTarget) => () => onNavigateRequest(target),
    [onNavigateRequest],
  )

  const showNav = show.has('nav')
  const showPublish = show.has('publish')
  const showWebhook = show.has('webhook')
  const showSettings = show.has('settings')
  const showVariables = show.has('variables')
  const showRun = show.has('run') && Boolean(onRun)

  return (
    <PageHeader
      compact
      align="center"
      surface="plain"
      wrapActions
      className="min-h-13 border-b border-line bg-surface px-space-sm py-space-xs"
      title={
        <span className="flex max-w-xl min-w-0 items-center gap-space-sm">
          <EntityAvatar
            name={title}
            src={avatar}
            seed={avatarSeed}
            badge={kind}
          />
          <Input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            aria-label={t('agent.editor.nameLabel')}
            className="h-9 min-w-48 text-base font-semibold"
            placeholder={t('agent.editor.namePlaceholder')}
          />
        </span>
      }
      description={description}
      actions={
        <>
          {showNav ? (
            <>
              <Button variant="outline" onClick={handleNav('back')}>
                <ArrowLeft className="mr-space-xs size-icon-sm" />
                {t('agent.editor.back')}
              </Button>
              <Button variant="outline" onClick={handleNav('explore')}>
                <Compass className="mr-space-xs size-icon-sm" />
                {t('agent.embedToolbar.explore')}
              </Button>
            </>
          ) : null}

          {showPublish ? (
            <Button variant="outline" onClick={onOpenVersions}>
              <History className="mr-space-xs size-icon-sm" />
              {t('agent.embedRail.publish')}
            </Button>
          ) : null}

          {showWebhook ? (
            <Button variant="outline" onClick={onOpenWebhook}>
              <Link2 className="mr-space-xs size-icon-sm" />
              {t('agent.embedRail.webhook')}
            </Button>
          ) : null}

          {showVariables ? (
            <Button variant="outline" onClick={onOpenVariables}>
              <MessageSquareCode className="mr-space-xs size-icon-sm" />
              {t('agent.embedRail.variables')}
            </Button>
          ) : null}

          {showSettings ? (
            <Button variant="outline" onClick={onOpenSettings}>
              <Settings2 className="mr-space-xs size-icon-sm" />
              {t('agent.embedToolbar.settings')}
            </Button>
          ) : null}

          <Button variant="secondary" onClick={onSave} disabled={saving}>
            <Save className="mr-space-xs size-icon-sm" />
            {saving ? t('common.saving') : t('agent.editor.save')}
          </Button>

          {showRun ? (
            <Button onClick={onRun}>
              <Play className="mr-space-xs size-icon-sm" />
              {t('agent.editor.run')}
            </Button>
          ) : null}
        </>
      }
    />
  )
}
