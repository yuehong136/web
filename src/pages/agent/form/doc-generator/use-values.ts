import { useMemo } from 'react'
import { initialDocGeneratorValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import type { RAGFlowNodeType } from '../../types'

const supportedOutputFormats = ['pdf', 'docx', 'txt', 'markdown', 'html']

export function useDocGeneratorValues(node?: RAGFlowNodeType) {
  const values = useFormValues(initialDocGeneratorValues, node)

  return useMemo(() => {
    const outputFormat = String(values.output_format || '')

    return {
      output_format: supportedOutputFormats.includes(outputFormat)
        ? outputFormat
        : initialDocGeneratorValues.output_format,
      content: String(values.content || ''),
      filename: String(values.filename || ''),
      header_text: String(values.header_text || ''),
      footer_text: String(values.footer_text || ''),
      watermark_text: String(values.watermark_text || ''),
      add_page_numbers: Boolean(values.add_page_numbers),
      add_timestamp: Boolean(values.add_timestamp),
      font_size: Math.max(12, Number(values.font_size) || 12),
      outputs: initialDocGeneratorValues.outputs,
    }
  }, [values])
}
