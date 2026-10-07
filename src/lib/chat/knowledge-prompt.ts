/**
 * MultiRAG only retrieves for a chat whose `prompt_config.parameters` lists
 * `knowledge`, and injects the retrieved chunks at the `{knowledge}`
 * placeholder of the system prompt. A chat with datasets but without both
 * answers every question with its empty response, so every chat editor keeps
 * them in place whenever a retrieval source (dataset or Tavily key) is saved.
 */
export const KNOWLEDGE_PLACEHOLDER = '{knowledge}'
export const KNOWLEDGE_PARAMETER_KEY = 'knowledge'

// Matches the zh-CN and en-US `chat.knowledgePrompt.block` texts.
const KNOWLEDGE_BLOCK_PATTERNS = [
  /以下是知识库：[\s\S]*?以上是知识库。/g,
  /Here is the knowledge base:[\s\S]*?The above is the knowledge base\./g,
]

export interface PromptParameter {
  key: string
  optional: boolean
}

/** The system prompt and `prompt_config.parameters` of a chat. */
export interface KnowledgePrompt {
  systemPrompt: string
  parameters: PromptParameter[]
}

export interface RetrievalSources {
  datasetIds: readonly string[]
  tavilyApiKey?: string
}

export const hasKnowledgePlaceholder = (prompt: string) =>
  prompt.includes(KNOWLEDGE_PLACEHOLDER)

export const hasRetrievalSource = ({
  datasetIds,
  tavilyApiKey,
}: RetrievalSources) => datasetIds.length > 0 || Boolean(tavilyApiKey?.trim())

const appendKnowledgeBlock = (prompt: string, knowledgeBlock: string) => {
  const text = prompt.trimEnd()
  return text ? `${text}\n\n${knowledgeBlock}` : knowledgeBlock
}

/**
 * Adds the knowledge block and required `knowledge` parameter a chat with
 * retrieval sources needs. Returns the same prompt when nothing is missing or
 * nothing is retrieved.
 */
export const withKnowledgeRetrieval = (
  prompt: KnowledgePrompt,
  sources: RetrievalSources,
  knowledgeBlock: string,
): KnowledgePrompt => {
  if (!hasRetrievalSource(sources)) {
    return prompt
  }

  const needsPlaceholder = !hasKnowledgePlaceholder(prompt.systemPrompt)
  const needsParameter = !prompt.parameters.some(
    (parameter) => parameter.key === KNOWLEDGE_PARAMETER_KEY,
  )
  if (!needsPlaceholder && !needsParameter) {
    return prompt
  }

  return {
    systemPrompt: needsPlaceholder
      ? appendKnowledgeBlock(prompt.systemPrompt, knowledgeBlock)
      : prompt.systemPrompt,
    parameters: needsParameter
      ? [
          ...prompt.parameters,
          { key: KNOWLEDGE_PARAMETER_KEY, optional: false },
        ]
      : prompt.parameters,
  }
}

/** Removes inserted knowledge blocks and stray placeholders from a prompt without retrieval sources. */
export const stripKnowledgePlaceholder = (prompt: string) =>
  KNOWLEDGE_BLOCK_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, ''),
    prompt,
  )
    .replaceAll(KNOWLEDGE_PLACEHOLDER, '')
    .trim()
