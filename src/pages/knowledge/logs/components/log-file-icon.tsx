import { FileKindTile } from '@/components/patterns/file-kind-tile'

interface LogFileIconProps {
  suffix?: string
}

/** The logged file's type tile, coloured like the documents table. */
export function LogFileIcon({ suffix }: LogFileIconProps) {
  return <FileKindTile name={suffix?.trim() || 'file'} size="sm" />
}
