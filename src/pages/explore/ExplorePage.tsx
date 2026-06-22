import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
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
  Attachments,
  type AttachmentsProps,
  type BubbleListProps,
  type PromptsProps,
} from '@ant-design/x'
import type { RcFile } from 'antd/es/upload/interface'
import XMarkdown from '@ant-design/x-markdown'
import { ChatBubbleLoading } from '@/components/chat/ChatBubbleLoading'
import {
  getMarkdownStreamingOptions,
  markdownConfig,
  mergeMarkdownComponents,
} from '@/components/chat/MarkdownCodeBlock'
import { Button } from '@/components/ui/button'
import { FileIcon, getFileCategory } from '@/components/ui/file-icon'
import { cn, copyToClipboard, formatBytes } from '@/lib/utils'
import { toast } from '@/lib/toast'
import {
  findFirstEnabledModelByType,
  hasEnabledModelName,
  useModelStore,
} from '@/stores/model'
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
  chatConfig,
  type ChatMessage,
  type ChatServiceRequest,
  uploadConfig,
  type UploadFile,
  type UploadedFileInfo,
} from '@/config/chat'
import {
  extractReferencesFromSSEData,
  type ReferenceChunk,
} from '@/utils/reference-replacer'
import {
  ChatSettingsPanel,
  defaultChatSettings,
  type ChatSettings,
} from '@/components/chat/ChatSettingsPanel'
import {
  convertReferencesToSup,
  processContentForCarousel,
} from '@/utils/message-utils'
import { extractThinkContent, type ThinkingStatus } from '@/utils/think-utils'
import { ThinkWrapper } from '@/components/chat/ThinkWrapper'
import { MessageActionsFooter } from '@/components/chat/MessageActionsFooter'
import { CarouselWrapper } from '@/components/chat/CarouselWrapper'
import {
  CHAT_BUBBLE_ROLES,
  CHAT_TEXT_TYPING,
  shouldUseBubbleTyping,
} from '@/components/chat/antx-chat-config'
import { ReferencePanel } from '@/components/chat/ReferencePanel'
import { ReferenceDetailSheet } from '@/components/chat/ReferenceDetailSheet'
import { createReferenceMarkerComponent } from '@/components/chat/ReferenceMarker'
import { ReferenceImageList } from '@/components/chat/ReferenceImageList'
import {
  assertSSEResponse,
  consumeStreamingAnswerChunk,
  createInitialStreamingAnswerState,
  readSSEStream,
  type SSEEnvelope,
} from '@/lib/streaming'
import { ExploreSidebar, type ExploreTab } from './components/explore-sidebar'
import { getExploreAppIcon } from './components/explore-app-icon'

type ExploreAttachment = NonNullable<AttachmentsProps['items']>[number]

const isImageAttachment = (file?: UploadedFileInfo) => {
  return !!file?.mime_type?.startsWith('image/')
}

/** 获取图片预览：优先 base64 data URI，回退到后端 /v1/document/image 端点 */
const getImagePreviewUrl = (file: UploadedFileInfo): string | null => {
  if (file.preview_url) return file.preview_url
  if (file.created_by && file.id) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    return `${baseURL}/v1/document/image/${file.created_by}-${file.id}`
  }
  return null
}

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

const toRcFile = (file: File, uid: string): RcFile => {
  const rcFile = file as RcFile
  rcFile.uid = uid
  return rcFile
}

// 消息类型
interface ChatMessageItem {
  role: 'user' | 'assistant'
  content: string
  id?: string
  references?: ReferenceChunk[]
  thinking?: string
  thinkingComplete?: boolean
  files?: UploadedFileInfo[]
}

interface ConversationDetailMessage {
  role?: string
  content?: string
  id?: string
  reference?: {
    chunks?: ReferenceChunk[]
  }
  files?: UploadedFileInfo[]
}

interface ConversationDetail {
  id?: string
  name?: string
  message?: ConversationDetailMessage[]
}

const toChatMessageItem = (
  message: ConversationDetailMessage,
): ChatMessageItem => ({
  role: message.role === 'user' ? 'user' : 'assistant',
  content: message.content ?? '',
  id: message.id,
  references: message.reference?.chunks || [],
  files: Array.isArray(message.files) ? message.files : [],
})

