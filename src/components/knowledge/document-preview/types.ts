export type FileType =
  | 'pdf'
  | 'image'
  | 'video'
  | 'docx'
  | 'xlsx'
  | 'pptx'
  | 'txt'
  | 'md'
  | 'csv'
  | 'unknown'

export interface RawHighlight {
  page: number
  x1: number
  x2: number
  y1: number
  y2: number
}

export interface DocumentPreviewProps {
  docId: string
  docName?: string
  docType?: string
  highlights?: RawHighlight[]
  selectedChunkId?: string
  className?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  onClose?: () => void
  hideHeader?: boolean
  canDownload?: boolean
}

export interface CSVData {
  rows: string[][]
  headers: string[]
}
