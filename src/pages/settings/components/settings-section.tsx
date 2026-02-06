import React, { memo } from 'react'

interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
}

export const SettingsSection: React.FC<SettingsSectionProps> = memo(({
  title,
  description,
  children,
}) => (
  <div className="bg-components-settings-section-bg border border-components-settings-section-border rounded-lg p-space-lg">
    <h3 className="text-lg font-semibold text-components-settings-section-title mb-1">
      {title}
    </h3>
    {description && (
      <p className="text-sm text-components-settings-section-description mb-space-lg">
        {description}
      </p>
    )}
    {!description && <div className="mb-space-lg" />}
    {children}
  </div>
))

SettingsSection.displayName = 'SettingsSection'
