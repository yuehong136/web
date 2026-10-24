import type { Ref, RefObject, ReactNode } from 'react'
import type { SenderRef } from '@ant-design/x/es/sender/interface'
import { useTranslation } from 'react-i18next'
import { ChatComposer } from '@/components/chat/chat-composer'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { SelectedTags } from './SelectedTags'
import { InputToolbar } from './InputToolbar'
import type { DialogApp } from '@/types/api'
import type { MCPServer } from '@/types/mcp'
import type { MyLLMProvider } from '@/stores/model'

interface ChatInputBoxProps {
  inputValue: string
  onInputChange: (value: string) => void
  placeholder?: string
  inputRef?: Ref<SenderRef>
  selectedMCPServers: MCPServer[]
  selectedApps: DialogApp[]
  onRemoveSkill: (id: string) => void
  onRemoveApp: (id: string) => void
  isSkillPanelOpen: boolean
  onSkillPanelToggle: () => void
  skillPanelRef: RefObject<HTMLButtonElement>
  skillPanelContent: ReactNode
  models: MyLLMProvider | null
  selectedModelId: string
  onModelSelect: (id: string | null) => void
  modelsLoading: boolean
  isModelLocked: boolean
  onSend: () => void
  onStop?: () => void
  isStreaming?: boolean
  scopeLocked?: boolean
  variant?: 'welcome' | 'chat'
}

/** Domain controls are slots; the shared composer owns keyboard/submission UI. */
export function ChatInputBox({
  inputValue,
  onInputChange,
  placeholder,
  inputRef,
  selectedMCPServers,
  selectedApps,
  onRemoveSkill,
  onRemoveApp,
  isSkillPanelOpen,
  onSkillPanelToggle,
  skillPanelRef,
  skillPanelContent,
  models,
  selectedModelId,
  onModelSelect,
  modelsLoading,
  isModelLocked,
  onSend,
  onStop,
  isStreaming = false,
  scopeLocked = isStreaming,
  variant = 'welcome',
}: ChatInputBoxProps) {
  const { t } = useTranslation()
  return (
    <ChatComposer
      ref={inputRef}
      value={inputValue}
      onChange={onInputChange}
      onSubmit={onSend}
      placeholder={placeholder ?? t('home.input.welcomePlaceholder')}
      state={
        isStreaming && onStop
          ? { kind: 'running', stop: onStop }
          : scopeLocked
            ? { kind: 'blocked', reason: t('chat.composer.preparing') }
            : { kind: 'ready' }
      }
      labels={{ stop: t('home.input.stop') }}
      slots={{
        context:
          selectedMCPServers.length || selectedApps.length ? (
            <SelectedTags
              selectedMCPServers={selectedMCPServers}
              selectedApps={selectedApps}
              onRemoveSkill={onRemoveSkill}
              onRemoveApp={onRemoveApp}
              disabled={scopeLocked}
            />
          ) : undefined,
        leading: (
          <>
            <InputToolbar
              isSkillPanelOpen={isSkillPanelOpen}
              hasSelectedItems={
                selectedMCPServers.length > 0 || selectedApps.length > 0
              }
              disabled={scopeLocked}
              onAtClick={onSkillPanelToggle}
              atButtonRef={skillPanelRef}
              size="compact"
            />
            {skillPanelContent}
          </>
        ),
        configuration: (
          <ChatModelSelector
            models={models || {}}
            selectedModelName={selectedModelId}
            onSelect={(name) => onModelSelect(name || '')}
            loading={modelsLoading}
            variant="minimal"
            dropdownDirection={variant === 'welcome' ? 'down' : 'up'}
            disabled={scopeLocked || isModelLocked}
          />
        ),
      }}
    />
  )
}
