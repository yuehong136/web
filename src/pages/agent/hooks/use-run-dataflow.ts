import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { agentAPI } from '@/api/agent'
import { useSaveGraph } from './use-save-graph'
import type { UseFetchLogReturnType } from './use-fetch-pipeline-log'

export function useRunDataflow({
  showLogSheet,
  setMessageId,
  title,
}: {
  showLogSheet: () => void
  title?: string
} & Pick<UseFetchLogReturnType, 'setMessageId'>) {
  const { id } = useParams<{ id: string }>()
  const { saveGraph, loading } = useSaveGraph(id, false)
  const [uploadedFileData, setUploadedFileData] = useState<Record<string, any>>()

  const run = useCallback(
    async (fileResponseData: Record<string, any>, nextTitle?: string) => {
      if (!id) return undefined

      const finalTitle = (nextTitle ?? title ?? '').trim() || 'Untitled'
      const saveRet = await saveGraph(finalTitle)
      if (!saveRet) return undefined

      showLogSheet()
      const file = fileResponseData?.file ?? fileResponseData
      setUploadedFileData(file)

      const res = await agentAPI.runAgent({
        id,
        query: '',
        session_id: null,
        files: [file],
      })

      if (res?.ok) {
        try {
          const data = await res.clone().json()
          const msgId = data?.data?.message_id
          if (msgId) {
            setMessageId(msgId)
          }
        } catch {
          // ignore parse errors for SSE streams
        }
      }

      return res
    },
    [id, saveGraph, setMessageId, showLogSheet, title],
  )

  return { run, loading, uploadedFileData }
}

export type RunDataflowType = ReturnType<typeof useRunDataflow>
