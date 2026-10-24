import './components/explore-welcome.css'
import { ExploreMessageAttachments } from './components/message-attachments'
import { ControlledAttachments } from '@/components/chat/controlled-attachments'
import { useExploreConversation } from '@/pages/explore/hooks/use-explore-conversation'
import { useExploreSend } from '@/pages/explore/hooks/use-explore-send'
import { ExploreRunNotice } from '@/pages/explore/components/explore-run-notice'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from 'react'
import {
  Sparkles,
  LayoutGrid,
  AlignCenter,
  Maximize2,
  SlidersHorizontal,
  Paperclip,
  Atom,
  Globe,
  Square,
  Upload,
} from 'lucide-react'
import {
  Bubble,
  Sender,
  Prompts,
  Welcome,
  type AttachmentsProps,
  type BubbleListProps,
  type PromptsProps,
} from '@ant-design/x'
import { Button } from '@/components/ui/button'
import { FileIcon } from '@/components/ui/file-icon'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import { cn, formatBytes } from '@/lib/utils'
import { toast } from '@/lib/toast'
import {
  findFirstEnabledModelByType,
  hasEnabledModelName,
} from '@/stores/model'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { useDialogApps } from '@/hooks/use-dialog-apps'
import {
  useChatSettings,
  useKnowledgeBases,
  useRerankModels,
} from '@/hooks/use-chat-settings'
import { useChatUpload } from '@/hooks/use-chat-upload'
import { useDialogConversations } from './hooks/use-dialog-conversations'
import { conversationAPI } from '@/api/conversation'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import {
  uploadConfig,
  type UploadFile,
  type UploadedFileInfo,
} from '@/config/chat'
import {
  ChatSettingsPanel,
  defaultChatSettings,
  type ChatSettings,
} from '@/components/chat/ChatSettingsPanel'
import { MessageActionsFooter } from '@/components/chat/MessageActionsFooter'
import {
  CHAT_BUBBLE_ROLES,
  shouldUseBubbleTyping,
} from '@/components/chat/antx-chat-config'
import { ExploreSidebar, type ExploreTab } from './components/explore-sidebar'
import { getExploreAppIcon } from './components/explore-app-icon'
import { AppChatComposer } from '@/components/chat/app-chat-composer'
import { ExploreChatAnswer } from '@/pages/explore/components/explore-chat-answer'
import { ChatWorkspace } from '@/components/chat/chat-workspace'
import { getAppChatBubbleProps } from '@/components/chat/app-chat-message'

type ExploreAttachment = NonNullable<AttachmentsProps['items']>[number]

const getAttachmentStatusLabel = (file: UploadFile, t: TFunction) => {
  if (file.status === 'uploading') {
    return t('explore.attachmentStatus.uploading', {
      percent: Math.round(file.percent || 0),
    })
  }

  if (file.status === 'error') {
    return t('explore.attachmentStatus.error')
  }

  if (file.response) {
    const typeLabel = file.response.extension?.toUpperCase() || 'FILE'
    return t('explore.attachmentStatus.ready', {
      type: typeLabel,
      size: formatBytes(file.response.size || file.size || 0),
    })
  }

  return formatBytes(file.size || 0)
}

