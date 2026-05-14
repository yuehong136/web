import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { FunctionTab } from '../types'

interface FunctionTabsProps {
  tabs: FunctionTab[]
  activeTab: string | null
  onTabClick: (tabId: string) => void
}

export const FunctionTabs: React.FC<FunctionTabsProps> = ({
  tabs,
  activeTab,
  onTabClick,
}) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={cn(
            'rounded-full border px-6 py-2.5 text-[15px] font-medium transition-colors',
            activeTab === tab.id
              ? 'border-text-primary bg-text-primary text-text-inverted'
              : 'border-border-default bg-components-card-bg text-text-primary hover:bg-background-subtle',
          )}
        >
          {tab.labelKey ? t(tab.labelKey, tab.label) : tab.label}
        </button>
      ))}
    </div>
  )
}
