/**
 * 首页组件
 *
 * 功能：
 * - 欢迎界面：问候语、输入框、起步卡片、继续工作
 * - 对话界面：消息列表、输入框、工具栏；首条消息发出后输入框从居中滑到底部
 * - 支持 @技能 和 @应用
 * - 应用历史对话选择（加载历史消息并继续对话）
 */

import { useCallback, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useHomeStore } from '@/stores/home'
import { WelcomeSection, ChatSection } from './components'
import {
  HomeMotion,
  readComposerOrigin,
  type ComposerOrigin,
} from './components/composer-entrance'
import { useHomeChat } from './hooks'
import { NEW_CONVERSATION_DRAFT, useHomeDrafts } from './hooks/use-home-drafts'

export const HomePage = () => {
  const user = useAuthStore((state) => state.user)

  // 从 store 获取状态
  const {
    selectedMCPIds,
    selectedMCPServers,
    selectedModelId,
    selectedApps,
    selectedConversationId,
    selectConversation,
  } = useHomeStore()

  // 当前选中的应用（单选）
  const selectedApp = selectedApps.length > 0 ? selectedApps[0] : null

  // 草稿与请求都按身份隔离；草稿另按会话区分，只留在内存中
  const identity = `${user?.id ?? ''}:${user?.tenant_id ?? ''}`
  const draftKey = selectedConversationId ?? NEW_CONVERSATION_DRAFT
  const {
    draft: inputValue,
    setDraft: setInputValue,
    clearDraft,
    moveDraft,
  } = useHomeDrafts(identity, draftKey)

  // 新会话拿到服务端 id 时迁移草稿，生成期间写下的下一条不会丢失
  const handleConversationIdChange = useCallback(
    (conversationId: string | null) => {
      if (conversationId) moveDraft(NEW_CONVERSATION_DRAFT, conversationId)
      selectConversation(conversationId)
    },
    [moveDraft, selectConversation],
  )

  // 对话逻辑
  const {
    messages,
    isStreaming,
    streamingContent,
    streamingThinking,
    isToolAnalyzing,
    isLoadingHistory,
    isSendPending,
    sendMessage,
    stopStreaming,
  } = useHomeChat({
    selectedMCPIds,
    selectedMCPServers,
    selectedModelId,
    selectedApp,
    selectedConversationId,
    identity,
    onConversationIdChange: handleConversationIdChange,
  })

  // 是否显示欢迎界面（加载历史对话时显示对话界面）
  const showWelcome = messages.length === 0 && !isStreaming && !isLoadingHistory

  // 首条消息从欢迎页发出时记下输入框位置，对话界面的输入框从这里滑到底部
  const welcomeComposer = useRef<HTMLDivElement>(null)
  const [dockFrom, setDockFrom] = useState<ComposerOrigin | null>(null)

  // 处理发送：只有被接纳的那份草稿才清空，被拒绝时保留输入
  const handleSend = useCallback(() => {
    const origin = showWelcome
      ? readComposerOrigin(welcomeComposer.current)
      : null
    const accepted = sendMessage(inputValue)
    if (accepted === false) return
    clearDraft(draftKey, inputValue)
    if (!origin) return
    setDockFrom(origin)
    // The docked composer reads the origin once on mount; a send that never
    // left the welcome view must not move a later conversation's composer.
    void Promise.resolve(accepted).finally(() =>
      setDockFrom((current) => (current === origin ? null : current)),
    )
  }, [clearDraft, draftKey, inputValue, sendMessage, showWelcome])

  return (
    <HomeMotion>
      <div className="flex h-full flex-col bg-components-console-bg">
        {showWelcome ? (
          <WelcomeSection
            composerRef={welcomeComposer}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={handleSend}
            isSendPending={isSendPending}
          />
        ) : (
          <ChatSection
            messages={messages}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={handleSend}
            onStop={stopStreaming}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            streamingThinking={streamingThinking}
            isToolAnalyzing={isToolAnalyzing}
            isLoadingHistory={isLoadingHistory}
            isSendPending={isSendPending}
            composerOrigin={dockFrom}
          />
        )}
      </div>
    </HomeMotion>
  )
}

export default HomePage
