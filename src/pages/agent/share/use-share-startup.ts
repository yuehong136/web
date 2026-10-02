import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AgentShareSummary } from '@/types/agent'
import type { AgentShareAccess } from './access'
import { buildInitialShareValues, type ShareFormValues } from './utils'
import type { useSharedAgentRunner } from './use-shared-agent-runner'

export function useShareStartup({
  access,
  inputs,
  inputCount,
  title,
  isTaskMode,
  isWebhookMode = false,
  runner,
  startTaskMessage,
}: {
  access: AgentShareAccess
  inputs: AgentShareSummary['inputs'] | undefined
  inputCount: number
  title?: string
  isTaskMode: boolean
  isWebhookMode?: boolean
  runner: Pick<ReturnType<typeof useSharedAgentRunner>, 'isRunning' | 'submit'>
  startTaskMessage: string
}) {
  const { agentId, betaToken, userId, data } = access
  const [formValues, setFormValues] = useState<ShareFormValues>(() =>
    buildInitialShareValues(inputs, data),
  )
  const [formError, setFormError] = useState<string>()
  const [parameterDialogOpen, setParameterDialogOpen] = useState(false)
  const [beginReady, setBeginReady] = useState(inputCount === 0)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [promptedBeginInputs, setPromptedBeginInputs] = useState(false)
  const [startupRevision, setStartupRevision] = useState(0)
  const automaticTaskScope = useRef<object | null>(null)
  const [previousInputs, setPreviousInputs] = useState({ inputs, data })
  if (previousInputs.inputs !== inputs || previousInputs.data !== data) {
    setPreviousInputs({ inputs, data })
    setFormValues(buildInitialShareValues(inputs, data))
  }
  const startupScope = useMemo(
    () => ({
      agentId,
      betaToken,
      userId,
      inputCount,
      isTaskMode,
      isWebhookMode,
    }),
    [agentId, betaToken, userId, inputCount, isTaskMode, isWebhookMode],
  )
  const [previousScope, setPreviousScope] = useState(startupScope)
  if (previousScope !== startupScope) {
    setPreviousScope(startupScope)
    setBeginReady(inputCount === 0)
    setPromptedBeginInputs(false)
    setPendingMessage(null)
    setFormError(undefined)
    setParameterDialogOpen(false)
  }
  if (
    title &&
    !promptedBeginInputs &&
    !runner.isRunning &&
    inputCount > 0 &&
    !isWebhookMode
  ) {
    setParameterDialogOpen(true)
    setPromptedBeginInputs(true)
  }
  const markAutomaticTaskStarted = useCallback(() => {
    automaticTaskScope.current = startupScope
  }, [startupScope])
  const resetAutomaticTask = useCallback(() => {
    automaticTaskScope.current = null
    setPromptedBeginInputs(false)
    setStartupRevision((value) => value + 1)
  }, [])
  useEffect(() => {
    if (
      !title ||
      runner.isRunning ||
      inputCount > 0 ||
      !isTaskMode ||
      isWebhookMode
    )
      return
    if (automaticTaskScope.current === startupScope) return
    automaticTaskScope.current = startupScope
    void runner.submit({
      query: '',
      values: formValues,
      files: [],
      userMessage: startTaskMessage,
    })
  }, [
    formValues,
    inputCount,
    isTaskMode,
    isWebhookMode,
    runner,
    title,
    startupScope,
    startupRevision,
    startTaskMessage,
  ])
  return {
    formValues,
    setFormValues,
    formError,
    setFormError,
    parameterDialogOpen,
    setParameterDialogOpen,
    beginReady,
    setBeginReady,
    pendingMessage,
    setPendingMessage,
    markAutomaticTaskStarted,
    resetAutomaticTask,
  }
}
