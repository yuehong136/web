import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, Upload } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CreateAppPageController } from '../hooks/use-create-app-page'

type AppInfoBindings = Pick<
  CreateAppPageController,
  | 'showEditModal'
  | 'tempConfig'
  | 'setTempConfig'
  | 'iconInputRef'
  | 'handleOpenIconPicker'
  | 'handleIconInputChange'
  | 'handleCancelEdit'
  | 'handleSaveEdit'
>
export function EditAppDialog({ controller }: { controller: AppInfoBindings }) {
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
  const { t } = useTranslation()
  const id = useId()
  return (
    <Dialog
      open={showEditModal}
      onOpenChange={(open) => {
        if (!open) handleCancelEdit()
      }}
    >
      <DialogContent size="md" modal>
        <DialogHeader>
          <DialogTitle>{t('studio.editor.editInfo')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-space-lg p-space-lg">
          <div className="space-y-space-sm">
            <p className="text-sm font-medium">{t('studio.editor.icon')}</p>
            <Input
              ref={iconInputRef}
              type="file"
              accept="image/jpeg,image/png,image/svg+xml"
              className="hidden"
              onChange={handleIconInputChange}
            />
            <div className="flex flex-wrap items-center gap-space-sm">
              <Avatar className="size-12">
                {tempConfig.icon && (
                  <AvatarImage
                    src={tempConfig.icon}
                    alt={t('studio.editor.icon')}
                  />
                )}
                <AvatarFallback>
                  <LayoutGrid className="size-icon-lg" />
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" onClick={handleOpenIconPicker}>
                <Upload className="mr-space-xs size-icon-sm" />
                {t('studio.editor.uploadIcon')}
              </Button>
              {tempConfig.icon && (
                <Button
                  variant="ghost"
                  onClick={() =>
                    setTempConfig((previous) => ({
                      ...previous,
                      icon: undefined,
                    }))
                  }
                >
                  {t('studio.editor.remove')}
                </Button>
              )}
            </div>
            <p className="text-xs text-text-secondary">
              {t('studio.editor.iconHint')}
            </p>
          </div>
          <div className="space-y-space-sm">
            <Label htmlFor={`${id}-name`}>{t('studio.editor.name')}</Label>
            <Input
              id={`${id}-name`}
              value={tempConfig.name}
              onChange={(event) =>
                setTempConfig((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              maxLength={50}
            />
            <p className="text-right text-xs text-text-secondary">
              {tempConfig.name.length}/50
            </p>
          </div>
          <div className="space-y-space-sm">
            <Label htmlFor={`${id}-description`}>
              {t('studio.editor.description')}
            </Label>
            <Textarea
              id={`${id}-description`}
              value={tempConfig.description}
              onChange={(event) =>
                setTempConfig((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              placeholder={t('studio.editor.descriptionPlaceholder')}
              rows={4}
              maxLength={200}
            />
            <p className="text-right text-xs text-text-secondary">
              {tempConfig.description.length}/200
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancelEdit}>
            {t('studio.editor.cancel')}
          </Button>
          <Button onClick={handleSaveEdit}>{t('studio.editor.apply')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
