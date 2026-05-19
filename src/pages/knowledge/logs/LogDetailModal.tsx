import { useTranslation } from 'react-i18next'
import { Database, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LogTabType } from './constants'
import type { LogTableItem } from './types'
import {
  LogDetailBody,
  LogDetailFooter,
} from './components/log-detail-sections'

interface LogDetailModalProps {
  open: boolean
  onClose: () => void
  logInfo: LogTableItem | null
  activeTab: LogTabType
}

export function LogDetailModal({
  open,
  onClose,
  logInfo,
  activeTab,
}: LogDetailModalProps) {
  const { t } = useTranslation()
  const isFileLogs = activeTab === LogTabType.FILE_LOGS
  const title = isFileLogs
    ? t('knowledge.logs.detail.fileTitle')
    : t('knowledge.logs.detail.datasetTitle')
  const HeaderIcon = isFileLogs ? FileText : Database

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-radius-xl flex h-10 w-10 items-center justify-center bg-state-focus-10">
              <HeaderIcon className="h-5 w-5 text-state-focus" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                {t('knowledge.logs.detail.description')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <LogDetailBody logInfo={logInfo} activeTab={activeTab} />

        <DialogFooter>
          <LogDetailFooter onClose={onClose} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
