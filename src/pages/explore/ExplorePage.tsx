import { useExploreConversation } from '@/pages/explore/hooks/use-explore-conversation'
import { useExploreSend } from '@/pages/explore/hooks/use-explore-send'
import { useCallback, useMemo, useState, type FC } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import { toast } from '@/lib/toast'
import { findFirstEnabledModelByType } from '@/stores/model'
import { useModelSelectorRequest } from '@/hooks/use-model-selector-request'
import { useDialogApps } from '@/hooks/use-dialog-apps'
import {
  useChatSettings,
  useKnowledgeBases,
  useRerankModels,
} from '@/hooks/use-chat-settings'
import { useChatUpload } from '@/hooks/use-chat-upload'
import { useDialogConversations } from './hooks/use-dialog-conversations'
import { useExploreDrop } from './hooks/use-explore-drop'
import { conversationAPI } from '@/api/conversation'
import { useTranslation } from 'react-i18next'
import {
  ChatSettingsPanel,
  defaultChatSettings,
  type ChatSettings,
} from '@/components/chat/ChatSettingsPanel'
import { ChatWorkspace } from '@/components/chat/chat-workspace'
import { ChatThreadHeader } from '@/components/chat/chat-thread-header'
import { ModelIdentity } from '@/components/models/model-identity'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { ExploreSidebar, type ExploreTab } from './components/explore-sidebar'
import { ExploreComposer } from './components/explore-composer'
import { ExploreDropOverlay } from './components/explore-drop-overlay'
import { ExploreEmpty } from './components/explore-empty'
import { ExploreMarket } from './components/explore-market'
import { ExploreThread } from './components/explore-thread'

