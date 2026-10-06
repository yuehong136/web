import {
  buildLLMValue,
  isLLMModelEnabled,
  type LLMCatalog,
  type MyLLMProvider,
} from '@/stores/model'
import { LayoutRecognizeOptions } from '@/types/knowledge-form'

export interface PDFParserOption {
  value: string
  label: string
  kind: 'builtin' | 'ocr' | 'vision'
  provider?: string
}

/** MultiRAG 10c2f922: only these OCR suffixes route to named PDF parsers. */
const namedOCRProviders = new Set(['MinerU', 'PaddleOCR'])

export function buildPDFParserOptions(
  configured: MyLLMProvider,
  catalog: LLMCatalog,
): PDFParserOption[] {
  const options: PDFParserOption[] = LayoutRecognizeOptions.map((option) => ({
    ...option,
    kind: 'builtin',
  }))
  const seen = new Set(options.map((option) => option.value))
  for (const [provider, data] of Object.entries(configured)) {
    for (const model of data.llm ?? []) {
      // /list can reintroduce disabled rows; tenant status is authoritative.
      if (model.status !== '1' || !model.name || !isLLMModelEnabled(model))
        continue
      const kind =
        model.type === 'ocr' && namedOCRProviders.has(provider)
          ? 'ocr'
          : model.type === 'image2text' && !namedOCRProviders.has(provider)
            ? 'vision'
            : null
      if (!kind) continue
      const available = (catalog[provider] ?? []).some(
        (entry) =>
          entry.fid === provider &&
          entry.llm_name === model.name &&
          entry.available === true &&
          entry.mdl_type
            .split(',')
            .map((type) => type.trim())
            .includes(model.type),
      )
      if (!available) continue
      // Keep the full stored name, including custom deployment suffixes and @.
      const qualifiedModel = buildLLMValue(model.name, provider)
      // The OCR route consumes one suffix before looking up the tenant model.
      // Retain a second qualifier to disambiguate factories and names containing @.
      const value =
        kind === 'ocr' ? `${qualifiedModel}@${provider}` : qualifiedModel
      if (seen.has(value)) continue
      seen.add(value)
      options.push({ value, label: model.name, provider, kind })
    }
  }
  return options
}
