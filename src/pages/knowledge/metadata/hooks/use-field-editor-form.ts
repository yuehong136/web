import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MetadataTableData } from '@/types/api'

interface FieldEditorInitialData {
  field: string
  description?: string
  restrictDefinedValues?: boolean
  values: string[]
}

interface UseFieldEditorFormOptions {
  open: boolean
  initialData?: FieldEditorInitialData
  existingKeys: string[]
  onSave: (data: MetadataTableData) => void
  onClose: () => void
}

interface FieldEditorErrors {
  field?: string
  values?: string
}

export interface UseFieldEditorFormReturn {
  formData: MetadataTableData
  tempValues: string[]
  errors: FieldEditorErrors
  hasErrors: boolean
  handlers: {
    fieldChange: (value: string) => void
    descriptionChange: (value: string) => void
    restrictChange: (checked: boolean) => void
    valueChange: (index: number, value: string) => void
    valueBlur: (index: number) => void
    addValue: () => void
    deleteValue: (index: number) => void
    save: () => void
    close: () => void
  }
}

const EMPTY_FORM: MetadataTableData = {
  field: '',
  description: '',
  values: [],
  restrictDefinedValues: false,
}

const FIELD_NAME_REGEX = /^[a-zA-Z_]*$/

export function useFieldEditorForm(
  options: UseFieldEditorFormOptions,
): UseFieldEditorFormReturn {
  const { open, initialData, existingKeys, onSave, onClose } = options
  const { t } = useTranslation()

  const [formData, setFormData] = useState<MetadataTableData>(EMPTY_FORM)
  const [tempValues, setTempValues] = useState<string[]>([])
  const [errors, setErrors] = useState<FieldEditorErrors>({})

  useEffect(() => {
    if (!open) return
    if (initialData) {
      setFormData({
        field: initialData.field,
        description: initialData.description || '',
        values: initialData.values,
        restrictDefinedValues: initialData.restrictDefinedValues || false,
      })
      setTempValues([...initialData.values])
    } else {
      setFormData(EMPTY_FORM)
      setTempValues([])
    }
    setErrors({})
  }, [open, initialData])

  const fieldChange = useCallback(
    (value: string) => {
      if (!FIELD_NAME_REGEX.test(value)) return
      setFormData((prev) => ({ ...prev, field: value }))
      if (existingKeys.includes(value)) {
        setErrors((prev) => ({
          ...prev,
          field: t('knowledge.metadata.editor.duplicateField'),
        }))
      } else {
        setErrors((prev) => ({ ...prev, field: undefined }))
      }
    },
    [existingKeys, t],
  )

  const descriptionChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, description: value }))
  }, [])

  const restrictChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({ ...prev, restrictDefinedValues: checked }))
  }, [])

  const valueChange = useCallback(
    (index: number, value: string) => {
      setTempValues((prev) => {
        const otherValues = prev.filter((_, i) => i !== index)
        if (value && otherValues.includes(value)) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            values: t('knowledge.metadata.editor.duplicateValue'),
          }))
        } else {
          setErrors((prevErrors) => ({ ...prevErrors, values: undefined }))
        }
        const next = [...prev]
        next[index] = value
        return next
      })
    },
    [t],
  )

  const valueBlur = useCallback(() => {
    setTempValues((prev) => {
      const uniqueValues = [...new Set(prev.filter((v) => v.trim()))]
      setFormData((prevForm) => ({ ...prevForm, values: uniqueValues }))
      return uniqueValues
    })
  }, [])

  const addValue = useCallback(() => {
    setTempValues((prev) => [...prev, ''])
  }, [])

  const deleteValue = useCallback((index: number) => {
    setTempValues((prev) => {
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
    setFormData((prev) => {
      const next = [...prev.values]
      if (index < next.length) {
        next.splice(index, 1)
      }
      return { ...prev, values: next }
    })
  }, [])

  const save = useCallback(() => {
    if (!formData.field.trim()) {
      setErrors((prev) => ({
        ...prev,
        field: t('knowledge.metadata.editor.requiredField'),
      }))
      return
    }
    if (errors.field || errors.values) return

    const finalValues = [...new Set(tempValues.filter((v) => v.trim()))]
    onSave({ ...formData, values: finalValues })
  }, [errors.field, errors.values, formData, onSave, t, tempValues])

  const close = useCallback(() => {
    setFormData(EMPTY_FORM)
    setTempValues([])
    setErrors({})
    onClose()
  }, [onClose])

  return {
    formData,
    tempValues,
    errors,
    hasErrors: Boolean(errors.field || errors.values),
    handlers: {
      fieldChange,
      descriptionChange,
      restrictChange,
      valueChange,
      valueBlur,
      addValue,
      deleteValue,
      save,
      close,
    },
  }
}
