import type { FC } from 'react'
import {
  Edit3,
  MessageSquare,
  Plus,
  Search,
  Settings2,
  Trash2,
} from 'lucide-react'
import type { TFunction } from 'i18next'
import { PageEmptyState } from '@/components/patterns/page-states'
import { ConversationList } from '@/components/patterns/conversation-list'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ManagedSecondaryNavigation } from '@/components/layout/workbench-navigation'
import { cn } from '@/lib/utils'
import {
  ConversationDateGroup,
  getConversationDateGroup,
} from '@/utils/conversation-utils'
import type { DialogApp } from '@/types/api'
import { translateConversationGroup } from './conversation-group-label'
import { EntityAvatar } from '@/components/patterns/entity-avatar'

/** Conversation times come in seconds or milliseconds. */
const toMilliseconds = (time: number) =>
  time > 1_000_000_000_000 ? time : time * 1000

export type ExploreTab = 'workspace' | 'topics' | 'settings'
export type ExploreMode = 'chat' | 'market'

interface ExploreConversation {
  id: string
  name?: string
  update_time: number
}

interface ExploreSidebarProps {
  activeTab: ExploreTab
  mode: ExploreMode
  selectedApp: string
  dialogApps: DialogApp[]
  dialogAppsLoading: boolean
  dialogAppsError: unknown
  dialogConversations: ExploreConversation[]
  dialogConversationsLoading: boolean
  dialogConversationsError: unknown
  activeConversationKey?: string
  renamingConversationId: string | null
  newConversationName: string
  t: TFunction
  onTabChange: (tab: ExploreTab) => void
  onTopicsClick: () => void
  onDiscoverClick: () => void
  onAppSelect: (appId: string) => void
  onCreateConversation: () => void
  onConversationSelect: (key?: string) => void
  onRenameConversation: (conversationId: string, name: string) => void
  onDeleteConversation: (conversationId: string) => Promise<void>
  onConfirmRenameConversation: () => void
  onNewConversationNameChange: (name: string) => void
  onCloseRenameConversation: () => void
}

const TAB_ITEMS: ExploreTab[] = ['workspace', 'topics', 'settings']

const getTabLabel = (tab: ExploreTab, t: TFunction) => {
  if (tab === 'workspace') return t('explore.tabs.workspace')
  if (tab === 'topics') return t('explore.tabs.topics')
  return t('explore.tabs.settings')
}

