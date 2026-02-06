import React, { memo } from 'react'

interface SettingsPageHeaderProps {
  icon: React.ReactNode
  title: string
  description?: string
  actions?: React.ReactNode
}

export const SettingsPageHeader: React.FC<SettingsPageHeaderProps> = memo(({
  icon,
  title,
  description,
  actions,
}) => (
  <div className="flex-shrink-0 px-8 py-6 border-b border-border-default">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-space-sm mb-1">
          <span className="text-text-secondary">{icon}</span>
          <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        </div>
        {description && (
          <p className="text-text-secondary text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-space-sm ml-6">{actions}</div>}
    </div>
  </div>
))

SettingsPageHeader.displayName = 'SettingsPageHeader'
