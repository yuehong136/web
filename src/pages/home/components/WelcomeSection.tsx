import React, { useRef, useCallback, useState, useEffect } from 'react'
import { useModelStore } from '@/stores/model'
import { useHomeStore } from '@/stores/home'
import { WaveText } from './WaveText'
import { FunctionTabs } from './FunctionTabs'
import { RecommendCards } from './RecommendCards'
import { ChatInputBox } from './ChatInputBox'
import { SkillPanel } from './SkillPanel'
import { functionTabs, recommendCards } from '../constants'
import { getGreeting } from '../utils'
import { useAtTrigger } from '../hooks'
import type { DialogApp } from '@/types/api'
import type { MCPServer } from '@/types/mcp'

interface WelcomeSectionProps {
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  inputValue,
  onInputChange,
  onSend,
}) => {
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const atButtonRef = useRef<HTMLButtonElement>(null!) as React.RefObject<HTMLButtonElement>
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Store 状态
  const { myLLMs, isLoading: modelsLoading, loadMyLLMs } = useModelStore()
  const {
    selectedMCPIds,
    selectedMCPServers,
    selectedAppIds,
    selectedApps,
    selectedModelId,
    selectApp,
    removeApp,
    selectSkill,
    removeSkill,
    setSelectedModelId,
    startNewConversation,
  } = useHomeStore()

  // @ 触发逻辑
  const {
    skillPanelOpen,
    setSkillPanelOpen,
    handleInputChange: handleAtInput,
    removeAtSymbol,
  } = useAtTrigger()

  // 加载模型列表
  useEffect(() => {
    if (Object.keys(myLLMs || {}).length === 0 && !modelsLoading) {
      loadMyLLMs()
    }
  }, [loadMyLLMs, myLLMs, modelsLoading])

  // 自动选择第一个可用的聊天模型
  useEffect(() => {
    if (!selectedModelId && !modelsLoading && myLLMs && Object.keys(myLLMs).length > 0) {
      for (const [, provider] of Object.entries(myLLMs)) {
        if (provider && provider.llm && Array.isArray(provider.llm)) {
          const chatModel = provider.llm.find(model =>
            model && model.type === 'chat' && model.name
          )
          if (chatModel) {
            setSelectedModelId(chatModel.name)
            break
          }
        }
      }
    }
  }, [selectedModelId, modelsLoading, myLLMs, setSelectedModelId])

  // 处理输入变化
  const handleInputChangeInternal = useCallback((value: string) => {
    const cursorPosition = textareaRef.current?.selectionStart || value.length
    handleAtInput(value, inputValue, cursorPosition)
    onInputChange(value)
  }, [inputValue, onInputChange, handleAtInput])

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }, [onSend])

  // 处理技能选择
  const handleSkillSelect = useCallback((server: MCPServer) => {
    selectSkill(server)
    const newValue = removeAtSymbol(inputValue)
    if (newValue !== inputValue) {
      onInputChange(newValue)
    }
  }, [selectSkill, removeAtSymbol, inputValue, onInputChange])

  // 处理应用选择
  const handleAppSelect = useCallback((app: DialogApp, conversationId?: string | null) => {
    selectApp(app, conversationId)
    const newValue = removeAtSymbol(inputValue)
    if (newValue !== inputValue) {
      onInputChange(newValue)
    }
    setSkillPanelOpen(false)
  }, [selectApp, removeAtSymbol, inputValue, onInputChange, setSkillPanelOpen])

  // 处理开启新对话（保持当前应用选择）
  const handleStartNewConversation = useCallback(() => {
    startNewConversation()
    setSkillPanelOpen(false)
  }, [startNewConversation, setSkillPanelOpen])

  // 处理卡片点击
  const handleCardClick = useCallback((title: string) => {
    onInputChange(title)
    textareaRef.current?.focus()
  }, [onInputChange])

  // 处理标签点击
  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(activeTab === tabId ? null : tabId)
  }, [activeTab])

  // 问候语文本
  const greetingText = `${getGreeting()}！有哪些工作要处理？`

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
      <div className="w-full max-w-[1240px] flex flex-col items-center gap-8">
        {/* Header - 问候语（波浪式渐隐浮起） */}
        <div className="w-full flex flex-col items-center mb-20">
          <h1 className="text-[36px] font-semibold text-text-primary text-center">
            <WaveText text={greetingText} charDelay={35} duration={500} />
          </h1>
        </div>

        {/* InputSection - 输入区域 */}
        <div className="w-full max-w-[720px] flex flex-col gap-2">
          <ChatInputBox
            inputValue={inputValue}
            onInputChange={handleInputChangeInternal}
            onKeyDown={handleKeyDown}
            placeholder="给我发消息或布置任务"
            selectedMCPServers={selectedMCPServers}
            selectedApps={selectedApps}
            onRemoveSkill={removeSkill}
            onRemoveApp={removeApp}
            isSkillPanelOpen={skillPanelOpen}
            onSkillPanelToggle={() => setSkillPanelOpen(!skillPanelOpen)}
            skillPanelRef={atButtonRef}
            skillPanelContent={
              <SkillPanel
                open={skillPanelOpen}
                onClose={() => setSkillPanelOpen(false)}
                onSelectSkill={handleSkillSelect}
                onSelectApp={handleAppSelect}
                onStartNewConversation={handleStartNewConversation}
                selectedSkillIds={selectedMCPIds}
                selectedAppIds={selectedAppIds}
                anchorRef={atButtonRef as React.RefObject<HTMLElement>}
                direction="down"
              />
            }
            models={myLLMs}
            selectedModelId={selectedModelId}
            onModelSelect={(modelId) => setSelectedModelId(modelId || '')}
            modelsLoading={modelsLoading}
            isModelLocked={selectedAppIds.length > 0}
            onSend={onSend}
            variant="welcome"
          />
        </div>

        {/* TabsRow - 功能标签 */}
        <FunctionTabs
          tabs={functionTabs}
          activeTab={activeTab}
          onTabClick={handleTabClick}
        />

        {/* CardsSection - 推荐卡片 */}
        <RecommendCards
          cards={recommendCards}
          onCardClick={handleCardClick}
        />
      </div>
    </div>
  )
}
