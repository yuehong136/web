import React from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

/**
 * 设置项标签组件
 */
export const SettingLabel: React.FC<{
  children: React.ReactNode
  tooltip?: string
  htmlFor?: string
}> = ({ children, tooltip, htmlFor }) => (
  <Label
    htmlFor={htmlFor}
    className="cursor-pointer text-sm font-medium"
    style={{ color: 'var(--color-text-primary)' }}
    title={tooltip}
  >
    {children}
  </Label>
)

/**
 * 设置项行组件
 */
export const SettingRow: React.FC<{
  label: string
  tooltip?: string
  children: React.ReactNode
  vertical?: boolean
}> = ({ label, tooltip, children, vertical = false }) => (
  <div className={vertical ? 'space-y-2' : 'flex items-center justify-between'}>
    <SettingLabel tooltip={tooltip}>{label}</SettingLabel>
    {children}
  </div>
)

/**
 * 聊天设置面板头部
 */
export const ChatSettingsHeader: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const { t } = useTranslation()

  return (
    <div
      className="flex items-center justify-between p-4"
      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
    >
      <h2
        className="text-base font-medium"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {t('chat.settings.title')}
      </h2>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="h-8 w-8 p-0"
        aria-label={t('common.close')}
      >
        <X
          className="h-4 w-4"
          style={{ color: 'var(--color-text-tertiary)' }}
        />
      </Button>
    </div>
  )
}

/**
 * 聊天设置面板中的可折叠分组
 */
export const ChatSettingsSection: React.FC<{
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}> = ({ title, open, onOpenChange, children }) => (
  <Collapsible open={open} onOpenChange={onOpenChange}>
    <CollapsibleTrigger
      className="flex w-full items-center justify-between px-4 py-3 transition-colors"
      style={{
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor =
          'var(--color-components-collapse-header-bg-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <span
        className="font-medium"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {title}
      </span>
      <span style={{ color: 'var(--color-text-tertiary)' }}>
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </span>
    </CollapsibleTrigger>
    <CollapsibleContent className="space-y-4 px-4 pb-4">
      {children}
    </CollapsibleContent>
  </Collapsible>
)
