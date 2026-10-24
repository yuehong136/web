import { useEffect, useRef, type RefObject } from 'react'
import type { SenderRef } from '@ant-design/x/es/sender/interface'
import { useTranslation } from 'react-i18next'
import { useHomeStore } from '@/stores/home'
import {
  findFirstEnabledModelByType,
  hasEnabledModelName,
} from '@/stores/model'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { ChatInputBox } from './ChatInputBox'
import { SkillPanel } from './SkillPanel'
import { useAtTrigger } from '../hooks/useAtTrigger'
import type { DialogApp } from '@/types/api'
import type { MCPServer } from '@/types/mcp'

export type HomeComposerRequest =
  | { phase: 'idle' | 'preparing' }
  | { phase: 'running'; stop: () => void }
interface HomeComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  request: HomeComposerRequest
  placement: 'welcome' | 'conversation'
  inputRef?: RefObject<SenderRef | null>
}

/** Both entry states use the same selection and model controls. Drafts stay above this component. */
export function HomeComposer({
  value,
  onChange,
  onSend,
  request,
  placement,
  inputRef,
}: HomeComposerProps) {
  const { t } = useTranslation()
  const ownInput = useRef<SenderRef>(null)
  const sender = inputRef ?? ownInput
  const atButtonRef = useRef<HTMLButtonElement>(null!)
  const { myLLMs, isLoading: modelsLoading } = useFetchMyLLMs()
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
  const {
    skillPanelOpen,
    setSkillPanelOpen,
    handleInputChange: handleAtInput,
    removeAtSymbol,
  } = useAtTrigger()
  const locked = request.phase !== 'idle'
  useEffect(() => {
    if (selectedApps.length) return
    if (
      !modelsLoading &&
      myLLMs &&
      !hasEnabledModelName(myLLMs, selectedModelId)
    ) {
      const first = findFirstEnabledModelByType(myLLMs, 'chat')
      if (first) setSelectedModelId(first)
    }
  }, [modelsLoading, myLLMs, selectedModelId, setSelectedModelId, selectedApps])
  const change = (next: string) => {
    const element = sender.current?.inputElement
    const cursor =
      element && 'selectionStart' in element
        ? element.selectionStart
        : next.length
    if (!locked)
      handleAtInput(
        next,
        value,
        typeof cursor === 'number' ? cursor : next.length,
      )
    onChange(next)
  }
  const cleanAt = () => {
    const next = removeAtSymbol(value)
    if (next !== value) onChange(next)
  }
  const chooseSkill = (server: MCPServer) => {
    if (!locked) {
      selectSkill(server)
      cleanAt()
    }
  }
  const chooseApp = (app: DialogApp, conversationId?: string | null) => {
    if (!locked) {
      selectApp(app, conversationId)
      cleanAt()
      setSkillPanelOpen(false)
    }
  }
  return (
    <ChatInputBox
      inputRef={sender}
      inputValue={value}
      onInputChange={change}
      onSend={onSend}
      onStop={request.phase === 'running' ? request.stop : undefined}
      isStreaming={request.phase === 'running'}
      scopeLocked={locked}
      placeholder={t(
        placement === 'welcome'
          ? 'home.input.welcomePlaceholder'
          : 'home.input.chatPlaceholder',
      )}
      selectedMCPServers={selectedMCPServers}
      selectedApps={selectedApps}
      onRemoveSkill={removeSkill}
      onRemoveApp={removeApp}
      isSkillPanelOpen={skillPanelOpen && !locked}
      onSkillPanelToggle={() => {
        if (!locked) setSkillPanelOpen(!skillPanelOpen)
      }}
      skillPanelRef={atButtonRef}
      skillPanelContent={
        <SkillPanel
          open={skillPanelOpen && !locked}
          onClose={() => setSkillPanelOpen(false)}
          onSelectSkill={chooseSkill}
          onSelectApp={chooseApp}
          onStartNewConversation={() => {
            if (!locked) {
              startNewConversation()
              setSkillPanelOpen(false)
            }
          }}
          selectedSkillIds={selectedMCPIds}
          selectedAppIds={selectedAppIds}
          anchorRef={atButtonRef as RefObject<HTMLElement>}
          direction={placement === 'welcome' ? 'down' : 'up'}
        />
      }
      models={myLLMs}
      selectedModelId={selectedModelId}
      onModelSelect={(id) => setSelectedModelId(id || '')}
      modelsLoading={modelsLoading}
      isModelLocked={selectedAppIds.length > 0}
      variant={placement === 'welcome' ? 'welcome' : 'chat'}
    />
  )
}
