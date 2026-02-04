/**
 * 可折叠区域组件
 * 用于表单的高级设置等需要折叠/展开的场景
 */

import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  /** 区域标题 */
  title: string
  /** 是否默认展开 */
  defaultOpen?: boolean
  /** 子内容 */
  children: React.ReactNode
  /** 自定义类名 */
  className?: string
  /** 标题前的图标 */
  icon?: React.ReactNode
  /** 标题右侧的额外内容 */
  extra?: React.ReactNode
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = false,
  children,
  className,
  icon,
  extra,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn('w-full', className)}
    >
      <div className="flex items-center gap-1.5 w-full">
        <CollapsibleTrigger className="flex items-center gap-1.5 flex-1 group cursor-pointer">
          <span
            className={cn(
              'transition-colors',
              isOpen ? 'text-text-accent' : 'text-text-secondary group-hover:text-text-primary'
            )}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
          {icon && (
            <span className={cn(
              'transition-colors',
              isOpen ? 'text-text-accent' : 'text-text-secondary'
            )}>
              {icon}
            </span>
          )}
          <span
            className={cn(
              'text-base font-medium transition-colors',
              isOpen ? 'text-text-accent' : 'text-text-secondary group-hover:text-text-primary'
            )}
          >
            {title}
          </span>
        </CollapsibleTrigger>
        {extra && <div className="ml-auto">{extra}</div>}
      </div>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="pt-4">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

CollapsibleSection.displayName = 'CollapsibleSection'
