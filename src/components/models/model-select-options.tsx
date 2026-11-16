import type { SelectOption } from '@/components/ui/select-with-search'
import { ProviderIcon } from '@/components/ui/provider-icon'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import {
  getLLMModelLabel,
  getLLMModelValue,
  type LLMValueMode,
  type MyLLMModel,
  type MyLLMProvider,
  isLLMModelEnabled,
} from '@/stores/model'
import { ModelCapabilities } from './model-capabilities'

export type ModelOption = SelectOption & { aliases?: string[] }

/** A provider group heading: logo tile and name (the name stays searchable). */
export function ModelProviderGroupLabel({ provider }: { provider: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-space-xs">
      <span aria-hidden className="inline-flex">
        <ProviderLogo provider={provider} size="xs" />
      </span>
      <span className="truncate">{provider}</span>
    </span>
  )
}

export function modelOptions(
  providers: MyLLMProvider,
  types?: readonly string[],
  mode?: LLMValueMode,
) {
  const groups = Object.entries(providers).map(([provider, data]) => ({
    label: <ModelProviderGroupLabel provider={provider} />,
    options: data.llm
      .filter((model) => !types || types.includes(model.type))
      .map((model) => ({
        ...modelSelectOption(model, provider, mode),
        disabled: !isLLMModelEnabled(model),
      })),
  }))
  return {
    knownOptions: groups.flatMap((group) => group.options),
    options: groups
      .map((group) => ({
        ...group,
        options: [
          ...new Map(
            group.options
              .filter((option) => !option.disabled)
              .map((option) => [option.value, option]),
          ).values(),
        ],
      }))
      .filter((group) => group.options.length),
  }
}

/** Keep readable/searchable presentation separate from the persisted model reference. */
export function modelSelectOption(
  model: MyLLMModel,
  provider: string,
  mode?: LLMValueMode,
): ModelOption & { label: string } {
  return {
    label: getLLMModelLabel(model),
    value: getLLMModelValue(model, provider, mode),
    aliases: [
      model.name,
      `${model.name}@${provider}`,
      ...(model.id === undefined ? [] : [String(model.id)]),
    ],
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
