import {
  isLLMModelEnabled,
  resolveLLMValue,
  getLLMModelValue,
  type MyLLMProvider,
} from '@/stores/model'

/** Resolve only configured, enabled chat models; never guess from a model name. */
export function chatModelSetting(
  providers: MyLLMProvider,
  value: string,
): { model_type: 'chat' | 'image2text' } {
  const resolved = resolveLLMValue(providers, value, true)
  if (!resolved.matched) throw new Error('chat-model-unavailable')
  const matches = Object.entries(providers).flatMap(([provider, data]) =>
    data.llm.filter(
      (model) =>
        (model.type === 'chat' || model.type === 'image2text') &&
        isLLMModelEnabled(model) &&
        (getLLMModelValue(model, provider) === value ||
          (!/^[1-9]\d*$/.test(value) &&
            provider === resolved.providerName &&
            model.name === resolved.modelName)),
    ),
  )
  if (!matches.length) throw new Error('chat-model-unavailable')
  return {
    model_type: matches.some((model) => model.type === 'image2text')
      ? 'image2text'
      : 'chat',
  }
}
