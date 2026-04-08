import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFetchExternalAgentInputs } from '@/hooks/use-agent-request'
import { AgentDialogueMode } from '../constant'

export const useSendButtonDisabled = (value: string) => {
  return value.trim() === ''
}

export const useGetSharedChatSearchParams = () => {
  const [searchParams] = useSearchParams()
  const dataPrefix = 'data_'
  const data = Object.fromEntries(
    Array.from(searchParams.entries())
      .filter(([key]) => key.startsWith(dataPrefix))
      .map(([key, value]) => [key.replace(dataPrefix, ''), value]),
  )

  return {
    from: searchParams.get('from') || '',
    sharedId: searchParams.get('shared_id') || undefined,
    agentId: searchParams.get('id') || searchParams.get('agent_id') || undefined,
    betaToken:
      searchParams.get('beta') ||
      searchParams.get('token') ||
      searchParams.get('shared_id') ||
      undefined,
    locale: searchParams.get('locale') || undefined,
    theme: searchParams.get('theme') || undefined,
    data,
    visibleAvatar: searchParams.get('visible_avatar')
      ? searchParams.get('visible_avatar') !== '1'
      : true,
  }
}

export const useSendNextSharedMessage = () => {
  const { agentId, betaToken } = useGetSharedChatSearchParams()
  const { data: inputsData } = useFetchExternalAgentInputs(agentId, betaToken)
  const [value, setValue] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const messageContainerRef = useRef<HTMLDivElement | null>(null)
  const [derivedMessages] = useState<unknown[]>([])
  const [parameterDialogVisible, setParameterDialogVisible] = useState(false)

  const isTaskMode = inputsData?.mode === AgentDialogueMode.Task

  const handleInputChange = (next: string) => {
    setValue(next)
  }

  const handlePressEnter = async () => {
    setSendLoading(true)
    setSendLoading(false)
  }

  const showParameterDialog = () => setParameterDialogVisible(true)
  const hideParameterDialog = () => setParameterDialogVisible(false)

  return {
    handlePressEnter,
    handleInputChange,
    value,
    sendLoading,
    scrollRef,
    messageContainerRef,
    derivedMessages,
    hasError: false,
    inputsData: inputsData || {},
    isTaskMode,
    stopOutputMessage: () => undefined,
    findReferenceByMessageId: () => undefined,
    appendUploadResponseList: () => undefined,
    parameterDialogVisible,
    showParameterDialog,
    hideParameterDialog,
    sendFormMessage: () => undefined,
    addNewestOneAnswer: () => undefined,
    ok: () => undefined,
    resetSession: () => {
      setValue('')
    },
  }
}
