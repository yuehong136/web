import React from 'react'
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
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={cn(
            "px-6 py-2.5 rounded-full text-[15px] font-medium border transition-colors",
            activeTab === tab.id
              ? "bg-text-primary text-text-inverted border-text-primary"
              : "bg-components-card-bg text-text-primary border-border-default hover:bg-background-subtle"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
