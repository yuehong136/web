import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdateKnowledge } from '@/hooks/use-knowledge-request'
import { useUIStore } from '@/stores/ui'
import type { KnowledgeBase, UpdateKBRequest } from '@/types/api'
import type { QuickEditValues } from './types'

const getBackendMessage = (error: unknown) => {
  const backendMessage = (
    error as { response?: { data?: { retmsg?: unknown } } }
  ).response?.data?.retmsg

  return typeof backendMessage === 'string' ? backendMessage : null
}

export const useQuickEdit = ({
  editingKnowledgeBase,
  onUpdated,
}: {
  editingKnowledgeBase: KnowledgeBase | null
  onUpdated: () => void
}) => {
  const { t } = useTranslation()
  const { updateKnowledge } = useUpdateKnowledge()
  const { addNotification } = useUIStore()
  const [isQuickEditSubmitting, setIsQuickEditSubmitting] = useState(false)

  const getQuickEditErrorMessage = useCallback(
    (error: unknown) => {
      const backendMessage = getBackendMessage(error)

      if (!backendMessage) {
        return t('knowledge.list.quickEdit.errors.generic')
      }

      if (backendMessage.includes('Dataset name must be string')) {
        return t('knowledge.list.quickEdit.errors.nameType')
      }

      if (backendMessage.includes("Dataset name can't be empty")) {
        return t('knowledge.list.quickEdit.validation.nameRequired')
      }

      if (backendMessage.includes('Dataset name length is')) {
        return t('knowledge.list.quickEdit.validation.nameMaxLength', {
          count: 100,
        })
      }

      if (
        backendMessage.includes(
          'Dataset name must start with a letter and contain only letters, numbers, and underscores',
        )
      ) {
        return t('knowledge.list.quickEdit.validation.namePattern')
      }

      if (
        backendMessage.includes(
          '\u5df2\u5b58\u5728\u8be5\u77e5\u8bc6\u5e93\u540d',
        )
      ) {
        return t('knowledge.list.quickEdit.errors.duplicateName')
      }

      if (backendMessage.includes('Tenant not found')) {
        return t('knowledge.list.quickEdit.errors.tenantNotFound')
      }

      return backendMessage
    },
    [t],
  )

  const handleQuickEditSubmit = useCallback(
    async (values: QuickEditValues) => {
      if (!editingKnowledgeBase) return

      const name = values.name.trim()
      const namePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/

      if (!name) {
        addNotification({
          type: 'error',
          title: t('knowledge.list.quickEdit.validation.title'),
          message: t('knowledge.list.quickEdit.validation.nameRequired'),
        })
        return
      }

      if (!namePattern.test(name)) {
        addNotification({
          type: 'error',
          title: t('knowledge.list.quickEdit.validation.title'),
          message: t('knowledge.list.quickEdit.validation.namePattern'),
        })
        return
      }

      if (name.length > 100) {
        addNotification({
          type: 'error',
          title: t('knowledge.list.quickEdit.validation.title'),
          message: t('knowledge.list.quickEdit.validation.nameMaxLength', {
            count: 100,
          }),
        })
        return
      }

      const updateData: UpdateKBRequest = {
        kb_id: editingKnowledgeBase.id,
        name,
        description: values.description,
      }

      try {
        setIsQuickEditSubmitting(true)
        await updateKnowledge(updateData)
        addNotification({
          type: 'success',
          title: t('knowledge.list.quickEdit.success.title'),
          message: t('knowledge.list.quickEdit.success.message'),
        })
        onUpdated()
      } catch (error) {
        addNotification({
          type: 'error',
          title: t('knowledge.list.quickEdit.errors.title'),
          message: getQuickEditErrorMessage(error),
        })
      } finally {
        setIsQuickEditSubmitting(false)
      }
    },
    [
      addNotification,
      editingKnowledgeBase,
      getQuickEditErrorMessage,
      onUpdated,
      t,
      updateKnowledge,
    ],
  )

  return {
    handleQuickEditSubmit,
    isQuickEditSubmitting,
  }
}