export const ExploreSidebar: FC<ExploreSidebarProps> = ({
  activeTab,
  mode,
  selectedApp,
  dialogApps,
  dialogAppsLoading,
  dialogAppsError,
  dialogConversations,
  dialogConversationsLoading,
  dialogConversationsError,
  activeConversationKey,
  renamingConversationId,
  newConversationName,
  t,
  onTabChange,
  onTopicsClick,
  onDiscoverClick,
  onAppSelect,
  onCreateConversation,
  onConversationSelect,
  onRenameConversation,
  onDeleteConversation,
  onConfirmRenameConversation,
  onNewConversationNameChange,
  onCloseRenameConversation,
}) => {
  const currentApp = dialogApps.find((app) => app.id === selectedApp)

  return (
    <>
      <ManagedSecondaryNavigation
        section="explore"
        title={t('layout.nav.explore')}
        fallbackClassName="h-full w-72 shrink-0"
      >
        <aside className="flex h-full w-full min-w-0 flex-col bg-canvas">
          <div className="border-b border-line-subtle p-space-sm">
            <div
              className="grid grid-cols-3 gap-space-2xs rounded-radius-lg bg-sunken p-space-2xs"
              role="tablist"
              aria-label={t('explore.sidebar.navigation')}
            >
              {TAB_ITEMS.map((tab) => {
                const disabled = tab === 'topics' && !selectedApp
                const selected = activeTab === tab
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    disabled={disabled}
                    title={getTabLabel(tab, t)}
                    onClick={() =>
                      tab === 'topics' ? onTopicsClick() : onTabChange(tab)
                    }
                    className={cn(
                      'min-w-0 rounded-radius-md px-space-xs py-space-xs text-center text-sm font-medium text-fg-muted transition-colors',
                      'focus-ring-inset hover:bg-fill-hover hover:text-fg',
                      selected && 'bg-fill-selected text-fg',
                      disabled && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <span className="block truncate">
                      {getTabLabel(tab, t)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {activeTab === 'workspace' ? (
              <>
                <div className="p-space-sm">
                  <button
                    type="button"
                    onClick={onDiscoverClick}
                    className={cn(
                      'flex min-h-[var(--control-height-sm)] w-full items-center gap-space-sm rounded-radius-md px-space-sm py-space-xs text-left text-sm font-medium text-fg-muted transition-colors',
                      'focus-ring-inset hover:bg-fill-hover hover:text-fg',
                      mode === 'market' && 'bg-fill-selected text-fg',
                    )}
                  >
                    <Search className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {t('explore.sidebar.discover')}
                    </span>
                  </button>
                </div>

                <div className="mx-space-sm border-t border-line-subtle" />

                <div className="min-h-0 flex-1 space-y-space-2xs overflow-y-auto p-space-sm">
                  {dialogAppsLoading ? (
                    <div className="py-space-xl text-center text-sm text-fg-subtle">
                      {t('explore.sidebar.loadingApps')}
                    </div>
                  ) : dialogAppsError ? (
                    <div className="py-space-xl text-center text-sm text-danger-fg">
                      {t('explore.sidebar.loadFailed')}
                    </div>
                  ) : dialogApps.length === 0 ? (
                    <div className="py-space-xl text-center text-sm text-fg-subtle">
                      {t('explore.sidebar.noApps')}
                    </div>
                  ) : (
                    dialogApps
                      .filter((app) => app.status === '1')
                      .map((app) => {
                        const selected =
                          selectedApp === app.id && mode === 'chat'
                        return (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => onAppSelect(app.id)}
                            title={app.name}
                            className={cn(
                              'flex min-h-[var(--control-height-sm)] w-full items-center gap-space-sm rounded-radius-md px-space-sm py-space-xs text-left text-sm text-fg-muted transition-colors',
                              'focus-ring-inset hover:bg-fill-hover hover:text-fg',
                              selected && 'bg-fill-selected text-fg',
                            )}
                          >
                            <EntityAvatar
                              name={app.name}
                              src={app.icon}
                              seed={app.id}
                              size="xs"
                            />
                            <span className="truncate">{app.name}</span>
                          </button>
                        )
                      })
                  )}
                </div>
              </>
            ) : activeTab === 'topics' ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {!selectedApp ? (
                  <PageEmptyState
                    compact
                    icon={<MessageSquare className="h-6 w-6" />}
                    title={t('explore.sidebar.selectAppFirst')}
                  />
                ) : (
                  <>
                    <div className="border-b border-line-subtle p-space-sm">
                      <div className="flex items-center rounded-radius-lg bg-sunken p-space-sm">
                        <EntityAvatar
                          name={currentApp?.name}
                          src={currentApp?.icon}
                          seed={currentApp?.id}
                          size="sm"
                        />
                        <div className="ml-space-sm min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-fg">
                            {currentApp?.name}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                      {dialogConversationsLoading ? (
                        <div className="px-space-base py-space-lg text-center text-sm text-fg-subtle">
                          {t('explore.conversations.loading')}
                        </div>
                      ) : dialogConversationsError ? (
                        <div className="px-space-base py-space-lg text-center text-sm text-danger-fg">
                          {t('explore.sidebar.loadFailed')}
                        </div>
                      ) : (
                        <ConversationList
                          activeKey={activeConversationKey}
                          onSelect={onConversationSelect}
                          creation={{
                            icon: <Plus aria-hidden="true" />,
                            label: t('explore.conversations.new'),
                            onClick: onCreateConversation,
                          }}
                          groupLabel={(group) =>
                            translateConversationGroup(
                              group as ConversationDateGroup,
                              t,
                            )
                          }
                          items={[...dialogConversations]
                            .sort(
                              (a, b) =>
                                toMilliseconds(b.update_time) -
                                toMilliseconds(a.update_time),
                            )
                            .map((conversation) => ({
                              key: conversation.id,
                              label:
                                conversation.name ||
                                t('explore.conversations.fallbackName'),
                              group: getConversationDateGroup(
                                conversation.update_time,
                              ),
                            }))}
                          actionsLabel={(item) =>
                            t('explore.conversations.actions', {
                              name: item.label,
                            })
                          }
                          actions={[
                            {
                              key: 'rename',
                              label: t('explore.conversations.rename'),
                              icon: (
                                <Edit3
                                  aria-hidden="true"
                                  className="size-icon-sm"
                                />
                              ),
                              onSelect: (item) =>
                                onRenameConversation(item.key, item.label),
                            },
                            {
                              key: 'delete',
                              label: t('explore.conversations.delete'),
                              icon: (
                                <Trash2
                                  aria-hidden="true"
                                  className="size-icon-sm"
                                />
                              ),
                              danger: true,
                              onSelect: (item) =>
                                void onDeleteConversation(item.key),
                            },
                          ]}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <PageEmptyState
                compact
                icon={<Settings2 className="h-6 w-6" />}
                title={t('explore.sidebar.settingsComingSoon')}
              />
            )}
          </div>
        </aside>
      </ManagedSecondaryNavigation>
      {activeTab === 'topics' && selectedApp && (
        <Dialog
          open={!!renamingConversationId}
          onOpenChange={(open) => {
            if (!open) onCloseRenameConversation()
          }}
        >
          <DialogContent size="sm" modal>
            <DialogHeader>
              <DialogTitle>
                {t('explore.conversations.renameTitle')}
              </DialogTitle>
            </DialogHeader>
            {/* Enter submits the new name. */}
            <form
              noValidate
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={(event) => {
                event.preventDefault()
                onConfirmRenameConversation()
              }}
            >
              <DialogBody>
                <Input
                  autoFocus
                  aria-label={t('explore.conversations.renameTitle')}
                  value={newConversationName}
                  onChange={(event) =>
                    onNewConversationNameChange(event.target.value)
                  }
                  placeholder={t('explore.conversations.namePlaceholder')}
                />
              </DialogBody>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCloseRenameConversation}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit">{t('common.confirm')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
