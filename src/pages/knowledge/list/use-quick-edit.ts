import { toast } from '@/lib/toast'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdateKnowledge } from '@/hooks/use-knowledge-request'
import type { KnowledgeBase, UpdateKBRequest } from '@/types/api'
import type { QuickEditValues } from './types'
import { validateKnowledgeName } from '@/lib/knowledge/name'

export const useQuickEdit = ({
  editingKnowledgeBase,
  onUpdated,
}: {
  editingKnowledgeBase: KnowledgeBase | null
  onUpdated: () => void
}) => {
  const { t } = useTranslation()
  const { updateKnowledge } = useUpdateKnowledge()
  const [isQuickEditSubmitting, setIsQuickEditSubmitting] = useState(false)

  const handleQuickEditSubmit = useCallback(
    async (values: QuickEditValues) => {
      if (!editingKnowledgeBase) return

      const name = values.name.trim()
      const nameError = validateKnowledgeName(name, t)
      if (nameError) {
        toast.error(t('knowledge.list.quickEdit.validation.title'), {
          description: nameError,
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
        toast.success(t('knowledge.list.quickEdit.success.title'), {
          description: t('knowledge.list.quickEdit.success.message'),
        })
        onUpdated()
      } catch {
        toast.error(t('knowledge.list.quickEdit.errors.title'), {
          description: t('knowledge.list.quickEdit.errors.generic'),
        })
      } finally {
        setIsQuickEditSubmitting(false)
      }
    },
    [editingKnowledgeBase, onUpdated, t, updateKnowledge],
  )

  return {
    handleQuickEditSubmit,
    isQuickEditSubmitting,
  }
}
