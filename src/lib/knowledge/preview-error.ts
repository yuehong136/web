/**
 * 文档预览与下载失败的固定分类。
 *
 * 分类只读 HTTP 状态、信封里的业务码和响应类型；后端原文（message、retmsg、
 * detail）不进入分类结果，界面只能按分类显示固定文案。
 */
export type PreviewErrorCategory =
  | 'not-found'
  | 'forbidden'
  | 'session-expired'
  | 'unsupported'
  | 'unavailable'

/**
 * MultiRAG `GET /v1/document/get/{doc_id}` 以 HTTP 200 返回业务失败：
 * 文档不存在为 101（ARGUMENT_ERROR），无权访问为 109（AUTHENTICATION_ERROR），
 * 无下载权限为 108（PERMISSION_ERROR）；令牌失效则是 HTTP 401。
 */
const NOT_FOUND_CODES = new Set([101, 404])
const FORBIDDEN_CODES = new Set([108, 109, 403])

export const categorizePreviewFailure = ({
  status,
  code,
}: {
  status?: number
  code?: number
}): PreviewErrorCategory => {
  if (status === 401 || code === 401) return 'session-expired'
  if (status === 403 || (code !== undefined && FORBIDDEN_CODES.has(code)))
    return 'forbidden'
  if (status === 404 || (code !== undefined && NOT_FOUND_CODES.has(code)))
    return 'not-found'
  return 'unavailable'
}

const PREVIEW_ERROR_MESSAGE_KEYS = {
  'not-found': 'knowledge.preview.errors.notFound',
  forbidden: 'knowledge.preview.errors.forbidden',
  'session-expired': 'knowledge.preview.errors.sessionExpired',
  unsupported: 'knowledge.preview.errors.unsupported',
  unavailable: 'knowledge.preview.errors.unavailable',
} as const satisfies Record<PreviewErrorCategory, string>

/** 下载不检查空文件；读不到分类原因的失败统一提示下载失败 */
const DOWNLOAD_ERROR_MESSAGE_KEYS = {
  'not-found': 'knowledge.preview.downloadErrors.notFound',
  forbidden: 'knowledge.preview.downloadErrors.forbidden',
  'session-expired': 'knowledge.preview.downloadErrors.sessionExpired',
  unsupported: 'knowledge.preview.downloadErrors.failed',
  unavailable: 'knowledge.preview.downloadErrors.failed',
} as const satisfies Record<PreviewErrorCategory, string>

export const previewErrorMessageKey = (category: PreviewErrorCategory) =>
  PREVIEW_ERROR_MESSAGE_KEYS[category]

export const documentDownloadErrorMessageKey = (
  category: PreviewErrorCategory,
) => DOWNLOAD_ERROR_MESSAGE_KEYS[category]
