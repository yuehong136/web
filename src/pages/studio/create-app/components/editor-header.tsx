import React from 'react'
import { ArrowLeft, LayoutGrid, Pencil, Save } from 'lucide-react'
import { PageHeader } from '@/components/patterns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { CreateAppPageController } from '../hooks/use-create-app-page'

interface EditorHeaderProps {
  controller: CreateAppPageController
  onBack: () => void
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  controller,
  onBack,
}) => {
  const { config, saving, handleEditApp, handleSave } = controller

  return (
    <PageHeader
      compact
      className="border-components-studio-border bg-components-studio-surface"
      breadcrumb={
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-space-xs h-4 w-4" />
          返回工作室
        </Button>
      }
      title={
        <span className="gap-space-sm flex items-center text-base">
          <Avatar className="h-10 w-10">
            {config.icon ? (
              <AvatarImage src={config.icon} alt={config.name} />
            ) : null}
            <AvatarFallback
              style={{
                background: 'var(--color-components-app-avatar-bg)',
                border: '1px solid var(--color-components-app-avatar-border)',
              }}
            >
              <LayoutGrid
                className="h-5 w-5"
                style={{ color: 'var(--color-text-tertiary)' }}
              />
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 truncate text-base font-semibold text-text-primary">
            {config.name}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleEditApp}
            title="编辑应用信息"
            aria-label="编辑应用信息"
          >
            <Pencil
              className="h-4 w-4"
              style={{ color: 'var(--color-components-icon-button-text)' }}
            />
          </Button>
        </span>
      }
      description={config.description}
      actions={
        <>
          <Button
            variant="outline"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          >
            <Save className="mr-space-xs h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </>
      }
    />
  )
}
