import { get } from 'lodash'
import { useCallback, useMemo } from 'react'
import type { BeginQuery } from '../types'
import type { IMessage } from '../utils/chat'
import { MessageType } from '../utils/chat'
import { buildBeginQueryWithObject } from '../utils'

type AwaitComponentData = {
  derivedMessages: IMessage[]
  sendFormMessage: (params: { inputs: Record<string, BeginQuery>; id: string }) => void
  canvasId: string
}

export const useAwaitCompentData = (props: AwaitComponentData) => {
  const { derivedMessages, sendFormMessage, canvasId } = props

  const getInputs = useCallback((message: any) => {
    return get(message, 'data.inputs', {}) as Record<string, BeginQuery>
  }, [])

  const buildInputList = useCallback(
    (message: any) => {
      return Object.entries(getInputs(message)).map(([key, val]) => ({
        ...val,
        key,
      }))
    },
    [getInputs],
  )

  const handleOk = useCallback(
    (message: any) => (values: BeginQuery[]) => {
      const inputs = getInputs(message)
      const nextInputs = buildBeginQueryWithObject(inputs, values)
      sendFormMessage({
        inputs: nextInputs,
        id: canvasId,
      })
    },
    [getInputs, sendFormMessage, canvasId],
  )

  const isWaitting = useMemo(() => {
    return derivedMessages?.some((message, i) => {
      return (
        message.role === MessageType.Assistant &&
        derivedMessages.length - 1 === i &&
        (message as any).data
      )
    })
  }, [derivedMessages])

  return { getInputs, buildInputList, handleOk, isWaitting }
}
