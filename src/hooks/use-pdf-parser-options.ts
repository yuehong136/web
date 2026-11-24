import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { buildPDFParserOptions } from '@/lib/knowledge/pdf-parser-options'

export function usePDFParserOptions() {
  const tenantModels = useFetchMyLLMs({
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
  const isLoading =
    tenantModels.isLoading || tenantModels.isPending || tenantModels.isPaused
  const isError = tenantModels.isError
  // Withhold model choices on an incomplete/failed inventory, keeping core parsers.
  const options = buildPDFParserOptions(
    !isLoading && !isError ? tenantModels.myLLMs : {},
  )
  return {
    options,
    models: tenantModels.myLLMs,
    isLoading,
    isError,
    refetch: tenantModels.refetch,
  }
}
