import { useCallback, useMemo, useState } from 'react'
import type { IMessage } from '../utils/chat'

export interface INodeEvent {
  event: string
  data: INodeData
}

export interface INodeData {
  component_id?: string
  component_type?: string
  component_name?: string
  elapsed_time?: number
  error?: string
  inputs?: Record<string, unknown>
  outputs?: Record<string, unknown>
  thoughts?: string
  [key: string]: unknown
}

export const NodeMessageEventType = {
  NodeStarted: 'node_started',
  NodeFinished: 'node_finished',
} as const

export const useNodeLoading = ({
  currentEventListWithoutMessageById,
  currentMessageId,
}: {
  currentEventListWithoutMessageById: (messageId: string) => INodeEvent[]
  currentMessageId?: string
}) => {
  const [derivedMessages, setDerivedMessages] = useState<IMessage[]>()

  const lastMessageId = useMemo(() => {
    return currentMessageId || derivedMessages?.[derivedMessages.length - 1]?.id
  }, [currentMessageId, derivedMessages])

  const currentEventListWithoutMessage = useMemo(() => {
    if (!lastMessageId) {
      return []
    }
    return currentEventListWithoutMessageById(lastMessageId)
  }, [currentEventListWithoutMessageById, lastMessageId])

  const startedNodeList = useMemo(() => {
    const duplicateList = currentEventListWithoutMessage?.filter(
      (x) => x.event === NodeMessageEventType.NodeStarted,
    ) as INodeEvent[]

    // Remove duplicate nodes
    return duplicateList?.reduce<Array<INodeEvent>>((pre, cur) => {
      if (pre.every((x) => x.data.component_id !== cur.data.component_id)) {
        pre.push(cur)
      }
      return pre
    }, [])
  }, [currentEventListWithoutMessage])

  const filterFinishedNodeList = useCallback(() => {
    const nodeEventList = currentEventListWithoutMessage
      .filter((x) => x.event === NodeMessageEventType.NodeFinished)
      .map((x) => x.data)

    return nodeEventList
  }, [currentEventListWithoutMessage])

  const lastNode = useMemo(() => {
    if (!startedNodeList) {
      return null
    }
    return startedNodeList[startedNodeList.length - 1]
  }, [startedNodeList])

  const startNodeIds = useMemo(() => {
    if (!startedNodeList) {
      return []
    }
    return startedNodeList
      .map((x) => x.data.component_id)
      .filter((componentId): componentId is string => Boolean(componentId))
  }, [startedNodeList])

  const finishedNodeDataList = useMemo(() => {
    return filterFinishedNodeList()
  }, [filterFinishedNodeList])

  const finishNodeIds = useMemo(() => {
    const ids = finishedNodeDataList
      .map((x: INodeData) => x.component_id)
      .filter((componentId): componentId is string => Boolean(componentId))
    return Array.from(new Set(ids))
  }, [finishedNodeDataList])

  const errorNodeIds = useMemo(() => {
    const ids = finishedNodeDataList
      .filter((x) => Boolean(x?.error))
      .map((x: INodeData) => x.component_id)
      .filter((componentId): componentId is string => Boolean(componentId))
    return Array.from(new Set(ids))
  }, [finishedNodeDataList])

  const successNodeIds = useMemo(() => {
    const errorSet = new Set(errorNodeIds)
    return finishNodeIds.filter((id) => !errorSet.has(id))
  }, [errorNodeIds, finishNodeIds])

  const nodeElapsedMap = useMemo(() => {
    return finishedNodeDataList.reduce<Record<string, number>>((acc, item) => {
      const id = item?.component_id
      const elapsed = item?.elapsed_time
      if (typeof id === 'string' && typeof elapsed === 'number') {
        acc[id] = elapsed
      }
      return acc
    }, {})
  }, [finishedNodeDataList])

  const startButNotFinishedNodeIds = useMemo(() => {
    return startNodeIds.filter((x) => !finishNodeIds.includes(x))
  }, [finishNodeIds, startNodeIds])

  return {
    lastNode,
    startButNotFinishedNodeIds,
    finishNodeIds,
    successNodeIds,
    errorNodeIds,
    nodeElapsedMap,
    filterFinishedNodeList,
    setDerivedMessages,
  }
}
