import React from 'react'
import { Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { Tooltip } from '@/components/ui/tooltip'
import { useCurrentUserAvatar } from '@/hooks/use-current-user-avatar'
import { cn } from '@/lib/utils'
import { ProductCommandId, useApplicationCommands } from '@/lib/commands'
import { DesktopActivity, useUIStore } from '@/stores/ui'
import { desktopActivityIcons } from './desktop-navigation'
import { TideMark } from '../brand-mark'

const activities = Object.values(DesktopActivity)

export const ActivityRail: React.FC = () => {
  const { t } = useTranslation()
  const { execute } = useApplicationCommands()
  const active = useUIStore((state) => state.desktopActivity)
  const setActive = useUIStore((state) => state.setDesktopActivity)
  const setCollapsed = useUIStore((state) => state.setDesktopSidebarCollapsed)
  const avatar = useCurrentUserAvatar()

  const selectActivity = (activity: DesktopActivity) => {
    setActive(activity)
    setCollapsed(false)
  }

  return (
    <aside
      className="flex h-full w-16 shrink-0 flex-col items-center border-r border-line-subtle bg-canvas py-space-sm"
      aria-label={t('desktop.activityRail.label')}
    >
      <button
        type="button"
        className="mb-space-md flex size-10 items-center justify-center rounded-radius-lg focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:outline-hidden"
        onClick={() => void execute(ProductCommandId.NAVIGATE_HOME)}
        aria-label={t('desktop.activityRail.home')}
      >
        <TideMark size="md" />
      </button>

      <nav className="flex flex-1 flex-col gap-space-xs">
        {activities.map((activity) => {
          const Icon = desktopActivityIcons[activity]
          const label = t(`desktop.activities.${activity}`)
          const selected = activity === active
          return (
            <Tooltip key={activity} content={label} position="right">
              <button
                type="button"
                className={cn(
                  'flex size-10 items-center justify-center rounded-radius-lg outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-line-focus',
                  selected
                    ? 'bg-fill-selected text-fg'
                    : 'text-fg-muted hover:bg-fill-hover hover:text-fg',
                )}
                aria-label={label}
                aria-pressed={selected}
                onClick={() => selectActivity(activity)}
              >
                <Icon className="size-icon-md" aria-hidden="true" />
              </button>
            </Tooltip>
          )
        })}
      </nav>

      <div className="flex flex-col gap-space-xs">
        <Tooltip content={t('layout.sidebar.settings')} position="right">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-radius-lg text-fg-muted outline-hidden transition-colors hover:bg-fill-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-line-focus"
            aria-label={t('layout.sidebar.settings')}
            onClick={() => void execute(ProductCommandId.NAVIGATE_SETTINGS)}
          >
            <Settings className="size-icon-md" aria-hidden="true" />
          </button>
        </Tooltip>
        <Tooltip content={t('layout.sidebar.profile')} position="right">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-radius-full outline-hidden transition-colors hover:bg-fill-hover focus-visible:ring-2 focus-visible:ring-line-focus"
            aria-label={t('layout.sidebar.profile')}
            onClick={() => void execute(ProductCommandId.NAVIGATE_SETTINGS)}
          >
            <EntityAvatar {...avatar} size="md" shape="circle" />
          </button>
        </Tooltip>
      </div>
    </aside>
  )
}
