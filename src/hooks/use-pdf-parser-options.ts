import { useQuery } from '@tanstack/react-query'
import { llmAPI } from '@/api/llm'
import { llmKeys, useFetchMyLLMs } from '@/hooks/use-llm-request'
import { buildPDFParserOptions } from '@/lib/knowledge/pdf-parser-options'

export function usePDFParserOptions() {
  const tenantModels = useFetchMyLLMs({
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
  const catalog = useQuery({
    queryKey: llmKeys.catalog(),
    queryFn: llmAPI.getModelCatalog,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
  const isLoading =
    tenantModels.isLoading ||
    tenantModels.isPending ||
    tenantModels.isPaused ||
    catalog.isFetching ||
    catalog.isPending ||
    catalog.fetchStatus === 'paused'
  const isError = tenantModels.isError || catalog.isError
  // Withhold model choices on an incomplete/failed inventory, keeping core parsers.
  const options = buildPDFParserOptions(
    !isLoading && !isError ? tenantModels.myLLMs : {},
    catalog.data ?? {},
  )
  return {
    options,
    isLoading,
    isError,
    refetch: () => Promise.all([tenantModels.refetch(), catalog.refetch()]),
  }
}
