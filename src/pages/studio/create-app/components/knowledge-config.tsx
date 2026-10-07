import { useId, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  KnowledgeBaseAvatar,
  RerankModelSelector,
} from '@/components/knowledge'
import type { KnowledgeBase, LLMModel } from '@/types/api'
import { SUPPORTED_LANGUAGES } from '../constants'
import { CenterConfigSection } from './center-config-section'
import { ChatReferenceSettings } from './chat-reference-settings'
import { NumericField, ToggleField, type ConfigBindings } from './config-fields'

export interface KnowledgeConfigProps extends ConfigBindings {
  knowledgeBases: KnowledgeBase[]
  rerankModels: LLMModel[]
  modelsLoading: boolean
  modelsError?: string
  onAdd: () => void
  onRemove: (id: string) => void
}
export function KnowledgeConfig({
  config,
  onChange,
  knowledgeBases,
  rerankModels,
  modelsLoading,
  modelsError,
  onAdd,
  onRemove,
}: KnowledgeConfigProps) {
  const { t } = useTranslation()
  const id = useId()
  const [retrievalOpen, setRetrievalOpen] = useState(false)
  const [enhancementsOpen, setEnhancementsOpen] = useState(false)
  return (
    <div className="mx-auto w-full max-w-3xl space-y-space-xl p-space-lg">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <h2 className="text-base font-semibold text-text-primary">
          {t('studio.editor.knowledge')}{' '}
          <span className="text-sm font-normal text-text-secondary">
            {knowledgeBases.length}
          </span>
        </h2>
        <Button variant="outline" onClick={onAdd}>
          <Plus className="mr-space-xs size-icon-sm" />
          {t('studio.editor.addKnowledge')}
        </Button>
      </div>
      {knowledgeBases.length ? (
        <div className="space-y-space-sm">
          {knowledgeBases.map((kb) => (
            <div
              key={kb.id}
              className="flex min-w-0 items-center gap-space-sm border-b border-border-subtle py-space-sm"
            >
              <KnowledgeBaseAvatar
                name={kb.name}
                avatar={kb.avatar}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium text-text-primary"
                  title={kb.name}
                >
                  {kb.name}
                </p>
                <p
                  className="truncate text-xs text-text-secondary"
                  title={kb.description ?? undefined}
                >
                  {kb.description || kb.embd_id}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('studio.editor.removeKnowledge', {
                  name: kb.name,
                })}
                title={t('studio.editor.removeKnowledge', { name: kb.name })}
                onClick={() => onRemove(kb.id)}
              >
                <Trash2 className="size-icon-sm text-status-error" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-space-xs border-b border-border-subtle pb-space-lg">
          <p className="text-sm font-medium text-text-primary">
            {t('studio.editor.noKnowledge')}
          </p>
          <p className="text-sm text-text-secondary">
            {t('studio.editor.noKnowledgeHint')}
          </p>
        </div>
      )}
      <ChatReferenceSettings config={config} onChange={onChange} />
      <CenterConfigSection
        title={t('studio.editor.retrieval')}
        open={retrievalOpen}
        onOpenChange={setRetrievalOpen}
      >
        <p className="text-xs text-text-secondary">
          {t('studio.editor.retrievalHint')}
        </p>
        <div className="space-y-space-sm">
          <Label htmlFor={`${id}-mode`}>{t('studio.editor.searchMode')}</Label>
          <Select
            value={config.search_mode?.type ?? 'dense'}
            onValueChange={(value) => {
              if (value === 'hybrid')
                onChange('search_mode', {
                  type: 'hybrid',
                  weight_dense: config.search_mode?.weight_dense ?? 0.7,
                  weight_sparse: config.search_mode?.weight_sparse ?? 0.3,
                })
              else if (value === 'dense' || value === 'sparse')
                onChange('search_mode', { type: value })
            }}
          >
            <SelectTrigger id={`${id}-mode`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['dense', 'hybrid', 'sparse'] as const).map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {t(`studio.editor.${mode}`)}
                </SelectItem>
              ))}
              {config.search_mode?.type === 'fusion' && (
                <SelectItem value="fusion">
                  {t('studio.editor.fusion')}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        {config.search_mode?.type === 'hybrid' && (
          <div className="space-y-space-sm">
            <NumericField
              label={t('studio.editor.fusionWeight')}
              hint={t('studio.editor.fusionHint')}
              min={0}
              max={1}
              value={config.search_mode.weight_dense ?? 0.7}
              onChange={(value) =>
                onChange('search_mode', {
                  type: 'hybrid',
                  weight_dense: value,
                  weight_sparse: Number((1 - value).toFixed(2)),
                })
              }
            />
            <p className="text-xs text-text-secondary">
              {t('studio.editor.sparseWeight')}:{' '}
              {(config.search_mode.weight_sparse ?? 0.3).toFixed(2)}
            </p>
          </div>
        )}
        <NumericField
          label={t('studio.editor.threshold')}
          hint={t('studio.editor.thresholdHint')}
          min={0}
          max={1}
          value={config.similarity_threshold}
          onChange={(value) => onChange('similarity_threshold', value)}
        />
        <NumericField
          label={t('studio.editor.relevanceWeight')}
          hint={t('studio.editor.relevanceHint')}
          min={0}
          max={1}
          value={config.vector_similarity_weight}
          onChange={(value) => onChange('vector_similarity_weight', value)}
        />
        <NumericField
          label={t('studio.editor.topN')}
          hint={t('studio.editor.topNHint')}
          min={1}
          max={30}
          step={1}
          value={config.top_n}
          onChange={(value) => onChange('top_n', value)}
        />
        <RerankModelSelector
          models={rerankModels}
          selectedModelId={config.rerank_id}
          onSelect={(value) => onChange('rerank_id', value)}
          loading={modelsLoading}
          error={modelsError}
        />
        <div className="space-y-space-xs">
          <p className="text-sm font-medium text-text-primary">
            {t('studio.editor.topKFixed')}
          </p>
          <p className="text-xs leading-relaxed text-text-secondary">
            {t('studio.editor.topKHint')}
          </p>
        </div>
      </CenterConfigSection>
      <CenterConfigSection
        title={t('studio.editor.enhancements')}
        open={enhancementsOpen}
        onOpenChange={setEnhancementsOpen}
      >
        {(['keyword', 'toc_enhance', 'use_kg'] as const).map((field) => (
          <ToggleField
            key={field}
            config={config}
            onChange={onChange}
            field={field}
          />
        ))}
        <fieldset className="space-y-space-sm">
          <legend className="mb-space-sm text-sm font-medium text-text-primary">
            {t('studio.editor.crossLanguages')}
          </legend>
          <div className="flex flex-wrap gap-space-xs">
            {SUPPORTED_LANGUAGES.map(({ value }) => {
              const selected =
                config.prompt_config.cross_languages.includes(value)
              return (
                <Button
                  key={value}
                  size="sm"
                  variant={selected ? 'secondary' : 'outline'}
                  aria-pressed={selected}
                  onClick={() =>
                    onChange('prompt_config', {
                      ...config.prompt_config,
                      cross_languages: selected
                        ? config.prompt_config.cross_languages.filter(
                            (item) => item !== value,
                          )
                        : [...config.prompt_config.cross_languages, value],
                    })
                  }
                >
                  {t(`studio.editor.${value}`)}
                </Button>
              )
            })}
          </div>
        </fieldset>
        <div className="space-y-space-sm">
          <Label htmlFor={`${id}-web`}>
            {t('studio.editor.webCredential')}
          </Label>
          <Input
            id={`${id}-web`}
            type="password"
            autoComplete="off"
            value={config.prompt_config.tavily_api_key}
            onChange={(event) =>
              onChange('prompt_config', {
                ...config.prompt_config,
                tavily_api_key: event.target.value,
              })
            }
          />
          <p className="text-xs text-text-secondary">
            {t('studio.editor.webCredentialHint')}
          </p>
        </div>
      </CenterConfigSection>
    </div>
  )
}
