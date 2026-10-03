import React from 'react'
import { useTranslation } from 'react-i18next'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { ModelProviderCard } from './model-provider-card'

interface UsedModelsProps {
  handleAddModel: (factoryName: string) => void
  handleDeleteFactory: (factoryName: string) => void
  handleEnableModel: (
    modelName: string,
    providerName: string,
    enabled: boolean,
  ) => void
}

export const UsedModels: React.FC<UsedModelsProps> = ({
  handleAddModel,
  handleDeleteFactory,
  handleEnableModel,
}) => {
  const { t } = useTranslation()
  const { myLLMs } = useFetchMyLLMs()

  const providerList = Object.entries(myLLMs)

  return (
    <div className="mb-4 flex w-full flex-col gap-4">
      {/* 标题 */}
      <h2 className="mt-space-base text-base font-semibold text-text-primary">
        {t('settings.models.configured')}
      </h2>

      {/* 供应商列表 */}
      {providerList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-accent/10 py-12">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <svg
              className="h-8 w-8 text-text-tertiary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-text-primary">
            还没有添加模型
          </h3>
          <p className="max-w-sm text-center text-sm text-text-secondary">
            {t('settings.models.chooseProvider')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {providerList.map(([providerName, providerData]) => (
            <ModelProviderCard
              key={providerName}
              name={providerName}
              tags={providerData.tags}
              llm={providerData.llm}
              onApiKeyClick={handleAddModel}
              onDeleteClick={handleDeleteFactory}
              onEnableModel={handleEnableModel}
            />
          ))}
        </div>
      )}
    </div>
  )
}
