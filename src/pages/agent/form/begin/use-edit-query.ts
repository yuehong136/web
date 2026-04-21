import { useCallback, useMemo, useState } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { BeginQueryType } from '../../constant'
import type { BeginInputEditorItem } from './utils'

type UseEditQueryRecordParams = {
  form: UseFormReturn<FieldValues & { inputs?: BeginInputEditorItem[] }>
}

function buildEmptyRecord(): BeginInputEditorItem {
  return {
    key: '',
    type: BeginQueryType.Line,
    value: '',
    optional: false,
    name: '',
    options: [],
  }
}

export function useEditQueryRecord({ form }: UseEditQueryRecordParams) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(-1)
  const [currentRecord, setCurrentRecord] = useState<BeginInputEditorItem>(
    buildEmptyRecord(),
  )

  const watchedInputs = useWatch({
    control: form.control,
    name: 'inputs',
  })
  const inputs = useMemo(
    () => (watchedInputs || []) as BeginInputEditorItem[],
    [watchedInputs],
  )

  const otherThanCurrentQuery = useMemo(
    () => inputs.filter((_, currentIndex) => currentIndex !== index),
    [index, inputs],
  )

  const hideModal = useCallback(() => {
    setOpen(false)
    setIndex(-1)
    setCurrentRecord(buildEmptyRecord())
  }, [])

  const showModal = useCallback((idx?: number, record?: BeginInputEditorItem) => {
    setIndex(idx ?? -1)
    setCurrentRecord(record || buildEmptyRecord())
    setOpen(true)
  }, [])

  const handleEditRecord = useCallback(
    (record: BeginInputEditorItem) => {
      const nextInputs =
        index > -1
          ? [...inputs.slice(0, index), record, ...inputs.slice(index + 1)]
          : [...inputs, record]

      form.setValue('inputs', nextInputs, {
        shouldDirty: true,
        shouldValidate: true,
      })
      hideModal()
    },
    [form, hideModal, index, inputs],
  )

  const handleDeleteRecord = useCallback(
    (idx: number) => {
      form.setValue(
        'inputs',
        inputs.filter((_, currentIndex) => currentIndex !== idx),
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      )
    },
    [form, inputs],
  )

  return {
    ok: handleEditRecord,
    currentRecord,
    open,
    hideModal,
    showModal,
    otherThanCurrentQuery,
    handleDeleteRecord,
  }
}
