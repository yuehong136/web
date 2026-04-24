import React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface CenterConfigSectionProps {
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  extra?: React.ReactNode
  children: React.ReactNode
}

export const CenterConfigSection: React.FC<CenterConfigSectionProps> = ({
  title,
  open,
  onOpenChange,
  extra,
  children,
}) => (
  <Collapsible open={open} onOpenChange={onOpenChange}>
    {/* header 不使用单一 CollapsibleTrigger 包裹，避免 extra 传入 <Button> 时出现 <button> 嵌套 */}
    <div
      className="flex w-full items-center px-space-lg py-space-base transition-colors"
      style={{ backgroundColor: 'transparent' }}
      onMouseEnter={(event) => {
        event.currentTarget.style.backgroundColor = 'var(--color-components-collapse-header-bg-hover)'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <CollapsibleTrigger className="flex-1 text-left text-base font-semibold text-text-primary">
        {title}
      </CollapsibleTrigger>
      <span className="flex items-center gap-space-xs text-text-tertiary">
        {extra}
        <CollapsibleTrigger
          className="flex items-center"
          aria-label={open ? '收起' : '展开'}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </CollapsibleTrigger>
      </span>
    </div>
    <CollapsibleContent className="space-y-space-lg px-space-lg pb-space-lg">
      {children}
    </CollapsibleContent>
  </Collapsible>
)
