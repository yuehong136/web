import { apiClient } from '@/api'
import type { RuntimeAttachment } from '../../features/runtime-workbench/types'

const getAttachmentDocId = (file: RuntimeAttachment) => {
  const docId = file.doc_id || file.docId || file.id
  return typeof docId === 'string' ? docId : ''
}

const getAttachmentExt = (file: RuntimeAttachment) => {
  const ext = file.format || file.type || file.name.split('.').pop()
  return typeof ext === 'string' && ext ? ext.replace(/^\./, '') : 'markdown'
}

export async function downloadRuntimeAttachment(file: RuntimeAttachment) {
  const docId = getAttachmentDocId(file)

  if (!docId) {
    throw new Error('附件缺少 doc_id，无法下载')
  }

  await apiClient.download(`/document/download/${encodeURIComponent(docId)}`, file.name, {
    params: {
      ext: getAttachmentExt(file),
    },
  })
}
