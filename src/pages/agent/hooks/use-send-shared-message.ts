import { useSearchParams } from 'react-router-dom'
import { useFetchExternalAgentInputs } from '@/hooks/use-agent-request'
import { AgentDialogueMode } from '../constant'
import {
  buildShareInputsPayload,
  type ShareFormValues,
} from '../share/utils'
import { parseAgentShareAccess } from '../share/access'
import { useSharedAgentRunner } from '../share/use-shared-agent-runner'

export const useSendButtonDisabled = (value: string) => {
  return value.trim() === ''
}

export const useGetSharedChatSearchParams = () => {
  const [searchParams] = useSearchParams()
  const access = parseAgentShareAccess(searchParams)

  return {
    from: access.from,
    sharedId: access.agentId || undefined,
    agentId: access.agentId || undefined,
    betaToken: access.betaToken || undefined,
    release: access.release ? 'true' : undefined,
    locale: access.locale,
    theme: access.theme,
    data: access.data,
    visibleAvatar: access.visibleAvatar,
    userId: access.userId,
  }
}

export const useSendNextSharedMessage = () => {
  const { agentId, betaToken, release, userId } =
    useGetSharedChatSearchParams()
  const { data: inputsData, ...inputsQuery } = useFetchExternalAgentInputs(
    agentId,
    betaToken,
  )

  const runner = useSharedAgentRunner({
    agentId: agentId || '',
    betaToken: betaToken || '',
    release: release === 'true',
    userId,
    buildInputs: (values: ShareFormValues) =>
      buildShareInputsPayload(inputsData.inputs || {}, values),
  })

  return {
    ...runner,
    inputsData: inputsData || {},
    inputsQuery,
    isTaskMode: inputsData?.mode === AgentDialogueMode.Task,
    hasError: Boolean(runner.lastError || inputsQuery.isError),
  }
}
