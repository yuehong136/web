import { useTranslation } from 'react-i18next'
import { ModelSelect } from '@/components/models/model-select'
import {
  modelOptions,
  modelSelectOption,
} from '@/components/models/model-select-options'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import type { SkillModel } from '@/api/skill-types'

/** Skill endpoints decide eligibility; the tenant inventory only supplies identity. */
export function SkillModelSelect({
  label,
  value,
  type,
  query,
  onChange,
  disabled,
}: {
  label: string
  value: string
  type: 'embedding' | 'rerank'
  query: {
    data?: { models: SkillModel[] }
    isPending: boolean
    isError: boolean
    refetch: () => unknown
  }
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const inventory = useFetchMyLLMs()
  const { knownOptions } = modelOptions(inventory.myLLMs, [type])
  const options = (query.data?.models ?? [])
    .filter((model) => model.type === type)
    .map((model) => ({
      ...modelSelectOption(
        {
          id: model.id,
          name: model.name,
          type,
          available: model.available,
          used_token: 0,
        },
        model.provider,
      ),
      label:
        knownOptions.find((option) => option.value === model.id)?.label ??
        model.name,
      disabled: !model.available,
    }))
  return (
    <div className="min-w-0 space-y-2">
      <div className="text-sm font-medium text-text-primary">{label}</div>
      <ModelSelect
        ariaLabel={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
        options={[{ value: 'none', label: t('skills.none') }, ...options]}
        knownOptions={knownOptions}
        loading={query.isPending}
        error={query.isError}
        onRetry={query.refetch}
      />
    </div>
  )
}
