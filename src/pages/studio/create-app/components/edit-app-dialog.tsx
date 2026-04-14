import React from 'react'
import { LayoutGrid, Trash2, Upload } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CreateAppPageController } from '../hooks/use-create-app-page'

interface EditAppDialogProps {
  controller: CreateAppPageController
}

export const EditAppDialog: React.FC<EditAppDialogProps> = ({ controller }) => {
  const {
    showEditModal,
    tempConfig,
    setTempConfig,
    iconInputRef,
    handleOpenIconPicker,
    handleIconInputChange,
    handleCancelEdit,
    handleSaveEdit,
  } = controller

  return (
    <Dialog open={showEditModal} onOpenChange={(open) => { if (!open) handleCancelEdit() }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>编辑应用信息</DialogTitle>
        </DialogHeader>

        <div className="space-y-space-base px-6 pb-6">
          <div className="space-y-space-sm">
            <label className="text-sm font-medium text-text-primary">应用图标</label>
            <input
              ref={iconInputRef}
              type="file"
              accept="image/jpeg,image/png,image/svg+xml"
              className="hidden"
              onChange={handleIconInputChange}
            />
            <div className="flex items-center gap-space-base">
              <button
                type="button"
                onClick={handleOpenIconPicker}
                className="rounded-radius-full focus:outline-none focus-visible:ring-2 focus-visible:ring-border-accent"
                title="点击上传图标"
              >
                <Avatar className="h-16 w-16">
                  {tempConfig.icon ? <AvatarImage src={tempConfig.icon} alt="App Icon" /> : null}
                  <AvatarFallback
                    style={{
                      background: 'var(--color-components-app-avatar-bg)',
                      border: '2px solid var(--color-components-app-avatar-border)',
                    }}
                  >
                    <LayoutGrid className="h-6 w-6" style={{ color: 'var(--color-text-tertiary)' }} />
                  </AvatarFallback>
                </Avatar>
              </button>

              <Button variant="outline" type="button" onClick={handleOpenIconPicker}>
                <Upload className="mr-space-xs h-4 w-4" />
                上传图标
              </Button>

              {tempConfig.icon ? (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setTempConfig((previousConfig) => ({ ...previousConfig, icon: undefined }))}
                >
                  <Trash2 className="mr-space-xs h-4 w-4" style={{ color: 'var(--color-state-error-text)' }} />
                  移除
                </Button>
              ) : null}
            </div>
            <span className="mt-space-xs block text-xs text-text-tertiary">
              支持 JPG、PNG、SVG 格式，文件大小不超过 2MB
            </span>
          </div>

          <div className="space-y-space-sm">
            <label className="text-sm font-medium text-text-primary">应用名称</label>
            <Input
              value={tempConfig.name}
              onChange={(event) => setTempConfig((previousConfig) => ({ ...previousConfig, name: event.target.value }))}
              placeholder="输入应用名称"
              maxLength={50}
            />
            <span className="block text-right text-xs text-text-tertiary">{tempConfig.name.length}/50</span>
          </div>

          <div className="space-y-space-sm">
            <label className="text-sm font-medium text-text-primary">应用描述</label>
            <Textarea
              value={tempConfig.description}
              onChange={(event) => setTempConfig((previousConfig) => ({ ...previousConfig, description: event.target.value }))}
              placeholder="描述应用的功能和用途..."
              rows={4}
              maxLength={200}
            />
            <span className="block text-right text-xs text-text-tertiary">{tempConfig.description.length}/200</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancelEdit}>取消</Button>
          <Button onClick={handleSaveEdit}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
