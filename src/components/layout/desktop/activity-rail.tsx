import React from 'react'
import { CircleUserRound, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '@/components/ui/tooltip'
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

  const selectActivity = (activity: DesktopActivity) => {
    setActive(activity)
    setCollapsed(false)
  }

  return (
    <aside
      className="flex h-full w-16 shrink-0 flex-col items-center border-r border-components-sidebar-border bg-components-sidebar-bg py-space-sm"
      aria-label={t('desktop.activityRail.label')}
    >
      <button
        type="button"
        className="mb-space-md flex size-10 items-center justify-center rounded-radius-lg focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden"
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
                  'flex size-10 items-center justify-center rounded-radius-lg transition-colors',
                  selected
                    ? 'bg-components-sidebar-item-bg-active text-components-sidebar-item-text-active'
                    : 'text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-text-primary',
                )}
                aria-label={label}
                aria-pressed={selected}
                onClick={() => selectActivity(activity)}
              >
                <Icon className="size-icon-md" />
              </button>
            </Tooltip>
          )
        })}
      </nav>

      <div className="flex flex-col gap-space-xs">
        <Tooltip content={t('layout.sidebar.settings')} position="right">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-radius-lg text-components-sidebar-item-text transition-colors hover:bg-components-sidebar-item-bg-hover hover:text-text-primary"
            aria-label={t('layout.sidebar.settings')}
            onClick={() => void execute(ProductCommandId.NAVIGATE_SETTINGS)}
          >
            <Settings className="size-icon-md" />
          </button>
        </Tooltip>
        <Tooltip content={t('layout.sidebar.profile')} position="right">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-radius-full bg-background-subtle text-text-secondary transition-colors hover:text-text-primary"
            aria-label={t('layout.sidebar.profile')}
            onClick={() => void execute(ProductCommandId.NAVIGATE_SETTINGS)}
          >
            <CircleUserRound className="size-icon-md" />
          </button>
        </Tooltip>
      </div>
    </aside>
  )
}
