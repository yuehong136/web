import React, { memo, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SliderWithInput } from '@/components/ui/slider-with-input'
import { MultiSelectWithSearch } from '@/components/ui/multi-select-with-search'
import { RerankModelSelector } from '@/components/knowledge/RerankModelSelector'
import { useFetchKnowledgeList } from '@/hooks/use-knowledge-request'
import { llmAPI } from '@/api/llm'
import type { LLMModel } from '@/types/api'
import type { SearchConfig } from '@/types/search'

interface SearchSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: SearchConfig
  onConfigChange: (partial: Partial<SearchConfig>) => void
  onSave: () => void
  isSaving: boolean
  isDirty: boolean
}

const SearchSettingsSheet: React.FC<SearchSettingsSheetProps> = ({
  open,
  onOpenChange,
  config,
  onConfigChange,
  onSave,
  isSaving,
  isDirty,
}) => {
  const { knowledgeBases } = useFetchKnowledgeList({ page_size: 1000 })
  const [rerankModels, setRerankModels] = useState<LLMModel[]>([])
  const [rerankLoading, setRerankLoading] = useState(false)
  const [rerankError, setRerankError] = useState<string | undefined>()

  const kbOptions = useMemo(() => {
    return knowledgeBases.map((kb) => ({ label: kb.name, value: kb.id }))
  }, [knowledgeBases])

  useEffect(() => {
    const loadRerankModels = async () => {
      try {
        setRerankLoading(true)
        setRerankError(undefined)
        const response = await llmAPI.list({ mdl_type: 'rerank', available: true })

        const models = Object.values(response).flatMap((providerModels) =>
          providerModels.filter((model) => model.available && model.mdl_type === 'rerank')
        )
        setRerankModels(models)
      } catch {
        setRerankError('重排序模型加载失败')
      } finally {
        setRerankLoading(false)
      }
    }

    if (open) {
      loadRerankModels()
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[460px] sm:max-w-[460px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>搜索配置</SheetTitle>
          <SheetDescription>核心检索与生成能力配置（高级能力将在后续版本开放）</SheetDescription>
        </SheetHeader>

        <div className="mt-space-base space-y-space-base">
          <div className="space-y-2">
            <Label>知识库</Label>
            <MultiSelectWithSearch
              options={[{ label: '知识库', options: kbOptions }]}
              value={config.kb_ids}
              onChange={(kbIds) => onConfigChange({ kb_ids: kbIds })}
              placeholder="选择知识库"
              emptyText="暂无知识库"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-text-primary">检索参数</h4>
            <SliderWithInput
              label="相似度阈值"
              tooltip="低于该阈值的结果将被过滤。"
              value={config.similarity_threshold}
              onChange={(value) => onConfigChange({ similarity_threshold: value })}
              min={0}
              max={1}
              step={0.05}
              showSwitch={false}
            />
            <SliderWithInput
              label="向量权重"
              tooltip="向量召回与关键词召回的融合权重。"
              value={config.vector_similarity_weight}
              onChange={(value) => onConfigChange({ vector_similarity_weight: value })}
              min={0}
              max={1}
              step={0.05}
              showSwitch={false}
            />
            <SliderWithInput
              label="Top K"
              tooltip="单轮检索返回的最大片段数。"
              value={config.top_k}
              onChange={(value) => onConfigChange({ top_k: value })}
              min={1}
              max={128}
              step={1}
              precision={0}
              showSwitch={false}
            />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">知识图谱增强</Label>
                <p className="text-xs text-text-tertiary">启用后会使用知识图谱参与检索增强</p>
              </div>
              <Switch checked={config.use_kg} onCheckedChange={(checked) => onConfigChange({ use_kg: checked })} />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-text-primary">生成能力</h4>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">AI 摘要</Label>
                <p className="text-xs text-text-tertiary">生成结构化回答摘要</p>
              </div>
              <Switch checked={config.summary} onCheckedChange={(checked) => onConfigChange({ summary: checked })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">相关问题</Label>
                <p className="text-xs text-text-tertiary">自动推荐下一轮问题</p>
              </div>
              <Switch
                checked={config.related_search}
                onCheckedChange={(checked) => onConfigChange({ related_search: checked })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-text-primary">重排序</h4>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">启用重排序</Label>
                <p className="text-xs text-text-tertiary">使用 rerank 模型提高结果顺序质量</p>
              </div>
              <Switch
                checked={config.use_rerank}
                onCheckedChange={(checked) =>
                  onConfigChange({
                    use_rerank: checked,
                    rerank_id: checked ? config.rerank_id : '',
                  })
                }
              />
            </div>

            {config.use_rerank ? (
              <RerankModelSelector
                models={rerankModels}
                loading={rerankLoading}
                error={rerankError}
                selectedModelId={config.rerank_id || null}
                onSelect={(modelId) => onConfigChange({ rerank_id: modelId || '' })}
              />
            ) : null}
          </div>

          <div className="rounded-radius-lg border border-border-default bg-surface-secondary p-space-sm">
            <div className="flex items-start gap-2 text-sm text-text-secondary">
              <AlertCircle className="h-4 w-4 mt-0.5 text-text-tertiary" />
              <div>
                <p className="font-medium text-text-primary">即将支持</p>
                <p className="mt-1 text-xs">
                  `web_search`、`query_mindmap`、`meta_data_filter` 将在下一阶段开放配置和执行逻辑。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-space-base border-t border-border-default pt-space-sm">
          <Button
            className="w-full"
            onClick={onSave}
            disabled={isSaving || !isDirty || !config.kb_ids.length}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            保存配置
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default memo(SearchSettingsSheet)
