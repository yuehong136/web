import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/patterns'
import {
  Compass,
  History,
  Link2,
  MessageSquareCode,
  Settings2,
} from 'lucide-react'
import type { EmbedNavigateTarget } from './protocol'

interface EmbedHostActionsCardProps {
  isPipeline: boolean
  showExplore: boolean
  showPublish: boolean
  showWebhook: boolean
  showVariables: boolean
  showSettings: boolean
  onNavigateRequest: (target: EmbedNavigateTarget) => void
}

export function EmbedHostActionsCard({
  isPipeline,
  showExplore,
  showPublish,
  showWebhook,
  showVariables,
  showSettings,
  onNavigateRequest,
}: EmbedHostActionsCardProps) {
  const { t } = useTranslation()
  const handleNavigate = useCallback(
    (target: EmbedNavigateTarget) => () => onNavigateRequest(target),
    [onNavigateRequest],
  )

  return (
    <SectionCard
      title={
        isPipeline
          ? t('agent.embedRail.configTitle', 'Configuration')
          : t('agent.embedRail.deliveryTitle', 'Delivery and debug')
      }
      padding="default"
      className="min-h-0"
    >
      <div className="gap-space-sm grid">
        {showExplore ? (
          <Button variant="outline" onClick={handleNavigate('explore')}>
            <Compass className="mr-space-xs size-icon-sm" />
            {t('agent.embedRail.explore', 'Explore session')}
          </Button>
        ) : null}
        {showPublish ? (
          <Button variant="outline" onClick={handleNavigate('versions')}>
            <History className="mr-space-xs size-icon-sm" />
            {t('agent.embedRail.publish', 'Publish')}
          </Button>
        ) : null}
        {showWebhook ? (
          <Button variant="outline" onClick={handleNavigate('webhook')}>
            <Link2 className="mr-space-xs size-icon-sm" />
            {t('agent.embedRail.webhook', 'Webhook')}
          </Button>
        ) : null}
        {showVariables ? (
          <Button variant="outline" onClick={handleNavigate('variables')}>
            <MessageSquareCode className="mr-space-xs size-icon-sm" />
            {t('agent.embedRail.variables', 'Conversation variables')}
          </Button>
        ) : null}
        {showSettings ? (
          <Button
            variant="outline"
            className="bg-surface-secondary"
            onClick={handleNavigate('settings')}
          >
            <Settings2 className="mr-space-xs size-icon-sm" />
            {t('agent.embedRail.settings', 'Edit basic settings')}
          </Button>
        ) : null}
      </div>
    </SectionCard>
  )
}
