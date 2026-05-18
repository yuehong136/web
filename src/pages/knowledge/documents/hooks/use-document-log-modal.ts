import { useCallback, useMemo, useState } from 'react'
import type { Document } from '@/types/api'
import {
  formatDocumentDate,
  formatDocumentDuration,
  formatDocumentFileSize,
} from '../utils/format'

export function useDocumentLogModal(documents: Document[]) {
  const [visible, setVisible] = useState(false)
  const [record, setRecord] = useState<Document | null>(null)

  const logInfo = useMemo(() => {
    const findRecord = documents.find((item) => item.id === record?.id)
    const defaultLog = {
      fileName: record?.name || '-',
      details: record?.progress_msg || '-',
    }

    if (!findRecord) {
      return defaultLog
    }

    return {
      fileType: findRecord.suffix || findRecord.type,
      uploadedBy: findRecord.nickname || findRecord.created_by,
      fileName: findRecord.name,
      uploadDate: formatDocumentDate(findRecord.create_date),
      fileSize: formatDocumentFileSize(findRecord.size || 0),
      processBeginAt: findRecord.process_begin_at
        ? formatDocumentDate(findRecord.process_begin_at)
        : undefined,
      chunkNumber: findRecord.chunk_num,
      duration: findRecord.process_duration
        ? formatDocumentDuration(findRecord.process_duration)
        : undefined,
      status: findRecord.run,
      details: findRecord.progress_msg || '-',
    }
  }, [record, documents])

  const showLog = useCallback((doc: Document) => {
    setRecord(doc)
    setVisible(true)
  }, [])

  const hideLog = useCallback(() => {
    setVisible(false)
  }, [])

  return {
    showLog,
    hideLog,
    logVisible: visible,
    logInfo,
  }
}
