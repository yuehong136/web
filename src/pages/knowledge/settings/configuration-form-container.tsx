'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ConfigurationFormContainerProps {
  children: React.ReactNode
  className?: string
}

export function ConfigurationFormContainer({
  children,
  className,
}: ConfigurationFormContainerProps) {
  return (
    <section className={cn('space-y-5', className)}>
      {children}
    </section>
  )
}

interface MainContainerProps {
  children: React.ReactNode
  className?: string
}

export function MainContainer({ children, className }: MainContainerProps) {
  return (
    <div className={cn('space-y-5', className)}>
      {children}
    </div>
  )
}

interface SectionTitleProps {
  children: React.ReactNode
  className?: string
}

export function SectionTitle({ children, className }: SectionTitleProps) {
  return (
    <h4 className={cn('text-sm font-medium text-text-primary mb-3', className)}>
      {children}
    </h4>
  )
}

export function EmptyComponent() {
  return (
    <div className="flex items-center justify-center py-8">
      <p className="text-text-tertiary">请选择解析器类型</p>
    </div>
  )
}
