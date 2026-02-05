import { useQuery } from '@tanstack/react-query'
import { get, isEmpty } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { agentAPI } from '@/api/agent'
import type { ITraceData } from '../types'

export function useFetchPipelineLog(logSheetVisible: boolean) {
  const { id } = useParams<{ id: string }>()
  const [messageId, setMessageId] = useState<string>('')
  const [isStopFetchTrace, setISStopFetchTrace] = useState<boolean>(false)

  const { data, isFetching } = useQuery<ITraceData[]>({
    queryKey: ['pipeline-trace', id, messageId],
    enabled: !!id && !!messageId && !isStopFetchTrace,
    queryFn: async () => {
      if (!id || !messageId) return []
      return agentAPI.fetchTrace(id, messageId)
    },
    refetchInterval: isStopFetchTrace ? false : 2000,
    gcTime: 0,
    initialData: [],
  })

  const isCompleted = useMemo(() => {
    if (Array.isArray(data)) {
      const latest = data.at(-1)
      return latest?.component_id === 'END' && !isEmpty(get(latest, 'trace'))
    }
    return false
  }, [data])

  const isLogEmpty = !data || data.length === 0

  const stopFetchTrace = useCallback(() => {
    setISStopFetchTrace(true)
  }, [])

  useEffect(() => {
    if (isCompleted) {
      stopFetchTrace()
    }
  }, [isCompleted, stopFetchTrace])

  useEffect(() => {
    if (logSheetVisible) {
      setISStopFetchTrace(false)
    }
  }, [logSheetVisible])

  return {
    logs: data,
    isLogEmpty,
    isCompleted,
    loading: isFetching,
    isParsing: !isLogEmpty && !isCompleted && !isStopFetchTrace,
    messageId,
    setMessageId,
    stopFetchTrace,
    setISStopFetchTrace,
    isStopFetchTrace,
  }
}

export type UseFetchLogReturnType = ReturnType<typeof useFetchPipelineLog>
