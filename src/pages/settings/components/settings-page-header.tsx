import React, { memo } from 'react'

interface SettingsPageHeaderProps {
  icon: React.ReactNode
  title: string
  description?: string
  actions?: React.ReactNode
}

export const SettingsPageHeader: React.FC<SettingsPageHeaderProps> = memo(
  ({ icon, title, description, actions }) => (
    <div className="shrink-0 border-b border-border-default px-8 py-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-space-sm">
            <span className="text-text-secondary">{icon}</span>
            <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
          </div>
          {description && (
            <p className="text-sm text-text-secondary">{description}</p>
          )}
        </div>
        {actions && <div className="ml-6 flex gap-space-sm">{actions}</div>}
      </div>
    </div>
  ),
)

SettingsPageHeader.displayName = 'SettingsPageHeader'
