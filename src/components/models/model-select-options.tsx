import type { SelectOption } from '@/components/ui/select-with-search'
import { ProviderIcon } from '@/components/ui/provider-icon'
import {
  getLLMModelLabel,
  getLLMModelValue,
  type LLMValueMode,
  type MyLLMModel,
} from '@/stores/model'
import { ModelCapabilities } from './model-capabilities'

/** Keep readable/searchable presentation separate from the persisted model reference. */
export function modelSelectOption(
  model: MyLLMModel,
  provider: string,
  mode?: LLMValueMode,
): SelectOption & { label: string } {
  return {
    label: getLLMModelLabel(model),
    value: getLLMModelValue(model, provider, mode),
    icon: <ProviderIcon provider={provider} className="size-5" size={20} />,
    description: (
      <ModelCapabilities
        types={model.model_types ?? [model.type]}
        tools={model.is_tools}
      />
    ),
    keywords: [
      model.name,
      provider,
      model.instance_name ?? '',
      ...(model.model_types ?? [model.type]),
    ],
  }
}
