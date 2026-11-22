import { modelIdSchema } from '@/api/llm-provider-types'
import {
  getLLMModelLabel,
  isLLMModelEnabled,
  type MyLLMProvider,
} from '@/stores/model'
import { LayoutRecognizeOptions } from '@/types/knowledge-form'

export interface PDFParserOption {
  value: string
  label: string
  kind: 'builtin' | 'ocr' | 'vision'
  provider?: string
}

export function buildPDFParserOptions(
  configured: MyLLMProvider,
): PDFParserOption[] {
  const options: PDFParserOption[] = LayoutRecognizeOptions.map((option) => ({
    ...option,
    kind: 'builtin',
  }))
  const seen = new Set(options.map((option) => option.value))
  for (const [provider, data] of Object.entries(configured)) {
    for (const model of data.llm) {
      if (
        !isLLMModelEnabled(model) ||
        (model.type !== 'ocr' && model.type !== 'image2text')
      )
        continue
      const id = modelIdSchema.safeParse(model.id)
      if (!id.success || seen.has(id.data)) continue
      seen.add(id.data)
      options.push({
        value: id.data,
        label: getLLMModelLabel(model),
        provider,
        kind: model.type === 'ocr' ? 'ocr' : 'vision',
      })
    }
  }
  return options
}
