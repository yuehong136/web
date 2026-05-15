import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useUIStore } from '@/stores/ui'
import type { CreateKBRequest } from '@/types/api'
import { DEFAULT_CREATE_FORM_VALUES } from './constants'
import { getCreateKnowledgeErrorMessage, validateKnowledgeName } from './utils'
import type { CreateKnowledgeFormValues } from './types'

interface UseCreateKnowledgeOptions {
  onCreated?: (knowledgeBaseId: string) => void
}

export const useCreateKnowledge = ({
  onCreated,
}: UseCreateKnowledgeOptions) => {
  const { t } = useTranslation()
  const { createKnowledgeBase } = useKnowledgeStore()
  const { addNotification } = useUIStore()

  const [formData, setFormData] = useState<CreateKnowledgeFormValues>(
    DEFAULT_CREATE_FORM_VALUES,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_CREATE_FORM_VALUES)
    setNameError(null)
  }, [])

  const handleNameChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, name: value }))
      setNameError(value ? validateKnowledgeName(value, t) : null)
    },
    [t],
  )

  const updateField = useCallback(
    <Key extends keyof CreateKnowledgeFormValues>(
      key: Key,
      value: CreateKnowledgeFormValues[Key],
    ) => {
      setFormData((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const handleModelSelect = useCallback(
    (modelId: string | null) => {
      updateField('embd_id', modelId || '')
    },
    [updateField],
  )

  const submit = useCallback(async () => {
    const name = formData.name.trim()
    const error = validateKnowledgeName(name, t)

    if (error) {
      setNameError(error)
      addNotification({
        type: 'error',
        title: t('knowledge.create.validation.title'),
        message: error,
      })
      return
    }

    if (!formData.embd_id) {
      addNotification({
        type: 'error',
        title: t('knowledge.create.validation.title'),
        message: t('knowledge.create.validation.embeddingRequired'),
      })
      return
    }

    try {
      setIsLoading(true)

      const createData: CreateKBRequest = {
        name,
        description: formData.description.trim() || undefined,
        language: formData.language,
        permission: formData.permission,
        embd_id: formData.embd_id,
        parser_id: 'naive',
      }

      const newKnowledgeBase = await createKnowledgeBase(createData)

      addNotification({
        type: 'success',
        title: t('knowledge.create.success.title'),
        message: t('knowledge.create.success.message'),
      })

      resetForm()
      onCreated?.(newKnowledgeBase.id)
    } catch (error) {
      console.error('Create knowledge base failed:', error)
      addNotification({
        type: 'error',
        title: t('knowledge.create.errors.title'),
        message: getCreateKnowledgeErrorMessage(error, t),
      })
    } finally {
      setIsLoading(false)
    }
  }, [addNotification, createKnowledgeBase, formData, onCreated, resetForm, t])

  const canSubmit = Boolean(
    formData.name.trim() && formData.embd_id && !nameError,
  )

  return {
    canSubmit,
    formData,
    handleModelSelect,
    handleNameChange,
    isLoading,
    nameError,
    resetForm,
    submit,
    t,
    updateField,
  }
}
