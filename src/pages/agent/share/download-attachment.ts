import type { RuntimeAttachment } from '../features/runtime-workbench/types'

const EXTERNAL_API_BASE_URL = '/api'

const getAttachmentDocId = (file: RuntimeAttachment) => {
  const docId = file.doc_id || file.docId || file.id
  return typeof docId === 'string' ? docId : ''
}

const getAttachmentExt = (file: RuntimeAttachment) => {
  const ext = file.format || file.type || file.name.split('.').pop()
  return typeof ext === 'string' && ext ? ext.replace(/^\./, '') : 'markdown'
}

const getDownloadFilename = (
  response: Response,
  fallback: string,
) => {
  const disposition = response.headers.get('Content-Disposition')
  const utf8Match = disposition?.match(/filename\*=UTF-8''([^;\s]+)/)
  const asciiMatch =
    disposition?.match(/filename="([^"]+)"/) ||
    disposition?.match(/filename=([^;\s]+)/)

  return decodeURIComponent(
    utf8Match?.[1] || asciiMatch?.[1] || fallback || 'download',
  )
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function downloadShareAttachment({
  file,
  agentId,
  betaToken,
}: {
  file: RuntimeAttachment
  agentId: string
  betaToken: string
}) {
  const docId = getAttachmentDocId(file)

  if (!agentId) {
    throw new Error('缺少 Agent ID，无法下载附件')
  }

  if (!docId) {
    throw new Error('附件缺少 doc_id，无法下载')
  }

  const params = new URLSearchParams({
    ext: getAttachmentExt(file),
  })
  const response = await fetch(
    `${EXTERNAL_API_BASE_URL}/v1/agentbots/${encodeURIComponent(agentId)}/attachments/${encodeURIComponent(docId)}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${betaToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`附件下载失败：HTTP ${response.status}`)
  }

  const blob = await response.blob()
  downloadBlob(blob, getDownloadFilename(response, file.name))
}
