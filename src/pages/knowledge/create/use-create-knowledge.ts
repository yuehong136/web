import { toast } from '@/lib/toast'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDefaultModelRequest } from '@/hooks/use-default-model-request'
import { useCreateKnowledge as useCreateKnowledgeRequest } from '@/hooks/use-knowledge-request'
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
  const { createKnowledge } = useCreateKnowledgeRequest()

  const { tenantInfo } = useDefaultModelRequest()
  const [modelTouched, setModelTouched] = useState(false)
  const [tenantId, setTenantId] = useState(tenantInfo?.tenant_id)
  const [draft, setFormData] = useState<CreateKnowledgeFormValues>(
    DEFAULT_CREATE_FORM_VALUES,
  )
  const [nameError, setNameError] = useState<string | null>(null)
  if (tenantInfo?.tenant_id && tenantInfo.tenant_id !== tenantId) {
    setTenantId(tenantInfo.tenant_id)
    if (tenantId) {
      setFormData(DEFAULT_CREATE_FORM_VALUES)
      setModelTouched(false)
      setNameError(null)
    }
  }
  const formData = useMemo(
    () => ({
      ...draft,
      embd_id:
        draft.embd_id || (!modelTouched ? (tenantInfo?.embd_id ?? '') : ''),
    }),
    [draft, modelTouched, tenantInfo?.embd_id],
  )
  const [isLoading, setIsLoading] = useState(false)

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_CREATE_FORM_VALUES)
    setModelTouched(false)
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
      if (key === 'embd_id') setModelTouched(true)
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
      toast.error(t('knowledge.create.validation.title'), {
        description: error,
      })
      return
    }

    if (!formData.embd_id) {
      toast.error(t('knowledge.create.validation.title'), {
        description: t('knowledge.create.validation.embeddingRequired'),
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

      const result = await createKnowledge(createData)

      toast.success(t('knowledge.create.success.title'), {
        description: t('knowledge.create.success.message'),
      })

      resetForm()
      onCreated?.(result.kb_id)
    } catch (error) {
      toast.error(t('knowledge.create.errors.title'), {
        description: getCreateKnowledgeErrorMessage(error, t),
      })
    } finally {
      setIsLoading(false)
    }
  }, [createKnowledge, formData, onCreated, resetForm, t])

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