export const ExplorePage: FC = () => {
  const { t } = useTranslation()
  const { myLLMs, isLoading: modelsLoading, loadMyLLMs } = useModelStore()

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
  const [selectedConversationDetail, setSelectedConversationDetail] =
    useState<ConversationDetail | null>(null)
  const [activeConversationKey, setActiveConversationKey] = useState<
    string | undefined
  >(undefined)
  const [, setLoadingConversationDetail] = useState(false)
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
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

  // 引用详情侧边栏状态
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<ReferenceChunk | null>(
    null,
  )
  const [currentMessageReferences, setCurrentMessageReferences] = useState<
    ReferenceChunk[]
  >([])

  // 文件上传面板状态（参考 ragflow）
  const [headerOpen, setHeaderOpen] = useState(false)

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false)
  const dropContainerRef = useRef<HTMLDivElement>(null)
  const dragCounterRef = useRef(0)

  // 功能开关状态（参考 ragflow）
  const [enableReasoning, setEnableReasoning] = useState(false)
  const [enableInternet, setEnableInternet] = useState(false)

  // 流式输出控制器（用于停止输出）
  const abortControllerRef = useRef<AbortController | null>(null)

  // 用于存储最新的 handleSendMessage 引用，解决 useCallback 闭包陈旧问题
  const handleSendMessageRef = useRef<
    (
      message: string,
      baseMessages?: ChatMessageItem[],
      overrideFiles?: UploadedFileInfo[],
    ) => Promise<void>
  >(null!)

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
    setFiles: setUploadFiles,
  } = useChatUpload()

  // 获取知识库列表
  const { knowledgeBases, loadKnowledgeBases } = useKnowledgeBases()

  // 获取重排序模型列表（LLMModel[] 格式）
  const rerankModels = useRerankModels(myLLMs)

  // 当 dialog 设置加载完成后，同步到本地状态
  // 使用 selectedApp 和 dialogSettings 作为依赖，确保切换应用时能正确更新
  useEffect(() => {
    if (selectedApp) {
      // 当应用变化时，使用从服务器获取的设置更新本地状态
      setChatSettings(dialogSettings)
    }
  }, [selectedApp, dialogSettings])

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
    !hasUploadingFiles &&
    (inputValue.trim().length > 0 || hasReadyUploads)
  const attachmentItems = useMemo<ExploreAttachment[]>(() => {
    return uploadFiles.map((file) => ({
      ...file,
      className: file.status === 'error' ? 'cursor-pointer' : undefined,
      description: getAttachmentStatusLabel(file, t),
      icon: file.response ? (
        <FileIcon fileName={file.response.name} size="sm" />
      ) : undefined,
      originFileObj: file.originFileObj
        ? toRcFile(file.originFileObj, file.uid)
        : undefined,
      src: file.thumbUrl,
      onClick:
        file.status === 'error'
          ? () => {
              void retryUploadFile(file.uid)
            }
          : undefined,
    }))
  }, [retryUploadFile, t, uploadFiles])

  // 加载模型列表
  useEffect(() => {
    loadMyLLMs()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 首次加载一次，store action 引用稳定
  }, [])

  // 自动选择第一个可用的聊天模型
  useEffect(() => {
    if (!modelsLoading && myLLMs && Object.keys(myLLMs).length > 0) {
      if (hasEnabledModelName(myLLMs, selectedModel)) {
        return
      }

      const firstEnabledChatModel = findFirstEnabledModelByType(myLLMs, 'chat')
      if (firstEnabledChatModel) {
        setSelectedModel(firstEnabledChatModel)
      }
    }
  }, [selectedModel, modelsLoading, myLLMs])

  // 自动选择第一个应用
  useEffect(() => {
    if (!selectedApp && dialogApps.length > 0 && !dialogAppsLoading) {
      const activeApp = dialogApps.find((app) => app.status === '1')
      if (activeApp) setSelectedApp(activeApp.id)
    }
  }, [selectedApp, dialogApps, dialogAppsLoading])

  // 获取对话详情
  const fetchConversationDetail = async (conversationId: string) => {
    if (!conversationId) return

    try {
      setLoadingConversationDetail(true)
      // 先清空消息，避免新旧消息混合
      setMessages([])

      const response = (await conversationAPI.getConversationDetail(
        conversationId,
      )) as ConversationDetail
      setSelectedConversationDetail(response)

      // 设置消息列表，如果对话没有消息则清空
      if (response?.message && Array.isArray(response.message)) {
        setMessages(response.message.map(toChatMessageItem))
      }
    } catch (error) {
      console.error('Failed to fetch conversation detail:', error)
      setSelectedConversationDetail(null)
      setMessages([])
    } finally {
      setLoadingConversationDetail(false)
    }
  }

  // 停止输出
  const handleStopOutput = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
  }, [])

  // 重新生成消息（参考 ragflow 的 useRegenerateMessage 实现）
  // 当点击助手消息的重新生成按钮时，找到对应的用户消息并重新发送
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

      // 使用 queueMicrotask 确保 state 更新后再发送新消息
      // 通过 ref 调用最新的 handleSendMessage，避免闭包陈旧问题
      queueMicrotask(() => {
        handleSendMessageRef.current?.(userContent, baseMessages, userFiles)
      })
    },
    [isStreaming, messages, t],
  )

  // 发送消息（支持附件与失败恢复）
  // baseMessages 参数用于重新生成场景，传入截断后的消息列表
  const handleSendMessage = async (
    message: string,
    baseMessages?: ChatMessageItem[],
    overrideFiles?: UploadedFileInfo[],
  ) => {
    if (isStreaming) return

    const pendingFiles = overrideFiles ?? uploadedAttachments
    const normalizedMessage = message.trim()
    const messageContent =
      normalizedMessage ||
      (pendingFiles.length > 0 ? t('explore.attachmentOnlyPrompt') : '')
    const conversationSeed =
      normalizedMessage || pendingFiles[0]?.name || messageContent

    if (!messageContent) return

    const userMessage: ChatMessageItem = {
      role: 'user',
      content: messageContent,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      files: pendingFiles,
    }

    const previousMessages = baseMessages ?? messages
    const updatedMessages = [...previousMessages, userMessage]
    setMessages(updatedMessages)
    setInputValue('')
    if (!overrideFiles?.length) {
      clearUploadFiles()
    }
    setIsStreaming(true)

    // 解析会话 ID：如果没有会话但有选中的应用，自动创建新会话
    // 参考首页 sendAppMessage 的实现方式
    let conversationId = selectedConversationDetail?.id
    const existingUserMessages = previousMessages.filter(
      (m) => m.role === 'user',
    )
    const isFirstUserMessage = existingUserMessages.length === 0

    if (!conversationId && selectedApp) {
      // 自动创建新会话，使用消息内容作为名称（参考 RAGFlow 命名逻辑）
      const conversationName =
        conversationSeed.slice(0, 50) +
        (conversationSeed.length > 50 ? '...' : '')
      try {
        const newConversation = await conversationAPI.setConversation({
          dialog_id: selectedApp,
          name: conversationName,
          is_new: true,
        })
        if (newConversation?.id) {
          conversationId = newConversation.id
          setActiveConversationKey(newConversation.id)
          setSelectedConversationDetail({
            id: newConversation.id,
            name: conversationName,
          })
          refetchConversations()
        }
      } catch (error) {
        console.error('Failed to auto-create conversation:', error)
      }
    } else if (isFirstUserMessage && activeConversationKey && selectedApp) {
      // 对于已存在的会话，如果是第一条用户消息，用消息内容更新会话名称
      const conversationName =
        conversationSeed.slice(0, 50) +
        (conversationSeed.length > 50 ? '...' : '')
      try {
        await conversationAPI.setConversation({
          dialog_id: selectedApp,
          conversation_id: activeConversationKey,
          name: conversationName,
          is_new: false,
        })
        setSelectedConversationDetail((prev) =>
          prev ? { ...prev, name: conversationName } : prev,
        )
        refetchConversations()
      } catch (error) {
        console.error('Failed to update conversation name:', error)
      }
    }

    // 创建新的 AbortController 用于停止输出（局部捕获：handleStopOutput 会把
    // ref 置 null，catch 必须用这个局部引用判断 aborted，不能依赖 ref）
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    let hasReceivedContent = false

    try {
      // 准备 AI 消息
      const aiMessage: ChatMessageItem = {
        role: 'assistant',
        content: '',
        id: `msg-${Date.now()}-ai-${Math.random().toString(36).substr(2, 9)}`,
        references: [],
        thinking: '',
        thinkingComplete: false,
      }

      setMessages((prev) => [...prev, aiMessage])

      // 根据模式选择 API：有会话 ID 时使用 completion，否则回退到 chat_service_sse
      if (conversationId) {
        const completionMessages = updatedMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          id: msg.id,
          ...(msg.files?.length ? { files: msg.files } : {}),
        }))

        // 会话模式 - 使用 completion API（支持话题模式和工作区自动创建的会话）
        const completionParams: Parameters<
          typeof conversationAPI.completion
        >[0] = {
          conversation_id: conversationId,
          messages: completionMessages,
          quote: chatSettings.quote,
          // 功能开关参数（参考 ragflow）
          reasoning: enableReasoning,
          internet: enableInternet,
        }

        // 如果启用了元数据过滤且有条件，添加到请求中
        if (
          chatSettings.metadataFilterMode === 'manual' &&
          chatSettings.metadataCondition.conditions &&
          chatSettings.metadataCondition.conditions.length > 0
        ) {
          completionParams.metadata_condition = chatSettings.metadataCondition
        }

        const response = await conversationAPI.completion(completionParams, {
          signal: abortController.signal,
        })

        await assertSSEResponse(response)

        let streamState = createInitialStreamingAnswerState()

        await readSSEStream<SSEEnvelope>(response, {
          signal: abortController.signal,
          onEvent: (data) => {
            const chunk = consumeStreamingAnswerChunk(streamState, data)
            streamState = chunk.nextState
            if (chunk.isDone) return

            const chunkData =
              chunk.payload && typeof chunk.payload === 'object'
                ? (chunk.payload as Record<string, unknown>)
                : null
            hasReceivedContent = true
            // 只有当 SSE 返回了 references 数据时才更新，避免空数组覆盖之前的有效数据
            const newReferences = chunkData
              ? extractReferencesFromSSEData(chunkData)
              : []
            const cleanContent = streamState.content
            const thinking = streamState.thinking

            setMessages((prev) => {
              const newMsgs = [...prev]
              const lastIdx = newMsgs.length - 1
              if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
                // 只有当新的 references 有数据时才更新，否则保留之前的
                const existingReferences = newMsgs[lastIdx].references || []
                const references =
                  newReferences.length > 0 ? newReferences : existingReferences

                newMsgs[lastIdx] = {
                  ...newMsgs[lastIdx],
                  content: cleanContent,
                  references,
                  thinking,
                }
              }
              return newMsgs
            })
          },
        })
      } else {
        // 回退：无应用或创建会话失败时，使用 chat_service_sse 直接聊天
        const historyMessages: ChatMessage[] = updatedMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

        const requestBody: ChatServiceRequest = {
          prompt: '',
          messages: historyMessages,
          llm_name: selectedModel || 'gpt-4o-mini',
          stream: true,
          gen_conf: {},
          tavily_api_key: '',
        }

        const baseURL =
          import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
        const fullUrl = `${baseURL}/v1${chatConfig.apiEndpoint}`
        const token = localStorage.getItem('auth_token')

        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        })

        await assertSSEResponse(response)

        let streamState = createInitialStreamingAnswerState()

        await readSSEStream<SSEEnvelope>(response, {
          signal: abortController.signal,
          onEvent: (data) => {
            const chunk = consumeStreamingAnswerChunk(streamState, data)
            streamState = chunk.nextState
            if (chunk.isDone) return

            setMessages((prev) => {
              const newMsgs = [...prev]
              const lastIdx = newMsgs.length - 1
              if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
                hasReceivedContent = true
                newMsgs[lastIdx] = {
                  ...newMsgs[lastIdx],
                  content: streamState.content,
                  thinking: streamState.thinking,
                }
              }
              return newMsgs
            })
          },
        })
      }
    } catch (error) {
      // 用户主动停止（fetch 发起阶段 abort 会抛 AbortError）：不报错、不回滚，
      // 保留已收内容，finally 仍复位 isStreaming
      if (abortController.signal.aborted) return
      console.error('Failed to send message:', error)
      if (!hasReceivedContent) {
        setMessages(previousMessages)
        setInputValue(messageContent)
        if (pendingFiles.length > 0 && !overrideFiles?.length) {
          setUploadFiles(
            pendingFiles.map((file, index) => ({
              uid: `${file.id}-${index}`,
              name: file.name,
              size: file.size,
              type: file.mime_type,
              status: 'done' as const,
              percent: 100,
              response: file,
              thumbUrl: file.preview_url ?? undefined,
            })),
          )
          setHeaderOpen(true)
        }
      } else {
        setMessages((prev) => {
          const newMsgs = [...prev]
          const lastIdx = newMsgs.length - 1
          if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
            newMsgs[lastIdx] = {
              ...newMsgs[lastIdx],
              content: t('explore.toast.assistantError'),
            }
          }
          return newMsgs
        })
      }
    } finally {
      setIsStreaming(false)
    }
  }

  // 保持 ref 指向最新的 handleSendMessage
  handleSendMessageRef.current = handleSendMessage

  // 新建对话
  const handleCreateConversation = async () => {
    if (!selectedApp) return

    try {
      const newConversation = await conversationAPI.setConversation({
        dialog_id: selectedApp,
        name: t('explore.conversations.fallbackName'),
        is_new: true,
      })

      refetchConversations()

      if (newConversation?.id) {
        // 立即更新选中状态
        setActiveConversationKey(newConversation.id)
        // 清空消息，准备新对话
        setMessages([])
        // 异步加载对话详情
        setTimeout(() => fetchConversationDetail(newConversation.id), 500)
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  // 重命名对话
  const confirmRenameConversation = async () => {
    if (!renamingConversationId || !newConversationName.trim() || !selectedApp)
      return

    try {
      await conversationAPI.setConversation({
        dialog_id: selectedApp,
        conversation_id: renamingConversationId,
        name: newConversationName.trim(),
        is_new: false,
      })

      refetchConversations()

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

  // 处理引用点击事件 - 打开详情侧边栏
  const _handleReferenceClick = useCallback(
    (
      reference: ReferenceChunk,
      _index: number,
      allReferences?: ReferenceChunk[],
    ) => {
      console.log('Reference clicked:', reference)
      setSelectedChunk(reference)
      if (allReferences) {
        setCurrentMessageReferences(allReferences)
      }
      setDetailSheetOpen(true)
    },
    [],
  )

  // 处理查看详情
  const handleViewDetail = useCallback(
    (chunk: ReferenceChunk, allReferences?: ReferenceChunk[]) => {
      setSelectedChunk(chunk)
      if (allReferences) {
        setCurrentMessageReferences(allReferences)
      }
      setDetailSheetOpen(true)
    },
    [],
  )

  // 处理复制
  const handleCopyContent = useCallback(
    (content: string) => {
      copyToClipboard(content)
      toast.success(t('explore.toast.copied'))
    },
    [t],
  )

  const renderMessageAttachments = useCallback(
    (files?: UploadedFileInfo[]) => {
      if (!files?.length) {
        return null
      }

      const imageFiles = files.filter(isImageAttachment)
      const otherFiles = files.filter((f) => !isImageAttachment(f))

      return (
        <div className="mt-3 grid gap-2">
          {/* 图片附件：较大预览 */}
          {imageFiles.length > 0 && (
            <div
              className={`grid gap-2 ${imageFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
            >
              {imageFiles.map((file) => {
                const imgUrl = getImagePreviewUrl(file)
                return (
                  <div
                    key={file.id}
                    className="overflow-hidden rounded-xl border"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.14)',
                      borderColor: 'rgba(255, 255, 255, 0.18)',
                    }}
                  >
                    {imgUrl ? (
                      <button
                        type="button"
                        className="block w-full cursor-pointer"
                        aria-label={t('explore.attachmentStatus.openPreview', {
                          name: file.name,
                        })}
                        onClick={() => window.open(imgUrl, '_blank')}
                      >
                        <img
                          src={imgUrl}
                          alt={file.name}
                          className="max-h-64 w-full object-contain"
                          style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
                        />
                      </button>
                    ) : (
                      <div
                        className="flex h-32 items-center justify-center"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                      >
                        <FileIcon fileName={file.name} size="md" />
                      </div>
                    )}
                    <div className="px-3 py-1.5">
                      <div className="truncate text-xs opacity-80">
                        {file.name} · {formatBytes(file.size || 0)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 非图片附件：文件卡片 */}
          {otherFiles.map((file) => {
            const category = getFileCategory(file.extension || '')
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-xl border px-3 py-2"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  borderColor: 'rgba(255, 255, 255, 0.18)',
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                >
                  <FileIcon fileName={file.name} size="md" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {file.name}
                  </div>
                  <div className="text-xs opacity-80">
                    {category === 'image'
                      ? t('explore.attachmentStatus.image')
                      : file.extension?.toUpperCase() || 'FILE'}{' '}
                    · {formatBytes(file.size || 0)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )
    },
    [t],
  )

  // 转换消息为 Bubble 格式
  const bubbleItems = useMemo<BubbleListProps['items']>(
    () =>
      messages.map((msg, index) => {
        const references = msg.references || []

        // 使用新的 createReferenceMarkerComponent 创建内联引用组件
        const SupComponent = createReferenceMarkerComponent(references, {
          onViewDetail: (chunk) => handleViewDetail(chunk, references),
          onCopy: handleCopyContent,
        })
        const markdownComponents = mergeMarkdownComponents({
          sup: SupComponent,
        })

        // 判断当前消息是否正在流式输出
        const lastAssistantMsgIndex = [...messages]
          .reverse()
          .findIndex((m) => m.role === 'assistant')
        const actualLastIndex =
          lastAssistantMsgIndex >= 0
            ? messages.length - 1 - lastAssistantMsgIndex
            : -1
        const isCurrentStreamingMessage =
          isStreaming && msg.role === 'assistant' && index === actualLastIndex

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
          placement: (msg.role === 'user' ? 'end' : 'start') as 'start' | 'end',
          // 底部操作栏固定在助手消息行头，避免随内容宽度漂移
          footerPlacement:
            msg.role === 'assistant' ? ('outer-start' as const) : undefined,
          avatar:
            msg.role === 'user' ? (
              <div
                className="flex h-8 min-h-[32px] w-8 min-w-[32px] flex-shrink-0 items-center justify-center rounded-full text-sm font-medium"
                style={{
                  background: 'var(--color-chat-bubble-user-avatar-bg)',
                  color: 'var(--color-chat-bubble-user-avatar-text)',
                }}
              >
                U
              </div>
            ) : currentAppIconUrl ? (
              <div className="h-8 min-h-[32px] w-8 min-w-[32px] flex-shrink-0 overflow-hidden rounded-full">
                <img
                  src={currentAppIconUrl}
                  alt={currentApp?.name || 'AI'}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div
                className="flex h-8 min-h-[32px] w-8 min-w-[32px] flex-shrink-0 items-center justify-center rounded-full"
                style={{
                  background: 'var(--color-components-gradient-primary)',
                }}
              >
                <span className="text-sm font-bold text-white">AI</span>
              </div>
            ),
          contentRender:
            msg.role === 'assistant'
              ? () => {
                  // 优先使用流式输出时提取的 thinking 字段，回退到从 content 提取（针对历史消息）
                  const fallback = extractThinkContent(msg.content || '')
                  const thinkContent = msg.thinking || fallback.thinkContent
                  const mainContent = msg.thinking
                    ? msg.content || ''
                    : fallback.mainContent

                  // 确定思考状态：
                  // - 服务端返回的是累积式流式数据，每个 chunk 都包含完整的 <think>...</think>
                  // - 所以不能用闭合标签来判断，而是用 isStreaming 状态
                  // - 如果正在流式输出且有思考内容，就是 thinking 状态
                  // - 如果流式输出结束或者是历史消息，就是 complete 状态
                  let status: ThinkingStatus = 'none'
                  if (thinkContent) {
                    // 检查是否是当前正在流式输出的消息（最后一条助手消息且 isStreaming 为 true）
                    const lastAssistantMsg = [...messages]
                      .reverse()
                      .find((m) => m.role === 'assistant')
                    const isLastAssistantMsg = lastAssistantMsg?.id === msg.id
                    const isCurrentlyStreaming =
                      isStreaming && isLastAssistantMsg
                    status = isCurrentlyStreaming ? 'thinking' : 'complete'
                  }

                  // 处理连续图片引用，分析轮播组
                  const { content: processedContent, carouselGroups } =
                    processContentForCarousel(mainContent, references)

                  // 对处理后的内容转换剩余引用格式
                  const mainContentWithSup =
                    convertReferencesToSup(processedContent)

                  // 渲染内容片段（在轮播占位符处分割）
                  const renderContentWithCarousels = () => {
                    if (carouselGroups.length === 0) {
                      // 没有轮播组，直接渲染
                      return (
                        <XMarkdown
                          config={markdownConfig}
                          components={markdownComponents}
                          paragraphTag="div"
                          streaming={getMarkdownStreamingOptions(
                            isCurrentStreamingMessage,
                          )}
                        >
                          {mainContentWithSup}
                        </XMarkdown>
                      )
                    }

                    // 有轮播组，分割渲染
                    const parts = mainContentWithSup.split(
                      /<carousel-placeholder[^>]*><\/carousel-placeholder>/g,
                    )
                    const elements: ReactNode[] = []

                    parts.forEach((part, idx) => {
                      // 渲染文本部分
                      if (part.trim()) {
                        elements.push(
                          <XMarkdown
                            key={`text-${idx}`}
                            config={markdownConfig}
                            components={markdownComponents}
                            paragraphTag="div"
                            streaming={getMarkdownStreamingOptions(
                              isCurrentStreamingMessage,
                            )}
                          >
                            {part}
                          </XMarkdown>,
                        )
                      }

                      // 在文本部分之间插入轮播（除了最后一个部分）
                      if (idx < carouselGroups.length) {
                        const group = carouselGroups[idx]
                        elements.push(
                          <CarouselWrapper
                            key={`carousel-${idx}`}
                            group={group}
                            chunks={references}
                          />,
                        )
                      }
                    })

                    return <>{elements}</>
                  }

                  return (
                    <div className="space-y-3">
                      {/* Think 组件展示思考过程 - 使用外部定义的 ThinkWrapper 组件 */}
                      {thinkContent && (
                        <ThinkWrapper status={status} messageId={msg.id}>
                          <div
                            className="whitespace-pre-wrap text-sm"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {thinkContent}
                          </div>
                        </ThinkWrapper>
                      )}

                      {/* 使用 XMarkdown 渲染主内容，支持轮播组件 */}
                      {mainContentWithSup && (
                        <div className="markdown-content leading-relaxed">
                          {renderContentWithCarousels()}
                        </div>
                      )}

                      {/* 如果没有内容且没有思考内容，显示 Ant Design X 三点加载动画 */}
                      {!thinkContent && !mainContent && <ChatBubbleLoading />}

                      {/* 图片引用轮播列表 - 汇总展示消息中引用的所有图片 */}
                      {references.length > 0 && (
                        <ReferenceImageList
                          referenceChunks={references}
                          messageContent={mainContent}
                          className="mt-4"
                          onImageClick={(chunk) =>
                            handleViewDetail(chunk, references)
                          }
                        />
                      )}

                      {/* 底部汇总显示所有引用来源 - 使用新的 ReferencePanel 组件 */}
                      {references.length > 0 && (
                        <ReferencePanel
                          chunks={references}
                          onChunkClick={(chunk) =>
                            handleViewDetail(chunk, references)
                          }
                          defaultVisiblePerDoc={2}
                        />
                      )}
                    </div>
                  )
                }
              : msg.files?.length
                ? () => (
                    <div>
                      <div className="whitespace-pre-wrap break-words">
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
                onCopy={async () => {
                  try {
                    await copyToClipboard(msg.content || '')
                    toast.success(t('explore.toast.copied'))
                  } catch {
                    toast.error(t('explore.toast.copyFailed'))
                  }
                }}
                onRegenerate={() => handleRegenerateMessage(index)}
                onLike={() => toast.success(t('explore.toast.like'))}
                onDislike={() => toast.success(t('explore.toast.dislike'))}
              />
            ) : undefined,
          variant: 'borderless' as const,
          styles:
            msg.role === 'user'
              ? {
                  // 用户消息：保持气泡框样式
                  content: {
                    backgroundColor: 'var(--color-chat-bubble-user-bg)',
                    color: 'var(--color-chat-bubble-user-text)',
                    borderRadius: '18px',
                    padding: '12px 16px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    maxWidth: 'min(640px, 100%)',
                  },
                }
              : {
                  // AI 消息：透明背景，融入页面
                  content: {
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-primary)',
                    borderRadius: '0',
                    padding: '0',
                    border: 'none',
                    boxShadow: 'none',
                  },
                },
        }
      }),
    [
      currentApp?.name,
      currentAppIconUrl,
      handleCopyContent,
      handleRegenerateMessage,
      handleViewDetail,
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
    setMode('market')
    setSelectedApp('')
  }

  const handleAppSelect = (appId: string) => {
    setMode('chat')
    setSelectedApp(appId)
    setActiveTab('workspace')
    setMessages([])
    // 切换应用时清理对话状态，避免状态不一致
    setSelectedConversationDetail(null)
    setActiveConversationKey(undefined)
  }

  const handleTopicsClick = () => {
    setActiveTab('topics')
    setMode('chat')
    setSelectedConversationDetail(null)
    setActiveConversationKey(undefined)
    setMessages([])
  }

  const handleTabChange = (tab: ExploreTab) => {
    setActiveTab(tab)
  }

  const handleConversationSelect = (key?: string) => {
    setActiveConversationKey(key)
    setMessages([])

    if (key) {
      void fetchConversationDetail(key)
    } else {
      setSelectedConversationDetail(null)
    }
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
    try {
      await conversationAPI.removeConversation([conversationId])
      refetchConversations()
      if (activeConversationKey === conversationId) {
        setActiveConversationKey(undefined)
        setSelectedConversationDetail(null)
        setMessages([])
      }
      toast.success(t('explore.conversations.deleted'))
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      toast.error(t('explore.conversations.deleteFailed'))
    }
  }

  return (
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
                <div className="flex-shrink-0">
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
                        background: 'var(--color-components-gradient-primary)',
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
                              color: 'var(--color-components-card-meta-title)',
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
                      <style>{`
                      /* Welcome 组件样式 */
                      .explore-welcome-area .ant-welcome-title {
                        color: var(--color-text-primary) !important;
                      }
                      .explore-welcome-area .ant-welcome-description {
                        color: var(--color-text-secondary) !important;
                      }
                      /* Prompts 组件样式 */
                      .explore-welcome-area .ant-prompts-item {
                        background-color: var(--color-components-card-bg) !important;
                        border-color: var(--color-components-card-border) !important;
                        transition: all 0.2s ease !important;
                      }
                      .explore-welcome-area .ant-prompts-item:hover {
                        border-color: var(--color-components-button-primary-bg) !important;
                        background-color: var(--color-components-card-bg-hover) !important;
                      }
                      .explore-welcome-area .ant-prompts-label {
                        color: var(--color-text-primary) !important;
                      }
                      .explore-welcome-area .ant-prompts-description {
                        color: var(--color-text-secondary) !important;
                      }
                    `}</style>
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
                              <span className="text-2xl font-bold text-white">
                                AI
                              </span>
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
                        <div className="mt-6 w-full max-w-2xl">
                          <Bubble
                            content={currentAppPrologue}
                            placement="start"
                            variant="borderless"
                            shape="round"
                            typing={CHAT_TEXT_TYPING}
                            avatar={
                              currentAppIconUrl ? (
                                <div className="h-8 min-h-[32px] w-8 min-w-[32px] shrink-0 overflow-hidden rounded-full">
                                  <img
                                    src={currentAppIconUrl}
                                    alt={currentApp?.name || 'AI'}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div
                                  className="flex h-8 min-h-[32px] w-8 min-w-[32px] shrink-0 items-center justify-center rounded-full"
                                  style={{
                                    background:
                                      'var(--color-components-gradient-primary)',
                                  }}
                                >
                                  <span className="text-sm font-bold text-white">
                                    AI
                                  </span>
                                </div>
                              )
                            }
                            styles={{
                              content: {
                                backgroundColor:
                                  'var(--color-chat-bubble-ai-bg)',
                                color: 'var(--color-chat-bubble-ai-text)',
                                border: 'none',
                                boxShadow: 'none',
                                borderRadius: '16px',
                                padding: '12px 16px',
                                fontSize: '14px',
                                lineHeight: 1.6,
                              },
                            }}
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
                        'explore-chat-area mx-auto',
                        chatLayout === 'full'
                          ? 'max-w-none px-4'
                          : chatLayout === 'center'
                            ? 'max-w-4xl'
                            : 'max-w-3xl',
                      )}
                      style={{ height: '100%' }}
                    >
                      <style>{`
                      /* Think 组件主题适配 */
                      .explore-chat-area .ant-think-status-wrapper,
                      .explore-chat-area .ant-think-title {
                        color: var(--color-text-secondary) !important;
                      }
                      .explore-chat-area .ant-think {
                        background-color: var(--color-components-card-bg) !important;
                        border-color: var(--color-components-card-border) !important;
                      }
                      .explore-chat-area .ant-think-content {
                        color: var(--color-text-secondary) !important;
                      }
                      /* Bubble 组件主题适配 */
                      .explore-chat-area .ant-bubble-content {
                        color: var(--color-text-primary) !important;
                      }
                      /* Actions 组件主题适配 */
                      .explore-chat-area .ant-actions-item {
                        color: var(--color-text-tertiary) !important;
                      }
                      .explore-chat-area .ant-actions-item:hover {
                        color: var(--color-text-primary) !important;
                        background-color: var(--color-state-hover) !important;
                      }
                      /* XMarkdown 内容样式 */
                      .explore-chat-area .markdown-content {
                        color: var(--color-text-primary) !important;
                      }
                      .explore-chat-area .markdown-content a {
                        color: var(--color-components-button-primary-bg) !important;
                      }
                      .explore-chat-area .markdown-content code {
                        background-color: var(--color-background-subtle) !important;
                        color: var(--color-text-primary) !important;
                      }
                      .explore-chat-area .markdown-content pre {
                        background-color: var(--color-components-pre-bg) !important;
                        border-color: var(--color-components-pre-border) !important;
                      }
                      .explore-chat-area .markdown-content pre code {
                        color: var(--color-components-pre-text) !important;
                      }
                      .explore-chat-area .markdown-content table:not(pre) {
                        border-collapse: collapse !important;
                        display: block !important;
                        width: max-content !important;
                        max-width: 100% !important;
                        overflow: auto !important;
                        border: 1px solid var(--color-border-default) !important;
                        border-radius: 8px !important;
                        margin: 8px 0 16px 0 !important;
                        background-color: var(--color-components-card-bg) !important;
                      }
                      .explore-chat-area .markdown-content th,
                      .explore-chat-area .markdown-content td {
                        border: 1px solid var(--color-border-default) !important;
                        padding: 8px 12px !important;
                        text-align: left !important;
                        vertical-align: top !important;
                      }
                      .explore-chat-area .markdown-content th {
                        color: var(--color-text-primary) !important;
                        background-color: var(--color-surface-secondary) !important;
                        font-weight: 600 !important;
                      }
                      .explore-chat-area .markdown-content td {
                        color: var(--color-text-primary) !important;
                        background-color: var(--color-surface-primary) !important;
                      }
                    `}</style>
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
                        'explore-sender-area mx-auto overflow-hidden rounded-2xl',
                        chatLayout === 'full'
                          ? 'max-w-none px-4'
                          : chatLayout === 'center'
                            ? 'max-w-4xl'
                            : 'max-w-3xl',
                      )}
                      style={{
                        border:
                          '1px solid var(--color-components-input-border)',
                        backgroundColor: 'var(--color-components-input-bg)',
                      }}
                    >
                      {/* Sender 和 Attachments 样式覆盖 - 使用项目语义令牌 */}
                      <style>{`
                      /* Sender 输入框样式 - 现代化无高亮设计，边框在外层容器 */
                      .explore-sender-area .ant-sender {
                        background-color: transparent !important;
                        border: none !important;
                        box-shadow: none !important;
                        outline: none !important;
                        padding-bottom: 0 !important;
                      }
                      .explore-sender-area .ant-sender:hover {
                        border: none !important;
                      }
                      .explore-sender-area .ant-sender:focus-within {
                        border: none !important;
                        box-shadow: none !important;
                        outline: none !important;
                      }
                      .explore-sender-area .ant-sender-content {
                        background-color: transparent !important;
                        padding-bottom: 0 !important;
                      }
                      /* 移除 Sender 内部可能的分隔线和边距 */
                      .explore-sender-area .ant-sender-actions {
                        border-top: none !important;
                        padding-top: 0 !important;
                        margin-top: 0 !important;
                      }
                      .explore-sender-area .ant-sender textarea,
                      .explore-sender-area .ant-sender input {
                        color: var(--color-components-input-text) !important;
                        background-color: transparent !important;
                        outline: none !important;
                        box-shadow: none !important;
                        padding-left: 4px !important;
                      }
                      .explore-sender-area .ant-sender textarea:focus,
                      .explore-sender-area .ant-sender input:focus {
                        outline: none !important;
                        box-shadow: none !important;
                      }
                      .explore-sender-area .ant-sender textarea::placeholder,
                      .explore-sender-area .ant-sender input::placeholder {
                        color: var(--color-components-input-text-placeholder) !important;
                      }
                      /* 发送按钮样式 */
                      .explore-sender-area .ant-sender-actions-btn {
                        background-color: var(--color-components-button-primary-bg) !important;
                        color: var(--color-components-button-primary-text) !important;
                        border: none !important;
                      }
                      .explore-sender-area .ant-sender-actions-btn:hover {
                        background-color: var(--color-components-button-primary-bg-hover) !important;
                      }
                      .explore-sender-area .ant-sender-actions-btn:disabled {
                        background-color: var(--color-components-button-primary-bg-disabled) !important;
                        color: var(--color-components-button-primary-text-disabled) !important;
                      }
                      /* 当 Header 打开时，Sender 顶部不要圆角 */
                      .explore-sender-area .ant-sender-header ~ .ant-sender,
                      .explore-sender-area .ant-sender-header + .ant-sender {
                        border-radius: 0 !important;
                        border-top: none !important;
                      }
                      /* 关闭按钮 - 现代化圆形设计 */
                      .explore-sender-area .ant-sender-header-close,
                      .explore-sender-area [class*="sender-header"] button,
                      .explore-sender-area [class*="header-close"] {
                        color: var(--color-text-tertiary) !important;
                        background-color: transparent !important;
                        border-color: transparent !important;
                        border-radius: 8px !important;
                        width: 32px !important;
                        height: 32px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        transition: all 0.2s ease !important;
                      }
                      .explore-sender-area .ant-sender-header-close:hover,
                      .explore-sender-area [class*="sender-header"] button:hover,
                      .explore-sender-area [class*="header-close"]:hover {
                        color: var(--color-text-primary) !important;
                        background-color: var(--color-state-hover) !important;
                      }
                      /* 标题栏整体样式优化 */
                      .explore-sender-area .ant-sender-header {
                        padding: 12px 16px !important;
                        border-bottom: 1px solid var(--color-border-default) !important;
                      }
                      .explore-sender-area .ant-sender-header-title {
                        font-weight: 500 !important;
                        font-size: 14px !important;
                        color: var(--color-text-primary) !important;
                        display: flex !important;
                        align-items: center !important;
                        gap: 8px !important;
                      }
                      /* Attachments 容器背景 - 简洁设计 */
                      .explore-sender-area .ant-attachments {
                        background-color: var(--color-components-card-bg) !important;
                      }
                      /* 移除内层多余边框 */
                      .explore-sender-area .ant-attachment-placeholder,
                      .explore-sender-area .ant-attachment-placeholder-inner {
                        border: none !important;
                        background: transparent !important;
                        padding: 0 !important;
                        margin: 0 !important;
                      }
                      /* 悬停效果 */
                      .explore-sender-area .ant-attachments:hover {
                        background-color: var(--color-state-hover) !important;
                      }
                      /* 已上传文件列表项 */
                      .explore-sender-area .ant-attachments-list-item {
                        background-color: var(--color-components-input-bg) !important;
                        border: 1px solid var(--color-border-default) !important;
                        border-radius: 8px !important;
                        transition: all 0.2s ease !important;
                      }
                      .explore-sender-area .ant-attachments-list-item:hover {
                        background-color: var(--color-components-input-bg-hover) !important;
                        border-color: var(--color-border-accent) !important;
                      }
                      .explore-sender-area .ant-attachments-list-item-name {
                        color: var(--color-text-primary) !important;
                      }
                    `}</style>

                      <Sender
                        value={inputValue}
                        onChange={setInputValue}
                        placeholder={t('explore.sender.placeholder')}
                        loading={isStreaming}
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
                                  style={{ color: 'var(--color-state-focus)' }}
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
                            <Attachments
                              items={attachmentItems}
                              maxCount={uploadConfig.maxCount}
                              disabled={hasUploadingFiles}
                              getDropContainer={() => dropContainerRef.current}
                              onRemove={(file) => {
                                if (
                                  file &&
                                  typeof file === 'object' &&
                                  'uid' in file
                                ) {
                                  removeUploadFile((file as UploadFile).uid)
                                }
                              }}
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
                              // 自定义上传请求，通过 useChatUpload 统一管理状态
                              customRequest={async (options) => {
                                const { file, onSuccess, onError } = options
                                try {
                                  const result = await uploadFile(file as File)
                                  if (result) {
                                    onSuccess?.(result, new XMLHttpRequest())
                                    toast.success(
                                      t('explore.toast.uploadSuccess', {
                                        name: (file as File).name,
                                      }),
                                    )
                                  } else {
                                    onError?.(new Error('Upload failed'))
                                  }
                                } catch (error) {
                                  console.error('Upload error:', error)
                                  onError?.(error as Error)
                                  toast.error(
                                    t('explore.toast.uploadFailed', {
                                      message: (error as Error).message,
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
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          ) : (
                            <components.SendButton
                              disabled={!canSubmitMessage}
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
                        style={{
                          borderRadius: '0',
                          border: 'none',
                          backgroundColor: 'transparent',
                        }}
                        styles={{
                          input: {
                            color: 'var(--color-components-input-text)',
                          },
                        }}
                      />

                      {/* 输入框下方工具栏 - 与输入框无缝融合，参考 Claude 设计 */}
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
                                style={{ color: 'var(--color-text-secondary)' }}
                              >
                                {
                                  uploadFiles.filter((f) => f.status === 'done')
                                    .length
                                }
                              </span>
                            )}
                          </Button>

                          {/* 深度思考按钮 */}
                          <Button
                            variant={enableReasoning ? 'default' : 'ghost'}
                            size="sm"
                            className={cn(
                              'h-7 gap-1.5 px-2 transition-colors',
                              enableReasoning
                                ? 'bg-[var(--color-components-button-primary-bg)] text-[var(--color-components-button-primary-text)] hover:bg-[var(--color-components-button-primary-bg-hover)]'
                                : 'text-[var(--color-text-tertiary)]',
                            )}
                            onClick={() => setEnableReasoning(!enableReasoning)}
                            title={t('explore.sender.thinking')}
                          >
                            <Atom className="h-4 w-4" />
                            <span className="text-xs">Thinking</span>
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
                            onClick={() => setEnableInternet(!enableInternet)}
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
                            <span style={{ color: 'var(--color-text-error)' }}>
                              {t('explore.sender.uploadErrorHint')}
                            </span>
                          )}
                        </div>
                      </div>
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
            onSave={selectedApp ? () => saveSettings(chatSettings) : undefined}
            saving={savingSettings}
            loading={settingsLoading}
            knowledgeBases={knowledgeBases}
            rerankModels={rerankModels}
            llmModels={myLLMs}
            modelsLoading={modelsLoading}
            onLoadKnowledgeBases={loadKnowledgeBases}
          />
        )}

        {/* 引用详情侧边栏 */}
        <ReferenceDetailSheet
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
          chunk={selectedChunk}
          allChunks={currentMessageReferences}
          onCopySuccess={() => {
            /* 组件内部已处理 toast */
          }}
        />
      </div>
    </div>
  )
}
