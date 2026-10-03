export const PADDLEOCR_ALGORITHMS = [
  'PaddleOCR-VL-1.5',
  'PaddleOCR-VL',
  'PP-OCRv5',
  'PP-StructureV3',
] as const

export type PaddleOCRAlgorithm = (typeof PADDLEOCR_ALGORITHMS)[number]
export const DEFAULT_PADDLEOCR_ALGORITHM: PaddleOCRAlgorithm = 'PaddleOCR-VL'

export function buildPaddleOCRParams({
  modelName,
  apiUrl,
  accessToken,
  algorithm,
}: {
  modelName: string
  apiUrl: string
  accessToken: string
  algorithm: string
}) {
  if (!modelName.trim()) {
    return { ok: false, error: 'modelNameRequired' } as const
  }
  if (!apiUrl.trim()) {
    return { ok: false, error: 'apiUrlRequired' } as const
  }
  try {
    const url = new URL(apiUrl.trim())
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
      return { ok: false, error: 'apiUrlInvalid' } as const
    }
  } catch {
    return { ok: false, error: 'apiUrlInvalid' } as const
  }
  if (!PADDLEOCR_ALGORITHMS.some((value) => value === algorithm)) {
    return { ok: false, error: 'algorithmUnsupported' } as const
  }
  const config = {
    paddleocr_api_url: apiUrl.trim(),
    paddleocr_algorithm: algorithm,
    ...(accessToken.trim()
      ? { paddleocr_access_token: accessToken.trim() }
      : {}),
  }
  return {
    ok: true,
    params: {
      llm_name: modelName.trim(),
      mdl_type: 'ocr',
      max_tokens: 0,
      llm_factory: 'PaddleOCR',
      api_key: config,
      api_base: '',
    },
  } as const
}
