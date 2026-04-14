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
    <CollapsibleTrigger
      className="flex w-full items-center justify-between px-space-lg py-space-base text-left transition-colors"
      style={{ backgroundColor: 'transparent' }}
      onMouseEnter={(event) => {
        event.currentTarget.style.backgroundColor = 'var(--color-components-collapse-header-bg-hover)'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <span className="text-base font-semibold text-text-primary">{title}</span>
      <span className="flex items-center gap-space-xs text-text-tertiary">
        {extra}
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </span>
    </CollapsibleTrigger>
    <CollapsibleContent className="space-y-space-lg px-space-lg pb-space-lg">
      {children}
    </CollapsibleContent>
  </Collapsible>
)
