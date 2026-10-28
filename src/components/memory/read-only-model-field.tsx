import { ModelSelect } from '@/components/models/model-select'
import { modelOptions } from '@/components/models/model-select-options'
import { useModelSelectorRequest } from '@/hooks/use-model-selector-request'

export function ReadOnlyModelField({
  modelId,
}: {
  modelId: string | undefined
}) {
  const { myLLMs, modelRequest } = useModelSelectorRequest()
  return (
    <ModelSelect
      {...modelOptions(myLLMs)}
      {...modelRequest}
      value={modelId ?? ''}
      disabled
      placeholder="-"
    />
  )
}
