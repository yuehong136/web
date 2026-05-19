import React from 'react'
import { cn } from '@/lib/utils'
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface MetadataModalHeaderProps {
  icon: React.ReactNode
  iconClassName?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
}

export const MetadataModalHeader: React.FC<MetadataModalHeaderProps> = ({
  icon,
  iconClassName,
  title,
  subtitle,
}) => {
  return (
    <DialogHeader>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            iconClassName,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </div>
      </div>
    </DialogHeader>
  )
}
