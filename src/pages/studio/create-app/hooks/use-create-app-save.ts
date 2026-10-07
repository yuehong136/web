import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { useTranslation } from 'react-i18next'
import { dialogAPI } from '@/api/dialog'
import { toast } from '@/lib/toast'
import { withAppKnowledgeRetrieval } from '../knowledge-prompt'
import { buildChatSaveRequest } from '../save-payload'
import type { AppConfig } from '../types'

interface UseCreateAppSaveParams {
  config: AppConfig
  setConfig: Dispatch<SetStateAction<AppConfig>>
  currentDialogId: string | null
  setCurrentDialogId: (dialogId: string) => void
}

/**
 * Owns the dialog save flow (validation + request assembly + create/update).
 * Extracted from useCreateAppPage to keep that composition hook under the
 * file-size ratchet; the returned shape stays part of useCreateAppPage's API.
 */
export const useCreateAppSave = ({
  config,
  setConfig,
  currentDialogId,
  setCurrentDialogId,
}: UseCreateAppSaveParams) => {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    try {
      setSaving(true)

      if (!config.name.trim()) {
        toast.error('应用名称不能为空')
        return
      }

      if (!config.llm_id) {
        toast.error('请选择模型')
        return
      }

      const knowledgeBlock = t('chat.knowledgePrompt.block')
      const addsKnowledge =
        withAppKnowledgeRetrieval(config, knowledgeBlock) !== config
      const requestData = buildChatSaveRequest(config, knowledgeBlock)

      const result = currentDialogId
        ? await dialogAPI.updateChat(currentDialogId, requestData)
        : await dialogAPI.createChat(requestData)
      toast.success('保存成功')

      if (addsKnowledge) {
        // Show what was saved; re-check the latest editor state in case it changed meanwhile.
        setConfig((previousConfig) =>
          withAppKnowledgeRetrieval(previousConfig, knowledgeBlock),
        )
        toast.info(t('chat.knowledgePrompt.insertedOnSave'))
      }

      if (!currentDialogId && result?.id) {
        setCurrentDialogId(result.id)
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('dialog_id', result.id)
        window.history.replaceState({}, '', newUrl.toString())
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      toast.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }, [config, currentDialogId, setConfig, setCurrentDialogId, t])

  return { saving, handleSave }
}
