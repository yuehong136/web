import type { FC } from 'react'
import { ConfigProvider, Input, Modal, theme } from 'antd'
import { Conversations } from '@ant-design/x'
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
import { cn } from '@/lib/utils'
import {
  ConversationDateGroup,
  getConversationDateGroup,
} from '@/utils/conversation-utils'
import type { DialogApp } from '@/types/api'
import { translateConversationGroup } from './conversation-group-label'
import { getExploreAppIcon } from './explore-app-icon'

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

const CONVERSATION_CLASSNAME = 'explore-conversations'

const CONVERSATION_STYLES = `
  .${CONVERSATION_CLASSNAME} .ant-conversations {
    background-color: transparent !important;
  }
  .${CONVERSATION_CLASSNAME} .ant-conversations-creation {
    margin: 8px 12px !important;
    padding: 10px 12px !important;
    border-radius: 8px !important;
    background-color: var(--color-components-sidebar-item-bg-active) !important;
    color: var(--color-components-sidebar-item-text-active) !important;
    border: 1px solid var(--color-border-accent) !important;
    transition: all 0.2s ease !important;
    font-weight: 500 !important;
  }
  .${CONVERSATION_CLASSNAME} .ant-conversations-creation .ant-typography,
  .${CONVERSATION_CLASSNAME} .ant-conversations-creation span {
    color: var(--color-components-sidebar-item-text-active) !important;
  }
  .${CONVERSATION_CLASSNAME} .ant-conversations-creation:hover {
    background-color: var(--color-components-button-primary-bg) !important;
    color: var(--color-components-button-primary-text) !important;
  }
  .${CONVERSATION_CLASSNAME} .ant-conversations-creation:hover .ant-typography,
  .${CONVERSATION_CLASSNAME} .ant-conversations-creation:hover span {
    color: var(--color-components-button-primary-text) !important;
  }
  .${CONVERSATION_CLASSNAME} .ant-conversations-group-title,
  .${CONVERSATION_CLASSNAME} .ant-conversations-group-title .ant-typography {
    color: var(--color-text-tertiary) !important;
    font-size: 12px !important;
    padding: 12px 16px 4px !important;
    font-weight: 500 !important;
  }
  .${CONVERSATION_CLASSNAME} .ant-conversations-list .ant-conversations-item {
    background-color: transparent !important;
    border-radius: 8px !important;
    margin: 2px 8px !important;
    padding: 8px 12px !important;
    transition: all 0.2s ease !important;
  }
  .${CONVERSATION_CLASSNAME} .ant-conversations-list .ant-conversations-item:hover {
    background-color: var(--color-components-sidebar-item-bg-hover) !important;
  }
  .${CONVERSATION_CLASSNAME} .ant-conversations-list .ant-conversations-item-active {
    background-color: var(--color-components-sidebar-item-bg-active) !important;
  }
  .${CONVERSATION_CLASSNAME} .ant-conversations-list .ant-conversations-item-active .ant-conversations-item-label {
    color: var(--color-components-sidebar-item-text-active) !important;
  }
  .${CONVERSATION_CLASSNAME} .ant-conversations-item-label {
    color: var(--color-text-primary) !important;
    font-size: 14px !important;
  }
  .${CONVERSATION_CLASSNAME} .ant-typography,
  .${CONVERSATION_CLASSNAME} .ant-conversations-label,
  .${CONVERSATION_CLASSNAME} span.ant-typography.ant-conversations-label {
    color: var(--color-text-primary) !important;
  }
  .${CONVERSATION_CLASSNAME} .ant-conversations-item-active .ant-typography,
  .${CONVERSATION_CLASSNAME} .ant-conversations-item-active .ant-conversations-label,
  .${CONVERSATION_CLASSNAME} .ant-conversations-item-active span.ant-typography.ant-conversations-label {
    color: var(--color-components-sidebar-item-text-active) !important;
  }
  .${CONVERSATION_CLASSNAME} .ant-conversations-item .anticon {
    color: var(--color-text-tertiary) !important;
  }
  .${CONVERSATION_CLASSNAME} .ant-conversations-item:hover .anticon {
    color: var(--color-text-secondary) !important;
  }
  .explore-conversations-empty {
    text-align: center;
    padding: 32px 16px;
    color: var(--color-text-tertiary);
    font-size: 14px;
  }
`

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
  const isDarkTheme =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-components-sidebar-border bg-components-sidebar-bg">
      <div className="p-space-sm border-b border-border-subtle">
        <div
          className="gap-space-2xs rounded-radius-lg bg-surface-secondary p-space-2xs grid grid-cols-3"
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
                  'rounded-radius-md px-space-xs py-space-xs min-w-0 text-center text-sm font-medium text-components-sidebar-item-text transition-colors',
                  'hover:bg-components-sidebar-item-bg-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-state-focus',
                  selected &&
                    'bg-components-sidebar-item-bg-active text-components-sidebar-item-text-active',
                  disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                <span className="block truncate">{getTabLabel(tab, t)}</span>
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
                  'gap-space-sm rounded-radius-lg px-space-md py-space-sm flex w-full items-center text-left text-sm font-medium text-components-sidebar-item-text transition-colors',
                  'hover:bg-components-sidebar-item-bg-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-state-focus',
                  mode === 'market' &&
                    'bg-components-sidebar-item-bg-active text-components-sidebar-item-text-active',
                )}
              >
                <Search className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {t('explore.sidebar.discover')}
                </span>
              </button>
            </div>

            <div className="mx-space-sm border-t border-border-subtle" />

            <div className="space-y-space-2xs p-space-sm min-h-0 flex-1 overflow-y-auto">
              {dialogAppsLoading ? (
                <div className="py-space-xl text-center text-sm text-text-tertiary">
                  {t('explore.sidebar.loadingApps')}
                </div>
              ) : dialogAppsError ? (
                <div className="py-space-xl text-center text-sm text-text-error">
                  {t('explore.sidebar.loadFailed')}
                </div>
              ) : dialogApps.length === 0 ? (
                <div className="py-space-xl text-center text-sm text-text-tertiary">
                  {t('explore.sidebar.noApps')}
                </div>
              ) : (
                dialogApps
                  .filter((app) => app.status === '1')
                  .map((app) => {
                    const selected = selectedApp === app.id && mode === 'chat'
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => onAppSelect(app.id)}
                        title={app.name}
                        className={cn(
                          'gap-space-sm rounded-radius-lg px-space-md py-space-sm flex w-full items-center text-left text-sm text-components-sidebar-item-text transition-colors',
                          'hover:bg-components-sidebar-item-bg-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-state-focus',
                          selected &&
                            'bg-components-sidebar-item-bg-active text-components-sidebar-item-text-active',
                        )}
                      >
                        <span className="shrink-0">
                          {getExploreAppIcon(app)}
                        </span>
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
                <div className="p-space-sm border-b border-border-subtle">
                  <div className="rounded-radius-lg bg-surface-secondary p-space-sm flex items-center">
                    {getExploreAppIcon(currentApp, 'md')}
                    <div className="ml-space-sm min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {currentApp?.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className={CONVERSATION_CLASSNAME}>
                    <style>{CONVERSATION_STYLES}</style>
                    <ConfigProvider
                      theme={{
                        algorithm: isDarkTheme
                          ? theme.darkAlgorithm
                          : theme.defaultAlgorithm,
                      }}
                    >
                      {dialogConversationsLoading ? (
                        <div className="explore-conversations-empty">
                          {t('explore.conversations.loading')}
                        </div>
                      ) : dialogConversationsError ? (
                        <div className="explore-conversations-empty text-text-error">
                          {t('explore.sidebar.loadFailed')}
                        </div>
                      ) : (
                        <Conversations
                          activeKey={activeConversationKey}
                          creation={{
                            icon: <Plus className="h-4 w-4" />,
                            label: t('explore.conversations.new'),
                            onClick: onCreateConversation,
                          }}
                          groupable={{
                            label: (group) =>
                              translateConversationGroup(
                                String(group) as ConversationDateGroup,
                                t,
                              ),
                          }}
                          items={
                            dialogConversations.length === 0
                              ? []
                              : [...dialogConversations]
                                  .sort((a, b) => {
                                    const timeA =
                                      a.update_time > 1000000000000
                                        ? a.update_time
                                        : a.update_time * 1000
                                    const timeB =
                                      b.update_time > 1000000000000
                                        ? b.update_time
                                        : b.update_time * 1000
                                    return timeB - timeA
                                  })
                                  .map((conversation) => ({
                                    key: conversation.id,
                                    label:
                                      conversation.name ||
                                      t('explore.conversations.fallbackName'),
                                    group: getConversationDateGroup(
                                      conversation.update_time,
                                    ),
                                  }))
                          }
                          menu={(conversation) => ({
                            items: [
                              {
                                label: t('explore.conversations.rename'),
                                key: 'rename',
                                icon: <Edit3 className="h-3 w-3" />,
                              },
                              {
                                label: t('explore.conversations.delete'),
                                key: 'delete',
                                icon: <Trash2 className="h-3 w-3" />,
                                danger: true,
                              },
                            ],
                            onClick: (menuInfo) => {
                              menuInfo.domEvent.stopPropagation()
                              const conversationId = String(conversation.key)
                              const conversationData = dialogConversations.find(
                                (item) => item.id === conversationId,
                              )

                              if (
                                menuInfo.key === 'rename' &&
                                conversationData
                              ) {
                                onRenameConversation(
                                  conversationId,
                                  conversationData.name ||
                                    t('explore.conversations.fallbackName'),
                                )
                              } else if (menuInfo.key === 'delete') {
                                void onDeleteConversation(conversationId)
                              }
                            },
                          })}
                          onActiveChange={(key) =>
                            onConversationSelect(key || undefined)
                          }
                        />
                      )}
                    </ConfigProvider>
                  </div>
                </div>

                <Modal
                  title={t('explore.conversations.renameTitle')}
                  open={!!renamingConversationId}
                  onOk={onConfirmRenameConversation}
                  onCancel={onCloseRenameConversation}
                  okText={t('common.confirm')}
                  cancelText={t('common.cancel')}
                  destroyOnHidden
                >
                  <Input
                    value={newConversationName}
                    onChange={(event) =>
                      onNewConversationNameChange(event.target.value)
                    }
                    onPressEnter={onConfirmRenameConversation}
                    placeholder={t('explore.conversations.namePlaceholder')}
                  />
                </Modal>
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
  )
}
