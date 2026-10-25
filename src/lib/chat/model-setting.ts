import {
  isLLMModelEnabled,
  parseLLMValue,
  type MyLLMProvider,
} from '@/stores/model'

/** Resolve only configured, enabled chat models; never guess from a model name. */
export function chatModelSetting(
  providers: MyLLMProvider,
  value: string,
): { model_type: 'chat' | 'image2text' } {
  const { modelName, providerName } = parseLLMValue(value)
  const matches = Object.entries(providers).flatMap(([name, provider]) =>
    providerName && providerName !== name
      ? []
      : provider.llm.filter(
          (model) =>
            model.name === modelName &&
            (model.type === 'chat' || model.type === 'image2text') &&
            isLLMModelEnabled(model),
        ),
  )
  if (matches.length !== 1) throw new Error('chat-model-unavailable')
  return { model_type: matches[0].type as 'chat' | 'image2text' }
}
