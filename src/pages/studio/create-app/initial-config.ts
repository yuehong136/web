import type { ProductLocale } from '@/locales/locale-registry'
import { studioEditor as chinese } from '@/locales/zh-CN/studio-editor'
import { studioEditor as english } from '@/locales/en-US/studio-editor'
import { createInitialConfig } from './constants'

// Initial form values must not depend on the asynchronous i18next init tick.
export function createInitialEditorConfig(
  params: Parameters<typeof createInitialConfig>[0],
  locale: ProductLocale,
) {
  const defaults = locale === 'en-US' ? english : chinese
  const config = createInitialConfig({
    ...params,
    name: params.name || defaults.defaultName,
    description: params.description || defaults.defaultDescription,
  })
  return {
    ...config,
    systemPrompt: defaults.defaultPrompt,
    prompt_config: {
      ...config.prompt_config,
      prologue: defaults.defaultPrologue,
    },
  }
}
