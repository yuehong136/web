import {
  SearchExecutionMode,
  SearchSourceMode,
  type SearchConfig,
} from '@/types/search'

export interface SearchRuntimeOptions {
  docIds?: string[]
  executionMode?: SearchExecutionMode
  sourceMode?: SearchSourceMode
}

export const buildRuntimeConfig = (
  baseConfig: SearchConfig,
  executionMode: SearchExecutionMode,
  sourceMode: SearchSourceMode
): SearchConfig => {
  const modeConfigMap: Record<SearchExecutionMode, Partial<SearchConfig>> = {
    [SearchExecutionMode.QUICK_QA]: {
      // 仅限制检索规模，不覆盖用户在设置面板里的功能开关。
      top_k: Math.min(baseConfig.top_k || 8, 8),
    },
    [SearchExecutionMode.DEEP_RESEARCH]: {},
    [SearchExecutionMode.TASK_EXECUTION]: {},
  }

  const sourceConfigMap: Record<SearchSourceMode, Partial<SearchConfig>> = {
    [SearchSourceMode.KNOWLEDGE_BASE]: {
      web_search: false,
    },
    [SearchSourceMode.WEB]: {
      web_search: true,
      use_kg: false,
    },
    [SearchSourceMode.HYBRID]: {
      web_search: true,
    },
  }

  return {
    ...baseConfig,
    ...modeConfigMap[executionMode],
    ...sourceConfigMap[sourceMode],
  }
}
