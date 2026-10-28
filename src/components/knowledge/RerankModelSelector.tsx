import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { FormTooltip } from '@/components/ui/tooltip'
import { ModelSelect } from '@/components/models/model-select'
import { modelSelectOption } from '@/components/models/model-select-options'
import type { LLMModel } from '@/types/api'

interface RerankModelSelectorProps {
  models: LLMModel[]
  selectedModelId: string | null
  onSelect: (modelId: string | null) => void
  loading?: boolean
  error?: string
  onRetry?: () => unknown
}
const NO_RERANK_VALUE = '__NO_RERANK__'
export const RerankModelSelector: FC<RerankModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelect,
  loading,
  error,
  onRetry,
}) => {
  const { t } = useTranslation()
  const knownOptions = models.map((model) => ({
    ...modelSelectOption(
      {
        id: model.id,
        name: model.llm_name,
        label: model.display_name,
        type: 'rerank',
        used_token: 0,
      },
      model.fid,
    ),
    disabled: !model.available || model.status === '0',
  }))
  const providers = [...new Set(models.map((model) => model.fid))]
  const options = [
    {
      label: (
        <span className="flex items-center gap-2">
          <X aria-hidden className="size-4" />
          {t('knowledge.search.rerank.none')}
        </span>
      ),
      value: NO_RERANK_VALUE,
    },
    ...providers.map((provider) => ({
      label: provider,
      options: knownOptions.filter(
        (option, index) => models[index].fid === provider && !option.disabled,
      ),
    })),
  ]
  return (
    <div className="space-y-2">
      <div className="flex items-center text-xs font-medium text-text-primary">
        {t('knowledge.search.rerank.label')}
        <FormTooltip tooltip={t('knowledge.search.rerank.tooltip')} />
      </div>
      <ModelSelect
        options={options}
        knownOptions={knownOptions}
        value={selectedModelId || NO_RERANK_VALUE}
        onChange={(value) =>
          onSelect(value === NO_RERANK_VALUE || !value ? null : value)
        }
        loading={loading}
        error={error}
        onRetry={onRetry}
        ariaLabel={t('knowledge.search.rerank.label')}
        placeholder={t('knowledge.search.rerank.placeholder')}
        emptyText={t('knowledge.search.rerank.empty')}
        triggerClassName="h-10"
      />
    </div>
  )
}
