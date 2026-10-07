import {
  useCallback,
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { dialogAPI } from '@/api/dialog'
import { dialogKeys } from '@/hooks/use-dialog-apps'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import { normalizeDialogConfig } from '../data'
import {
  configSignature,
  type ConfirmedSave,
  type SaveStatus,
} from '../editor-state'
import { buildChatSaveRequest } from '../save-payload'
import type { AppConfig } from '../types'

interface SaveOptions {
  getConfig: () => AppConfig
  setConfig: Dispatch<SetStateAction<AppConfig>>
  currentDialogId: string | null
  setCurrentDialogId: (id: string) => void
  setSavedConfig: (config: AppConfig, id: string) => void
}

export function useCreateAppSave({
  getConfig,
  setConfig,
  currentDialogId,
  setCurrentDialogId,
  setSavedConfig,
}: SaveOptions) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('unsaved')
  const pending = useRef<Promise<ConfirmedSave | null> | null>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const idRef = useRef(currentDialogId)
  useLayoutEffect(() => {
    idRef.current = currentDialogId
  }, [currentDialogId])
  const mutation = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (submitted: AppConfig): Promise<ConfirmedSave> => {
      const submittedId = idRef.current
      const block = t('chat.knowledgePrompt.block')
      const request = buildChatSaveRequest(submitted, block)
      const result = idRef.current
        ? await dialogAPI.updateChat(idRef.current, request)
        : await dialogAPI.createChat(request)
      const id = idRef.current ?? result?.id
      if (!mounted.current || idRef.current !== submittedId)
        throw new Error('save-context-changed')
      if (!id) throw new Error('missing-id')
      // Bind the ID before readback; retries must not create a second application.
      idRef.current = id
      setCurrentDialogId(id)
      try {
        const detail = await dialogAPI.getDetail(id)
        if (!mounted.current || idRef.current !== id)
          throw new Error('save-context-changed')
        const { config } = normalizeDialogConfig(detail)
        const signature = configSignature(config, block)
        if (signature !== configSignature(submitted, block))
          throw new Error('readback-mismatch')
        client.setQueryData(dialogKeys.detail(id), detail)
        setSavedConfig(config, id)
        // Never overwrite changes made while the request was in flight.
        if (
          configSignature(getConfig(), block) ===
          configSignature(submitted, block)
        )
          setConfig(config)
        void client.invalidateQueries({ queryKey: dialogKeys.lists() })
        setSaveStatus('saved')
        return { id, config, signature }
      } catch (error) {
        if (error instanceof Error && error.message === 'save-context-changed')
          throw error
        setSaveStatus('unconfirmed')
        throw new Error('readback-unconfirmed', { cause: error })
      }
    },
  })

  const handleSave = useCallback((): Promise<ConfirmedSave | null> => {
    if (pending.current) return pending.current
    const submitted = structuredClone(getConfig())
    if (!submitted.name.trim() || !submitted.llm_id) {
      toast.error(
        t(
          `studio.editor.${!submitted.name.trim() ? 'nameRequired' : 'modelRequired'}`,
        ),
      )
      return Promise.resolve(null)
    }
    setSaveStatus('saving')
    const task = mutation
      .mutateAsync(submitted)
      .then((result) => {
        toast.success(t('studio.editor.saved'))
        return result
      })
      .catch((error: unknown) => {
        if (
          !mounted.current ||
          (error instanceof Error && error.message === 'save-context-changed')
        )
          return null
        const unconfirmed =
          error instanceof Error && error.message === 'readback-unconfirmed'
        if (!unconfirmed) setSaveStatus('failed')
        toast.error(
          t(`studio.editor.${unconfirmed ? 'unconfirmed' : 'saveFailed'}`),
        )
        return null
      })
      .finally(() => {
        pending.current = null
      })
    pending.current = task
    return task
  }, [getConfig, mutation, t])

  return { saving: mutation.isPending, saveStatus, handleSave }
}
