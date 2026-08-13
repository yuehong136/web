import React from 'react'
import { MessageSquarePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'
import { ProductCommandId, useApplicationCommands } from '@/lib/commands'
import { cn } from '@/lib/utils'
import { useHomeStore } from '@/stores/home'
import { DesktopActivity, useUIStore } from '@/stores/ui'
import { SidebarConversations } from '../SidebarConversations'
import { desktopNavigationItems } from './desktop-navigation'

const DesktopConversationPanel: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { execute } = useApplicationCommands()
  const selectedApp = useHomeStore((state) => state.selectedApps[0])
  const conversationId = useHomeStore((state) => state.selectedConversationId)
  const selectConversation = useHomeStore((state) => state.selectConversation)

  if (!selectedApp) {
    return (
      <div className="px-space-md py-space-lg text-center">
        <MessageSquarePlus className="mb-space-sm mx-auto size-icon-xl text-text-tertiary" />
        <p className="text-sm font-medium text-text-primary">
          {t('desktop.conversations.emptyTitle')}
        </p>
        <p className="mt-space-xs text-xs text-text-secondary">
          {t('desktop.conversations.emptyDescription')}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-space-md"
          onClick={() => void execute(ProductCommandId.NAVIGATE_HOME)}
        >
          {t('desktop.conversations.chooseApp')}
        </Button>
      </div>
    )
  }

  return (
    <SidebarConversations
      appId={selectedApp.id}
      appName={selectedApp.name}
      currentConversationId={conversationId}
      onSelectConversation={(nextConversationId) => {
        selectConversation(nextConversationId)
        navigate(ROUTES.HOME)
      }}
      onCreateNew={() => void execute(ProductCommandId.NEW_CONVERSATION)}
      isCollapsed={false}
    />
  )
}

export const DesktopContextPanel: React.FC = () => {
  const { t } = useTranslation()
  const activity = useUIStore((state) => state.desktopActivity)
  const { execute } = useApplicationCommands()
  const items = desktopNavigationItems[activity]

  return (
    <aside className="flex h-full min-w-0 flex-col bg-components-sidebar-bg">
      <header className="px-space-md py-space-base border-b border-components-sidebar-border">
        <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
          {t('desktop.workbench.context')}
        </p>
        <h2 className="mt-space-xs text-base font-semibold text-text-primary">
          {t(`desktop.activities.${activity}`)}
        </h2>
      </header>

      <nav className="space-y-space-2xs p-space-sm">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'gap-space-sm rounded-radius-lg px-space-sm py-space-sm flex items-center text-sm transition-colors',
                  isActive
                    ? 'bg-components-sidebar-item-bg-active text-components-sidebar-item-text-active'
                    : 'text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-text-primary',
                )
              }
            >
              <Icon className="size-icon-sm" />
              <span>{t(item.labelKey, item.fallbackLabel)}</span>
            </NavLink>
          )
        })}
      </nav>

      {activity === DesktopActivity.WORK ? (
        <>
          <div className="mx-space-sm border-t border-components-sidebar-border" />
          <div className="px-space-sm pt-space-sm">
            <Button
              size="sm"
              className="w-full"
              onClick={() => void execute(ProductCommandId.NEW_CONVERSATION)}
            >
              <MessageSquarePlus className="size-icon-sm" />
              {t('desktop.commands.newConversation')}
            </Button>
          </div>
          <DesktopConversationPanel />
        </>
      ) : (
        <div className="flex-1" />
      )}
    </aside>
  )
}
