import React from 'react'
import { useModelStore } from '@/stores/model'
import { ModelProviderCard } from './model-provider-card'

interface UsedModelsProps {
  handleAddModel: (factoryName: string) => void
  handleDeleteFactory: (factoryName: string) => void
  handleEnableModel: (modelName: string, providerName: string, enabled: boolean) => void
}

export const UsedModels: React.FC<UsedModelsProps> = ({
  handleAddModel,
  handleDeleteFactory,
  handleEnableModel,
}) => {
  const { myLLMs } = useModelStore()
  
  const providerList = Object.entries(myLLMs)

  return (
    <div className="flex flex-col w-full gap-4 mb-4">
      {/* 标题 */}
      <h2 className="text-2xl font-medium text-text-primary mt-4">
        添加了的模型
      </h2>

      {/* 供应商列表 */}
      {providerList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg bg-accent/10">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
            <svg 
              className="w-8 h-8 text-text-tertiary" 
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
          <h3 className="text-lg font-medium text-text-primary mb-2">
            还没有添加模型
          </h3>
          <p className="text-sm text-text-secondary text-center max-w-sm">
            从右侧的可选模型中选择您需要的AI模型供应商
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


