import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Clock, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Version {
  id: string
  name: string
  createdAt: string
  description?: string
}

interface VersionDialogProps {
  hideModal?: () => void
  versions?: Version[]
  onRestore?: (versionId: string) => void
}

export function VersionDialog({
  hideModal,
  versions = [],
  onRestore,
}: VersionDialogProps) {
  const { t } = useTranslation()
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)

  const handleRestore = () => {
    if (selectedVersion && onRestore) {
      onRestore(selectedVersion)
      hideModal?.()
    }
  }

  return (
    <Dialog open onOpenChange={() => hideModal?.()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-space-sm">
            <Clock className="size-5" />
            {t('flow.versionHistory', '版本历史')}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-auto">
          {versions.length === 0 ? (
            <div className="text-center text-text-secondary py-space-xl">
              {t('flow.noVersions', '暂无版本记录')}
            </div>
          ) : (
            <div className="space-y-space-sm">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={cn(
                    'flex items-center justify-between p-space-base rounded-radius-lg border cursor-pointer transition-colors',
                    selectedVersion === version.id
                      ? 'border-border-accent bg-surface-accent/10'
                      : 'border-border-default hover:bg-surface-secondary',
                  )}
                  onClick={() => setSelectedVersion(version.id)}
                >
                  <div className="flex flex-col gap-space-xs">
                    <span className="font-medium">{version.name}</span>
                    <span className="text-sm text-text-secondary">
                      {version.createdAt}
                    </span>
                    {version.description && (
                      <span className="text-sm text-text-tertiary">
                        {version.description}
                      </span>
                    )}
                  </div>
                  {selectedVersion === version.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRestore()
                      }}
                    >
                      <RotateCcw className="size-4 mr-space-xs" />
                      {t('flow.restore', '恢复')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
