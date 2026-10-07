import {
  hasRetrievalSource,
  withKnowledgeRetrieval,
} from '@/lib/chat/knowledge-prompt'
import type { AppConfig } from './types'

type RetrievalSourceConfig = Pick<AppConfig, 'kb_ids' | 'prompt_config'>

const retrievalSources = (config: RetrievalSourceConfig) => ({
  datasetIds: config.kb_ids,
  tavilyApiKey: config.prompt_config.tavily_api_key,
})

export const hasAppRetrievalSource = (config: RetrievalSourceConfig) =>
  hasRetrievalSource(retrievalSources(config))

/**
 * Applies the shared knowledge retrieval guarantee to the Studio editor config.
 * Returns the same object when nothing is missing or nothing is retrieved.
 */
export const withAppKnowledgeRetrieval = (
  config: AppConfig,
  knowledgeBlock: string,
): AppConfig => {
  const prompt = {
    systemPrompt: config.systemPrompt,
    parameters: config.prompt_config.parameters,
  }
  const next = withKnowledgeRetrieval(
    prompt,
    retrievalSources(config),
    knowledgeBlock,
  )
  if (next === prompt) {
    return config
  }

  return {
    ...config,
    systemPrompt: next.systemPrompt,
    prompt_config:
      next.parameters === prompt.parameters
        ? config.prompt_config
        : { ...config.prompt_config, parameters: next.parameters },
  }
}
