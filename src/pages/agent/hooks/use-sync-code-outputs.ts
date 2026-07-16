import isEqual from 'lodash/isEqual'
import { useEffect } from 'react'
import type { CodeOutputMap } from '../utils/code-outputs'

type CodeOutputsForm = {
  getValues: (name: 'outputs') => unknown
  setValue: (
    name: 'outputs',
    value: CodeOutputMap | undefined,
    options: {
      shouldDirty: boolean
      shouldTouch: boolean
      shouldValidate: boolean
    },
  ) => void
}

export function useSyncCodeOutputs(
  form: CodeOutputsForm,
  externalOutputs: CodeOutputMap | undefined,
) {
  useEffect(() => {
    const currentOutputs = form.getValues('outputs') as
      | CodeOutputMap
      | undefined

    if (isEqual(currentOutputs, externalOutputs)) {
      return
    }

    form.setValue('outputs', externalOutputs, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }, [externalOutputs, form])
}
