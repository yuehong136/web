'use client'

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface ConfigurationFormContainerProps {
  children: React.ReactNode
  className?: string
}

export function ConfigurationFormContainer({
  children,
  className,
}: ConfigurationFormContainerProps) {
  return <section className={cn('space-y-5', className)}>{children}</section>
}

interface MainContainerProps {
  children: React.ReactNode
  className?: string
}

export function MainContainer({ children, className }: MainContainerProps) {
  return <div className={cn('space-y-5', className)}>{children}</div>
}

interface SectionTitleProps {
  children: React.ReactNode
  className?: string
}

export function SectionTitle({ children, className }: SectionTitleProps) {
  return (
    <h4 className={cn('mb-3 text-sm font-medium text-text-primary', className)}>
      {children}
    </h4>
  )
}

export function BasicSectionTitle({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <SectionTitle className={className}>
      {t('knowledge.settings.configuration.basic')}
    </SectionTitle>
  )
}

export function EnhancementSectionTitle({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <SectionTitle className={className}>
      {t('knowledge.settings.configuration.enhancement')}
    </SectionTitle>
  )
}

export function ParserConfigurationEmptyState({
  i18nKey,
}: {
  i18nKey: string
}) {
  const { t } = useTranslation()
  return (
    <div className="py-4 text-center text-sm text-text-tertiary">
      {t(i18nKey)}
    </div>
  )
}

export function EmptyComponent() {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-center py-8">
      <p className="text-text-tertiary">
        {t('knowledge.settings.configuration.selectParser')}
      </p>
    </div>
  )
}
