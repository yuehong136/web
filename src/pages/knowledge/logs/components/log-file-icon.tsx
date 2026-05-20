import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const FILE_ICON_CLASS_BY_SUFFIX: Record<string, string> = {
  pdf: 'text-status-error',
  doc: 'text-state-focus',
  docx: 'text-state-focus',
  xls: 'text-status-success',
  xlsx: 'text-status-success',
  ppt: 'text-status-warning',
  pptx: 'text-status-warning',
  txt: 'text-text-secondary',
  md: 'text-text-secondary',
}

interface LogFileIconProps {
  suffix?: string
}

export function LogFileIcon({ suffix }: LogFileIconProps) {
  const iconClassName =
    FILE_ICON_CLASS_BY_SUFFIX[suffix?.toLowerCase() || ''] ||
    'text-text-tertiary'

  return <FileText className={cn('h-4 w-4 flex-shrink-0', iconClassName)} />
}
