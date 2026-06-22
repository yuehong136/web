import type { KnowledgeBase } from '@/types/api'
import {
  knowledgeSettingsFormSchema,
  getDefaultFormValues,
  type KnowledgeSettingsFormData,
} from '@/types/knowledge-form'

export type KnowledgeBaseWithPipeline = KnowledgeBase & {
  pipeline_id?: string | null
}

/**
 * 将知识库详情映射为设置表单的初始值。纯函数，从 KnowledgeSettingsPage 抽出以控制文件体积。
 */
export const buildKnowledgeSettingsFormValues = (
  currentKnowledgeBase: KnowledgeBaseWithPipeline,
  normalizeEmbdId: (value: string) => string,
): KnowledgeSettingsFormData => {
  const defaultValues = getDefaultFormValues()
  const rawValues = {
    name: currentKnowledgeBase.name || '',
    description: currentKnowledgeBase.description || '',
    permission: (currentKnowledgeBase.permission as 'me' | 'team') || 'me',
    avatar: currentKnowledgeBase.avatar || '',
    parseType: currentKnowledgeBase.pipeline_id ? 2 : 1,
    parser_id: currentKnowledgeBase.parser_id || 'naive',
    pipeline_id: currentKnowledgeBase.pipeline_id || '',
    embd_id: normalizeEmbdId(currentKnowledgeBase.embd_id || ''),
    pagerank: currentKnowledgeBase.pagerank || 0,
    parser_config: {
      ...defaultValues.parser_config,
      ...currentKnowledgeBase.parser_config,
      // 回退兼容：优先使用 image_table_context_window，否则回退到 image_context_size 或 table_context_size
      image_table_context_window:
        currentKnowledgeBase.parser_config?.image_table_context_window ??
        currentKnowledgeBase.parser_config?.image_context_size ??
        currentKnowledgeBase.parser_config?.table_context_size ??
        0,
    },
  }

  return knowledgeSettingsFormSchema.parse(rawValues)
}
