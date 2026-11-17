import type { TFunction } from 'i18next'
import { downloadGeneratedAttachment } from '@/api/document-files'
import type { RuntimeAttachment } from '../../features/runtime-workbench/types'

const getAttachmentDocId = (file: RuntimeAttachment) => {
  const docId = file.doc_id || file.docId || file.id
  return typeof docId === 'string' ? docId : ''
}

const getAttachmentExt = (file: RuntimeAttachment) => {
  const ext = file.format || file.type || file.name.split('.').pop()
  return typeof ext === 'string' && ext ? ext.replace(/^\./, '') : 'markdown'
}

export async function downloadRuntimeAttachment(
  file: RuntimeAttachment,
  t: TFunction,
) {
  const docId = getAttachmentDocId(file)

  if (!docId) {
    throw new Error(t('agent.runtimePanel.chatPanel.attachmentMissingDocId'))
  }

  await downloadGeneratedAttachment(docId, file.name, getAttachmentExt(file))
}