export const ExplorePage: FC = () => {
  const { t } = useTranslation()
  const { myLLMs, modelRequest } = useModelSelectorRequest()

  const {
    data: dialogApps = [],
    isLoading: dialogAppsLoading,
    error: dialogAppsError,
  } = useDialogApps()

  // 状态管理
  const [activeTab, setActiveTab] = useState<ExploreTab>('workspace')
  const [selectedApp, setSelectedApp] = useState<string>('')
  const [mode, setMode] = useState<'chat' | 'market'>('chat')
  const conversation = useExploreConversation()
  const {
    messages,
    setMessages,
    selectedConversationDetail,
    setSelectedConversationDetail,
    activeConversationKey,
    isStreaming,
    isLoadingConversation,
    captureSession,
    resetConversation,
    fetchConversationDetail,
    abortChat,
  } = conversation
  const [inputValue, setInputValue] = useState('')
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [renamingConversationId, setRenamingConversationId] = useState<
    string | null
  >(null)
  const [newConversationName, setNewConversationName] = useState('')
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [chatSettings, setChatSettings] =
    useState<ChatSettings>(defaultChatSettings)

  // 附件面板；拖入文件时自动打开
  const [headerOpen, setHeaderOpen] = useState(false)
  const openAttachments = useCallback(() => setHeaderOpen(true), [])
  const { containerRef: dropContainerRef, isDragging } =
    useExploreDrop(openAttachments)

  // 深度研究与联网搜索（联网需要应用配置 Tavily Key）
  const [enableReasoning, setEnableReasoning] = useState(false)
  const [enableInternet, setEnableInternet] = useState(false)

  // 获取选中应用的详情和设置
  const {
    settings: dialogSettings,
    loading: settingsLoading,
    saving: savingSettings,
    saveSettings,
  } = useChatSettings(selectedApp || undefined)
  const internetAvailable = Boolean(dialogSettings.tavilyApiKey?.trim())

  const {
    files: uploadFiles,
    uploading: isUploading,
    upload: uploadFile,
    removeFile: removeUploadFile,
    clearFiles: clearUploadFiles,
    getUploadedFiles,
    hasError: hasUploadError,
    retry: retryUploadFile,
  } = useChatUpload()

  const { knowledgeBases, loadKnowledgeBases } = useKnowledgeBases()
  const rerankModels = useRerankModels(myLLMs)

  const [previousSettings, setPreviousSettings] = useState({
    app: selectedApp,
    settings: dialogSettings,
  })
  if (
    previousSettings.app !== selectedApp ||
    previousSettings.settings !== dialogSettings
  ) {
    setPreviousSettings({ app: selectedApp, settings: dialogSettings })
    if (selectedApp) setChatSettings(dialogSettings)
  }

  // 获取选中应用的对话列表
  const {
    data: dialogConversationsData,
    isLoading: dialogConversationsLoading,
    error: dialogConversationsError,
    refetch: refetchConversations,
  } = useDialogConversations(
    selectedApp,
    !!selectedApp && activeTab === 'topics',
  )

  const dialogConversations = dialogConversationsData || []
  const uploadedAttachments = useMemo(
    () => getUploadedFiles(),
    [getUploadedFiles],
  )
  const hasUploadingFiles =
    isUploading || uploadFiles.some((file) => file.status === 'uploading')
  const canSubmitMessage =
    !isStreaming &&
    !isLoadingConversation &&
    !hasUploadingFiles &&
    (inputValue.trim().length > 0 || uploadedAttachments.length > 0)

  if (
    !modelRequest.error &&
    !modelRequest.loading &&
    myLLMs &&
    !selectedModel
  ) {
    const firstModel = findFirstEnabledModelByType(myLLMs, 'chat')
    if (firstModel) setSelectedModel(firstModel)
  }
  if (!selectedApp && !dialogAppsLoading) {
    const activeApp = dialogApps.find((app) => app.status === '1')
    if (activeApp) setSelectedApp(activeApp.id)
  }

  const handleSendMessage = useExploreSend({
    conversation,
    selectedApp,
    appModelReference: dialogSettings.llmId,
    selectedModel,
    settings: chatSettings,
    enableReasoning,
    enableInternet: enableInternet && internetAvailable,
    uploadedAttachments,
    clearUploadFiles,
    setInputValue,
    refetchConversations,
  })

  const handleRegenerateMessage = useCallback(
    (assistantMessageIndex: number) => {
      if (isStreaming) return

      // 找到这个助手消息之前的用户消息
      const userMessageIndex = assistantMessageIndex - 1
      if (userMessageIndex < 0 || messages[userMessageIndex]?.role !== 'user') {
        toast.error(t('explore.toast.missingUserMessage'))
        return
      }

      const userContent = messages[userMessageIndex].content
      const userFiles = messages[userMessageIndex].files || []
      // 保留用户消息之前的所有消息（不包括用户消息本身，因为 handleSendMessage 会重新添加）
      const baseMessages = messages.slice(0, userMessageIndex)

      // 先立即更新 UI，移除当前用户消息和助手消息
      setMessages(baseMessages)

      void handleSendMessage(userContent, baseMessages, userFiles)
    },
    [handleSendMessage, isStreaming, messages, setMessages, t],
  )

  // 新建对话
  const handleCreateConversation = async () => {
    if (!selectedApp) return
    const isCurrent = captureSession()

    try {
      const newConversation = await conversationAPI.createConversation(
        selectedApp,
        t('explore.conversations.fallbackName'),
      )

      if (!isCurrent()) return
      refetchConversations()
      if (newConversation?.id) {
        clearUploadFiles()
        void fetchConversationDetail(selectedApp, newConversation.id)
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  // 重命名对话
  const confirmRenameConversation = async () => {
    if (!renamingConversationId || !newConversationName.trim() || !selectedApp)
      return
    const isCurrent = captureSession()

    try {
      await conversationAPI.renameConversation(
        selectedApp,
        renamingConversationId,
        newConversationName.trim(),
      )

      refetchConversations()

      if (!isCurrent()) return
      if (selectedConversationDetail?.id === renamingConversationId) {
        setSelectedConversationDetail((prev) =>
          prev ? { ...prev, name: newConversationName.trim() } : prev,
        )
      }

      setRenamingConversationId(null)
      setNewConversationName('')
    } catch (error) {
      console.error('Failed to rename conversation:', error)
    }
  }

  const currentApp = dialogApps.find((app) => app.id === selectedApp)

  const handleCopyContent = useCallback(
    (content: string) =>
      void copyToClipboardWithFeedback(
        content,
        t('explore.toast.copied'),
        t('explore.toast.copyFailed'),
      ),
    [t],
  )

  const handleDiscoverClick = () => {
    resetConversation()
    clearUploadFiles()
    setMode('market')
    setSelectedApp('')
  }

  const handleAppSelect = (appId: string) => {
    setMode('chat')
    setSelectedApp(appId)
    setActiveTab('workspace')
    resetConversation()
    clearUploadFiles()
  }

  const handleTopicsClick = () => {
    setActiveTab('topics')
    setMode('chat')
    resetConversation()
    clearUploadFiles()
  }

  const handleConversationSelect = (key?: string) => {
    clearUploadFiles()
    if (key && selectedApp) void fetchConversationDetail(selectedApp, key)
    else resetConversation()
  }

  const handleRenameConversation = (conversationId: string, name: string) => {
    setRenamingConversationId(conversationId)
    setNewConversationName(name)
  }

  const handleCloseRenameConversation = () => {
    setRenamingConversationId(null)
    setNewConversationName('')
  }

  const handleDeleteConversation = async (conversationId: string) => {
    const isCurrent = captureSession()
    try {
      await conversationAPI.removeConversations(selectedApp, [conversationId])
      refetchConversations()
      if (isCurrent() && activeConversationKey === conversationId) {
        resetConversation()
        clearUploadFiles()
      }
      toast.success(t('explore.conversations.deleted'))
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      toast.error(t('explore.conversations.deleteFailed'))
    }
  }

  const appName = currentApp?.name || t('explore.assistantFallback')
  const conversationTitle =
    activeTab === 'topics' ? selectedConversationDetail?.name : undefined
  const showComposer = activeTab !== 'topics' || !!selectedConversationDetail
  const composer = showComposer ? (
    <ExploreComposer
      value={inputValue}
      onChange={setInputValue}
      onSubmit={(message) => void handleSendMessage(message)}
      onStop={abortChat}
      isStreaming={isStreaming}
      disabled={isLoadingConversation}
      canSubmit={canSubmitMessage}
      uploads={{
        files: uploadFiles,
        uploading: hasUploadingFiles,
        readyCount: uploadedAttachments.length,
        hasError: hasUploadError,
        upload: uploadFile,
        remove: removeUploadFile,
        retry: (uid) => void retryUploadFile(uid),
      }}
      attachmentsOpen={headerOpen}
      onAttachmentsOpenChange={setHeaderOpen}
      getDropContainer={() => dropContainerRef.current}
      reasoning={enableReasoning}
      onReasoningChange={setEnableReasoning}
      internet={enableInternet}
      onInternetChange={setEnableInternet}
      internetAvailable={internetAvailable}
      model={
        dialogSettings.llmId ? (
          <>
            <ModelIdentity reference={dialogSettings.llmId} showLogo={false} />
            <span>{t('explore.sender.appModel')}</span>
          </>
        ) : undefined
      }
    />
  ) : null

  return (
    <ChatWorkspace
      scopeKey={`${selectedApp}:${activeConversationKey ?? 'draft'}`}
    >
      <div
        ref={dropContainerRef}
        className="flex h-full min-h-0 bg-background-surface"
      >
        {isDragging && <ExploreDropOverlay />}

        <ExploreSidebar
          activeTab={activeTab}
          mode={mode}
          selectedApp={selectedApp}
          dialogApps={dialogApps}
          dialogAppsLoading={dialogAppsLoading}
          dialogAppsError={dialogAppsError}
          dialogConversations={dialogConversations}
          dialogConversationsLoading={dialogConversationsLoading}
          dialogConversationsError={dialogConversationsError}
          activeConversationKey={activeConversationKey}
          renamingConversationId={renamingConversationId}
          newConversationName={newConversationName}
          t={t}
          onTabChange={setActiveTab}
          onTopicsClick={handleTopicsClick}
          onDiscoverClick={handleDiscoverClick}
          onAppSelect={handleAppSelect}
          onCreateConversation={handleCreateConversation}
          onConversationSelect={handleConversationSelect}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          onConfirmRenameConversation={confirmRenameConversation}
          onNewConversationNameChange={setNewConversationName}
          onCloseRenameConversation={handleCloseRenameConversation}
        />

        <div className="flex min-w-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <ChatThreadHeader
              title={
                mode === 'market'
                  ? t('explore.header.market')
                  : conversationTitle || appName
              }
              identity={
                mode === 'chat' && currentApp && conversationTitle ? (
                  <>
                    <EntityAvatar
                      name={currentApp.name}
                      src={currentApp.icon}
                      seed={currentApp.id}
                      size="2xs"
                    />
                    <span className="truncate">{currentApp.name}</span>
                  </>
                ) : undefined
              }
              actions={
                mode === 'chat' && (
                  <Tooltip content={t('explore.header.chatSettings')} asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('explore.header.chatSettings')}
                      aria-pressed={settingsPanelOpen}
                      onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
                    >
                      <SlidersHorizontal aria-hidden="true" />
                    </Button>
                  </Tooltip>
                )
              }
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {mode === 'market' ? (
                <ExploreMarket apps={dialogApps} loading={dialogAppsLoading} />
              ) : messages.length === 0 ? (
                <ExploreEmpty
                  app={currentApp}
                  composer={composer}
                  onSuggestion={setInputValue}
                />
              ) : (
                <>
                  <div className="min-h-0 flex-1">
                    <ExploreThread
                      messages={messages}
                      isStreaming={isStreaming}
                      onCopy={handleCopyContent}
                      onRegenerate={handleRegenerateMessage}
                    />
                  </div>
                  {composer && (
                    <div className="shrink-0 px-space-sm pt-space-xs pb-space-sm sm:px-space-lg sm:pb-space-md">
                      <div className="mx-auto w-full max-w-2xl">{composer}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {mode === 'chat' && (
            <ChatSettingsPanel
              open={settingsPanelOpen}
              onClose={() => setSettingsPanelOpen(false)}
              settings={chatSettings}
              onSettingsChange={setChatSettings}
              onSave={
                selectedApp ? () => saveSettings(chatSettings) : undefined
              }
              saving={savingSettings}
              loading={settingsLoading}
              knowledgeBases={knowledgeBases}
              rerankModels={rerankModels}
              llmModels={myLLMs}
              modelRequest={modelRequest}
              onLoadKnowledgeBases={loadKnowledgeBases}
            />
          )}
        </div>
      </div>
    </ChatWorkspace>
  )
}