export const ExplorePage: FC = () => {
  const { t } = useTranslation()
  const { myLLMs, isLoading: modelsLoading } = useFetchMyLLMs()

  // 获取对话应用列表
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
  const [chatLayout, setChatLayout] = useState<'default' | 'center' | 'full'>(
    'default',
  )
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [chatSettings, setChatSettings] =
    useState<ChatSettings>(defaultChatSettings)

  // 文件上传面板状态（参考 ragflow）
  const [headerOpen, setHeaderOpen] = useState(false)

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false)
  const dropContainerRef = useRef<HTMLDivElement>(null)
  const dragCounterRef = useRef(0)

  // 功能开关状态（参考 ragflow）
  const [enableReasoning, setEnableReasoning] = useState(false)
  const [enableInternet, setEnableInternet] = useState(false)

  // 全局拖拽事件处理
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current++
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true)
        setHeaderOpen(true) // 自动打开上传面板
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current--
      if (dragCounterRef.current === 0) {
        setIsDragging(false)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current = 0
      setIsDragging(false)
      // 文件会由 Attachments 组件处理
    }

    const container = dropContainerRef.current
    if (container) {
      container.addEventListener('dragenter', handleDragEnter)
      container.addEventListener('dragleave', handleDragLeave)
      container.addEventListener('dragover', handleDragOver)
      container.addEventListener('drop', handleDrop)

      return () => {
        container.removeEventListener('dragenter', handleDragEnter)
        container.removeEventListener('dragleave', handleDragLeave)
        container.removeEventListener('dragover', handleDragOver)
        container.removeEventListener('drop', handleDrop)
      }
    }
    return undefined
  }, [])

  // 获取选中应用的详情和设置
  const {
    dialog: _selectedAppDetail,
    settings: dialogSettings,
    loading: settingsLoading,
    saving: savingSettings,
    saveSettings,
  } = useChatSettings(selectedApp || undefined)

  // 文件上传 Hook（参考 ragflow）
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

  // 获取知识库列表
  const { knowledgeBases, loadKnowledgeBases } = useKnowledgeBases()

  // 获取重排序模型列表（LLMModel[] 格式）
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
  const hasReadyUploads = uploadedAttachments.length > 0
  const hasUploadingFiles = useMemo(
    () =>
      isUploading || uploadFiles.some((file) => file.status === 'uploading'),
    [isUploading, uploadFiles],
  )
  const canSubmitMessage =
    !isStreaming &&
    !isLoadingConversation &&
    !hasUploadingFiles &&
    (inputValue.trim().length > 0 || hasReadyUploads)
  const attachmentItems = useMemo<ExploreAttachment[]>(() => {
    return uploadFiles.map(({ originFileObj: _originFileObj, ...file }) => ({
      ...file,
      className: file.status === 'error' ? 'cursor-pointer' : undefined,
      description: getAttachmentStatusLabel(file, t),
      icon: file.response ? (
        <FileIcon fileName={file.response.name} size="sm" />
      ) : undefined,
      src: file.thumbUrl,
    }))
  }, [t, uploadFiles])

  if (!modelsLoading && myLLMs && !hasEnabledModelName(myLLMs, selectedModel)) {
    const firstModel = findFirstEnabledModelByType(myLLMs, 'chat')
    if (firstModel) setSelectedModel(firstModel)
  }
  if (!selectedApp && !dialogAppsLoading) {
    const activeApp = dialogApps.find((app) => app.status === '1')
    if (activeApp) setSelectedApp(activeApp.id)
  }

  // 停止输出
  const handleStopOutput = abortChat

  const handleSendMessage = useExploreSend({
    conversation,
    selectedApp,
    selectedModel,
    settings: chatSettings,
    enableReasoning,
    enableInternet,
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
      const newConversation = await conversationAPI.setConversation({
        dialog_id: selectedApp,
        name: t('explore.conversations.fallbackName'),
        is_new: true,
      })

      if (!isCurrent()) return
      refetchConversations()
      if (newConversation?.id) {
        clearUploadFiles()
        void fetchConversationDetail(newConversation.id)
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
      await conversationAPI.setConversation({
        dialog_id: selectedApp,
        conversation_id: renamingConversationId,
        name: newConversationName.trim(),
        is_new: false,
      })

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

  // 获取当前选中应用的信息
  const currentApp = dialogApps.find((app) => app.id === selectedApp)
  const currentAppPrologue = currentApp?.prompt_config?.prologue?.trim() || ''
  const showCurrentAppPrologue = shouldUseBubbleTyping(currentAppPrologue)

  // 获取应用图标 URL
  const getAppIconUrl = useCallback((app: typeof currentApp) => {
    if (!app?.icon) return null
    return app.icon.startsWith('data:') || app.icon.startsWith('http')
      ? app.icon
      : `data:image/png;base64,${app.icon}`
  }, [])

  // 当前应用的图标 URL
  const currentAppIconUrl = useMemo(
    () => getAppIconUrl(currentApp),
    [currentApp, getAppIconUrl],
  )

  // 处理复制
  const handleCopyContent = useCallback(
    (content: string) =>
      copyToClipboardWithFeedback(
        content,
        t('explore.toast.copied'),
        t('explore.toast.copyFailed'),
      ),
    [t],
  )

  const renderMessageAttachments = useCallback(
    (files?: UploadedFileInfo[]) => <ExploreMessageAttachments files={files} />,
    [],
  )

  // 转换消息为 Bubble 格式
  const bubbleItems = useMemo<BubbleListProps['items']>(
    () =>
      messages.map((msg, index) => {
        // 判断当前消息是否正在流式输出
        const lastAssistantMsgIndex = [...messages]
          .reverse()
          .findIndex((m) => m.role === 'assistant')
        const actualLastIndex =
          lastAssistantMsgIndex >= 0
            ? messages.length - 1 - lastAssistantMsgIndex
            : -1
        const isCurrentStreamingMessage =
          isStreaming &&
          msg.role === 'assistant' &&
          index === actualLastIndex &&
          (msg.runPhase === 'running' || msg.runPhase === 'cancelRequested')

        return {
          // 参考 ragflow buildMessageUuidWithRole：使用 role_id 格式确保唯一性
          key: `${msg.role}_${msg.id || index}`,
          role: msg.role,
          content: msg.content || '',
          // 使用 streaming 属性优化流式体验，避免动画异常
          streaming: isCurrentStreamingMessage,
          // 只在消息刚创建、还没有任何内容时显示三个点动画
          // 一旦有 content 或 thinking，就显示实际内容
          loading: isCurrentStreamingMessage && !msg.content && !msg.thinking,
          ...getAppChatBubbleProps(msg.role, currentApp ?? undefined),
          contentRender:
            msg.role === 'assistant'
              ? () => {
                  return (
                    <ExploreChatAnswer
                      content={msg.content || ''}
                      thinking={msg.thinking}
                      messageId={msg.id}
                      references={msg.references}
                      isStreaming={isCurrentStreamingMessage}
                      runPhase={msg.runPhase}
                      notice={<ExploreRunNotice phase={msg.runPhase} />}
                    />
                  )
                }
              : msg.files?.length
                ? () => (
                    <div>
                      <div className="break-words whitespace-pre-wrap">
                        {msg.content}
                      </div>
                      {renderMessageAttachments(msg.files)}
                    </div>
                  )
                : undefined,
          footer:
            msg.role === 'assistant' && !isCurrentStreamingMessage ? (
              <MessageActionsFooter
                content={msg.content || ''}
                onCopy={() => handleCopyContent(msg.content || '')}
                onRegenerate={() => handleRegenerateMessage(index)}
                onLike={() => toast.success(t('explore.toast.like'))}
                onDislike={() => toast.success(t('explore.toast.dislike'))}
              />
            ) : undefined,
        }
      }),
    [
      currentApp,
      handleCopyContent,
      handleRegenerateMessage,
      isStreaming,
      messages,
      renderMessageAttachments,
      t,
    ],
  )

  // 提示词
  const promptItems: PromptsProps['items'] = [
    {
      key: '1',
      label: t('explore.prompts.explain.label'),
      description: t('explore.prompts.explain.description'),
    },
    {
      key: '2',
      label: t('explore.prompts.code.label'),
      description: t('explore.prompts.code.description'),
    },
    {
      key: '3',
      label: t('explore.prompts.summarize.label'),
      description: t('explore.prompts.summarize.description'),
    },
    {
      key: '4',
      label: t('explore.prompts.translate.label'),
      description: t('explore.prompts.translate.description'),
    },
  ]

  // 处理事件
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

  const handleTabChange = (tab: ExploreTab) => {
    setActiveTab(tab)
  }

  const handleConversationSelect = (key?: string) => {
    clearUploadFiles()
    if (key) void fetchConversationDetail(key)
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
      await conversationAPI.removeConversation([conversationId])
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

  return (
    <ChatWorkspace
      scopeKey={`${selectedApp}:${activeConversationKey ?? 'draft'}`}
    >
      <div
        ref={dropContainerRef}
        className="flex h-full"
        style={{ backgroundColor: 'var(--color-chat-content-bg)' }}
      >
        {/* 全屏拖拽指示器 */}
        {isDragging && (
          <div
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
            style={{
              backgroundColor:
                'rgba(var(--color-surface-primary-rgb, 0, 0, 0), 0.6)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              className="flex flex-col items-center gap-4 rounded-2xl p-8"
              style={{
                backgroundColor: 'var(--color-components-card-bg)',
                border: '3px dashed var(--color-border-accent)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Upload
                className="h-16 w-16"
                style={{ color: 'var(--color-text-accent)' }}
              />
              <div
                className="text-lg font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {t('explore.dragUpload.title')}
              </div>
              <div
                className="text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {t('explore.dragUpload.description')}
              </div>
            </div>
          </div>
        )}

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
          onTabChange={handleTabChange}
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

        {/* 右侧主内容区 */}
        <div
          className="flex flex-1"
          style={{ backgroundColor: 'var(--color-chat-content-bg)' }}
        >
          {/* 聊天内容区 */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* 顶部工具栏 */}
            <div
              className="flex items-center justify-between px-6 py-3"
              style={{
                backgroundColor: 'var(--color-chat-header-bg)',
                borderBottom: '1px solid var(--color-chat-header-border)',
                backdropFilter: 'var(--color-chat-header-backdrop)',
              }}
            >
              <div className="flex items-center space-x-3">
                {/* 显示当前应用图标 */}
                {mode === 'chat' && currentApp && (
                  <div className="shrink-0">
                    {currentApp.icon ? (
                      <img
                        src={
                          currentApp.icon.startsWith('data:') ||
                          currentApp.icon.startsWith('http')
                            ? currentApp.icon
                            : `data:image/png;base64,${currentApp.icon}`
                        }
                        alt={currentApp.name}
                        className="h-8 w-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{
                          background:
                            'var(--color-components-gradient-primary)',
                        }}
                      >
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                )}
                <h1
                  className="text-lg font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {mode === 'market'
                    ? t('explore.header.market')
                    : activeTab === 'topics'
                      ? selectedConversationDetail?.name ||
                        currentApp?.name ||
                        t('explore.tabs.topics')
                      : currentApp?.name || t('explore.assistantFallback')}
                </h1>
              </div>

              {mode === 'chat' && (
                <div className="flex items-center gap-3">
                  {/* 布局切换按钮组 */}
                  <div
                    className="hidden items-center gap-1 rounded-lg p-1 md:flex"
                    style={{ border: '1px solid var(--color-border-default)' }}
                  >
                    <Button
                      variant={chatLayout === 'default' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setChatLayout('default')}
                      className="h-7 px-3 py-1"
                      title={t('explore.header.defaultLayout')}
                    >
                      <LayoutGrid className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={chatLayout === 'center' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setChatLayout('center')}
                      className="h-7 px-3 py-1"
                      title={t('explore.header.centerLayout')}
                    >
                      <AlignCenter className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={chatLayout === 'full' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setChatLayout('full')}
                      className="h-7 px-3 py-1"
                      title={t('explore.header.fullLayout')}
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button
                    variant={settingsPanelOpen ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
                    title={t('explore.header.chatSettings')}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* 主内容区 */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {mode === 'market' ? (
                // 应用市场
                <div className="flex-1 overflow-y-auto p-6">
                  {dialogAppsLoading ? (
                    <div
                      className="py-16 text-center"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {t('explore.sidebar.loadingApps')}
                    </div>
                  ) : dialogApps.length === 0 ? (
                    <div
                      className="py-16 text-center"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {t('explore.sidebar.noApps')}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {dialogApps.map((app) => (
                        <div
                          key={app.id}
                          className="rounded-lg p-6 transition-shadow hover:shadow-md"
                          style={{
                            backgroundColor: 'var(--color-components-card-bg)',
                            border:
                              '1px solid var(--color-components-card-border)',
                          }}
                        >
                          <div className="mb-3 flex items-center space-x-3">
                            {getExploreAppIcon(app, 'md')}
                            <h3
                              className="font-medium"
                              style={{
                                color:
                                  'var(--color-components-card-meta-title)',
                              }}
                            >
                              {app.name}
                            </h3>
                          </div>
                          <p
                            className="mb-4 text-sm"
                            style={{
                              color:
                                'var(--color-components-card-meta-description)',
                            }}
                          >
                            {app.description}
                          </p>
                          <Button
                            size="sm"
                            className="w-full"
                            variant={app.status === '1' ? 'outline' : 'default'}
                            disabled={app.status === '1'}
                          >
                            {app.status === '1'
                              ? t('explore.market.added')
                              : t('explore.market.addToWorkspace')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // 聊天模式
                <>
                  {/* 消息区域 */}
                  <div className="flex-1 overflow-y-auto px-6 py-8">
                    {messages.length === 0 ? (
                      <div className="explore-welcome-area flex h-full flex-col items-center justify-center">
                        <Welcome
                          variant="borderless"
                          icon={
                            currentApp?.icon ? (
                              <img
                                src={
                                  currentApp.icon.startsWith('data:') ||
                                  currentApp.icon.startsWith('http')
                                    ? currentApp.icon
                                    : `data:image/png;base64,${currentApp.icon}`
                                }
                                alt={currentApp.name}
                                className="h-16 w-16 rounded-2xl object-cover"
                              />
                            ) : (
                              <div
                                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                                style={{
                                  background:
                                    'var(--color-components-gradient-primary)',
                                }}
                              >
                                <Sparkles
                                  className="size-icon-2xl text-text-inverted"
                                  aria-hidden="true"
                                />
                              </div>
                            )
                          }
                          title={
                            currentApp?.name || t('explore.assistantFallback')
                          }
                          description={
                            currentApp?.description ||
                            t('explore.welcomeDescription')
                          }
                        />
                        {showCurrentAppPrologue ? (
                          <div className="app-chat-area mt-6 w-full max-w-2xl">
                            <Bubble
                              {...getAppChatBubbleProps('assistant', {
                                name: currentApp?.name,
                                icon: currentAppIconUrl || undefined,
                              })}
                              content={currentAppPrologue}
                              contentRender={() => (
                                <ExploreChatAnswer
                                  content={currentAppPrologue}
                                  isStreaming={false}
                                />
                              )}
                            />
                          </div>
                        ) : null}
                        <div className="mt-8">
                          <Prompts
                            items={promptItems}
                            onItemClick={(info) => {
                              if (typeof info.data.label === 'string') {
                                setInputValue(info.data.label)
                              }
                            }}
                            wrap
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'explore-chat-area app-chat-area mx-auto',
                          chatLayout === 'full'
                            ? 'max-w-none px-4'
                            : chatLayout === 'center'
                              ? 'max-w-4xl'
                              : 'max-w-3xl',
                        )}
                        style={{ height: '100%' }}
                      >
                        <Bubble.List
                          items={bubbleItems}
                          autoScroll
                          style={{ height: '100%' }}
                          role={CHAT_BUBBLE_ROLES}
                        />
                      </div>
                    )}
                  </div>

                  {/* 输入区域（参考 ragflow 重构） */}
                  {(activeTab !== 'topics' || selectedConversationDetail) && (
                    <div className="px-6 pb-6">
                      <div
                        className={cn(
                          'mx-auto',
                          chatLayout === 'full'
                            ? 'max-w-none px-4'
                            : chatLayout === 'center'
                              ? 'max-w-4xl'
                              : 'max-w-3xl',
                        )}
                      >
                        <AppChatComposer
                          value={inputValue}
                          onChange={setInputValue}
                          placeholder={t('explore.sender.placeholder')}
                          loading={isStreaming}
                          disabled={isLoadingConversation}
                          // 文件上传面板（参考 ragflow）
                          header={
                            <Sender.Header
                              title={
                                <span
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--color-text-primary)',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                  }}
                                >
                                  <Upload
                                    className="h-4 w-4"
                                    style={{
                                      color: 'var(--color-state-focus)',
                                    }}
                                  />
                                  {t('explore.sender.uploadFile')}
                                </span>
                              }
                              open={headerOpen}
                              onOpenChange={setHeaderOpen}
                              styles={{
                                header: {
                                  backgroundColor:
                                    'var(--color-components-card-bg)',
                                  borderRadius: '16px 16px 0 0',
                                  border: 'none',
                                  borderBottom:
                                    '1px solid var(--color-border-default)',
                                  padding: '12px 16px',
                                },
                                content: {
                                  padding: 0,
                                  backgroundColor:
                                    'var(--color-components-card-bg)',
                                  border: 'none',
                                },
                              }}
                            >
                              <ControlledAttachments
                                items={attachmentItems}
                                uploadLabel={t('explore.sender.uploadFile')}
                                removeLabel={(name) =>
                                  t('explore.attachmentStatus.remove', { name })
                                }
                                failureLabel={t(
                                  'explore.attachmentStatus.failed',
                                )}
                                maxCount={uploadConfig.maxCount}
                                getDropContainer={() =>
                                  dropContainerRef.current
                                }
                                onRemove={removeUploadFile}
                                onRetry={(uid) => {
                                  void retryUploadFile(uid)
                                }}
                                retryLabel={(name) =>
                                  t('explore.attachmentStatus.retry', { name })
                                }
                                overflow="scrollX"
                                placeholder={(type) => ({
                                  icon: (
                                    <div
                                      style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '12px',
                                        backgroundColor:
                                          type === 'drop'
                                            ? 'var(--color-state-focus-10)'
                                            : 'var(--color-surface-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '12px',
                                        transition: 'all 0.2s ease',
                                      }}
                                    >
                                      <Upload
                                        className="h-5 w-5"
                                        style={{
                                          color:
                                            type === 'drop'
                                              ? 'var(--color-state-focus)'
                                              : 'var(--color-text-tertiary)',
                                          transition: 'color 0.2s ease',
                                        }}
                                      />
                                    </div>
                                  ),
                                  title: (
                                    <span
                                      style={{
                                        color: 'var(--color-text-primary)',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                      }}
                                    >
                                      {type === 'drop'
                                        ? t('explore.dragUpload.titleShort')
                                        : t('explore.dragUpload.action')}
                                    </span>
                                  ),
                                  description: (
                                    <span
                                      style={{
                                        color: 'var(--color-text-tertiary)',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        display: 'block',
                                      }}
                                    >
                                      {t('explore.dragUpload.limits', {
                                        count: uploadConfig.maxCount,
                                        size: Math.round(
                                          uploadConfig.maxSize / 1024 / 1024,
                                        ),
                                      })}
                                    </span>
                                  ),
                                })}
                                styles={{
                                  root: {
                                    backgroundColor:
                                      'var(--color-components-card-bg)',
                                    padding: '20px 16px',
                                    transition: 'background-color 0.2s ease',
                                  },
                                  placeholder: {
                                    padding: 0,
                                    margin: 0,
                                    border: 'none',
                                    background: 'transparent',
                                  },
                                  list: {
                                    padding: '0 0 8px 0',
                                    gap: '8px',
                                  },
                                  card: {
                                    backgroundColor:
                                      'var(--color-components-input-bg)',
                                    border:
                                      '1px solid var(--color-border-default)',
                                    borderRadius: '10px',
                                    padding: '8px 12px',
                                    transition: 'all 0.2s ease',
                                  },
                                  name: {
                                    color: 'var(--color-text-primary)',
                                    fontWeight: 500,
                                    fontSize: '13px',
                                  },
                                  description: {
                                    color: 'var(--color-text-tertiary)',
                                    fontSize: '12px',
                                  },
                                }}
                                onUpload={async (file) => {
                                  const result = await uploadFile(file)
                                  if (result) {
                                    toast.success(
                                      t('explore.toast.uploadSuccess', {
                                        name: file.name,
                                      }),
                                    )
                                  }
                                }}
                              />
                            </Sender.Header>
                          }
                          // 右侧操作区：停止按钮或发送按钮
                          suffix={(_, { components }) =>
                            isStreaming ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={handleStopOutput}
                                title={t('explore.sender.stop')}
                                aria-label={t('explore.sender.stop')}
                              >
                                <Square className="h-4 w-4" />
                              </Button>
                            ) : (
                              <components.SendButton
                                disabled={!canSubmitMessage}
                                aria-label={t('studio.editor.send')}
                              />
                            )
                          }
                          onSubmit={(message) => {
                            if (!canSubmitMessage) return
                            void handleSendMessage(message)
                            setHeaderOpen(false)
                          }}
                          onCancel={handleStopOutput}
                          onPasteFile={(files) => {
                            if (files.length > 0) setHeaderOpen(true)
                            for (let i = 0; i < files.length; i++) {
                              const file = files[i]
                              if (file.size <= uploadConfig.maxSize) {
                                void uploadFile(file)
                              } else {
                                toast.error(
                                  t('explore.toast.fileTooLarge', {
                                    name: file.name,
                                  }),
                                )
                              }
                            }
                          }}
                          footer={
                            <div
                              className="flex items-center justify-between"
                              style={{
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingBottom: '10px',
                                paddingTop: '4px',
                              }}
                            >
                              <div className="flex items-center gap-1">
                                {/* 附件按钮 */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 gap-1.5 px-1.5"
                                  onClick={() => setHeaderOpen(!headerOpen)}
                                  title={t('explore.sender.uploadFile')}
                                >
                                  <Paperclip
                                    className="h-4 w-4"
                                    style={{
                                      color: headerOpen
                                        ? 'var(--color-text-accent)'
                                        : 'var(--color-text-tertiary)',
                                    }}
                                  />
                                  {uploadFiles.length > 0 && (
                                    <span
                                      className="text-xs"
                                      style={{
                                        color: 'var(--color-text-secondary)',
                                      }}
                                    >
                                      {
                                        uploadFiles.filter(
                                          (f) => f.status === 'done',
                                        ).length
                                      }
                                    </span>
                                  )}
                                </Button>

                                {/* 深度思考按钮 */}
                                <Button
                                  variant={
                                    enableReasoning ? 'default' : 'ghost'
                                  }
                                  size="sm"
                                  className={cn(
                                    'h-7 gap-1.5 px-2 transition-colors',
                                    enableReasoning
                                      ? 'bg-[var(--color-components-button-primary-bg)] text-[var(--color-components-button-primary-text)] hover:bg-[var(--color-components-button-primary-bg-hover)]'
                                      : 'text-[var(--color-text-tertiary)]',
                                  )}
                                  onClick={() =>
                                    setEnableReasoning(!enableReasoning)
                                  }
                                  title={t('explore.sender.thinking')}
                                >
                                  <Atom className="h-4 w-4" />
                                  <span className="text-xs">
                                    {t('explore.sender.thinking')}
                                  </span>
                                </Button>

                                {/* 联网搜索按钮 */}
                                <Button
                                  variant={enableInternet ? 'default' : 'ghost'}
                                  size="sm"
                                  className={cn(
                                    'h-7 gap-1.5 px-2 transition-colors',
                                    enableInternet
                                      ? 'bg-[var(--color-components-button-primary-bg)] text-[var(--color-components-button-primary-text)] hover:bg-[var(--color-components-button-primary-bg-hover)]'
                                      : 'text-[var(--color-text-tertiary)]',
                                  )}
                                  onClick={() =>
                                    setEnableInternet(!enableInternet)
                                  }
                                  title={t('explore.sender.onlineSearch')}
                                >
                                  <Globe className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* 右侧状态提示 */}
                              <div
                                className="flex items-center gap-2 text-xs"
                                style={{ color: 'var(--color-text-tertiary)' }}
                              >
                                {hasUploadingFiles && (
                                  <div className="flex items-center gap-1">
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    <span>{t('explore.sender.uploading')}</span>
                                  </div>
                                )}
                                {!hasUploadingFiles && hasReadyUploads && (
                                  <div className="flex items-center gap-1">
                                    <span>
                                      {t('explore.sender.attachmentsReady', {
                                        count: uploadedAttachments.length,
                                      })}
                                    </span>
                                    {!inputValue.trim() && (
                                      <span>
                                        {t('explore.sender.canSendDirectly')}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {hasUploadError && (
                                  <span
                                    style={{ color: 'var(--color-text-error)' }}
                                  >
                                    {t('explore.sender.uploadErrorHint')}
                                  </span>
                                )}
                              </div>
                            </div>
                          }
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 聊天设置面板 */}
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
              modelsLoading={modelsLoading}
              onLoadKnowledgeBases={loadKnowledgeBases}
            />
          )}
        </div>
      </div>
    </ChatWorkspace>
  )
}
