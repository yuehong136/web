import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { knowledgeAPI } from '@/api/knowledge'
import { queryKeys, invalidateQueries } from '@/lib/query-client'
import { toast } from '@/lib/toast'
import type {
  MetadataBatchRequest,
  KBMetadataSettingsRequest,
  DocumentMetadataSettingsRequest,
  MetadataTableData,
  MetadataFieldDefinition,
} from '@/types/api'

// ============================================================================
// 工具函数 - Metadata 数据格式转换
// ============================================================================

/**
 * 将 API 返回的 summary 数据转换为表格数据格式
 */
type MetadataSummaryFieldValues =
  | Array<[string | number, number]>
  | {
      type?: string
      values?: Array<[string | number, number]>
    }
  | Record<string, number>
  | null
  | undefined

function normalizeSummaryValues(values: MetadataSummaryFieldValues): string[] {
  if (Array.isArray(values)) {
    return values.map(([value]) => String(value))
  }

  if (values && typeof values === 'object') {
    if ('values' in values && Array.isArray(values.values)) {
      return values.values.map(([value]) => String(value))
    }

    return Object.keys(values)
  }

  return []
}

export function summaryToTableData(
  summary: Record<string, MetadataSummaryFieldValues>
): MetadataTableData[] {
  return Object.entries(summary).map(([field, values]) => ({
    field,
    description: '',
    values: normalizeSummaryValues(values),
  }))
}

/**
 * 将表格数据转换为 JSON 格式 (用于文档 meta_fields)
 */
export function tableDataToJSON(
  data: MetadataTableData[]
): Record<string, string[]> {
  return data.reduce<Record<string, string[]>>((acc, item) => {
    acc[item.field] = item.values
    return acc
  }, {})
}

/**
 * 将表格数据转换为 Metadata 设置格式 (用于 KB/文档模板)
 */
export function tableDataToSettings(
  data: MetadataTableData[]
): MetadataFieldDefinition[] {
  return data.map((item) => ({
    key: item.field,
    description: item.description,
    enum: item.values.length > 0 ? item.values : undefined,
    restrictDefinedValues: item.restrictDefinedValues,
  }))
}

/**
 * 将 Metadata 设置转换为表格数据格式
 */
export function settingsToTableData(
  settings: MetadataFieldDefinition[]
): MetadataTableData[] {
  if (!Array.isArray(settings)) return []
  return settings.map((item) => ({
    field: item.key,
    description: item.description || '',
    values: item.enum || [],
    restrictDefinedValues: !!item.enum?.length || item.restrictDefinedValues,
  }))
}

/**
 * 将 JSON 格式的 meta_fields 转换为表格数据
 */
export function jsonToTableData(
  data: Record<string, string | string[]>
): MetadataTableData[] {
  return Object.entries(data).map(([field, value]) => {
    let values: string[] = []
    if (Array.isArray(value)) {
      values = value
    } else if (typeof value === 'string') {
      values = [value]
    } else if (value !== null && value !== undefined) {
      values = [String(value)]
    }
    return {
      field,
      description: '',
      values,
    }
  })
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * 获取知识库 Metadata 汇总
 */
export const useMetadataSummary = (kbId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.metadata.summary(kbId),
    queryFn: () => knowledgeAPI.metadata.getSummary(kbId),
    enabled: !!kbId && enabled,
  })
}

/**
 * 批量更新/删除 Metadata
 */
export const useBatchUpdateMetadata = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MetadataBatchRequest) =>
      knowledgeAPI.metadata.batchUpdate(data),
    onSuccess: (result, variables) => {
      // 使 metadata summary 缓存失效
      queryClient.invalidateQueries({
        queryKey: queryKeys.metadata.summary(variables.kb_id),
      })
      // 使文档列表缓存失效
      invalidateQueries.documents()

      const messages: string[] = []
      if (result.updated_count > 0) {
        messages.push(`更新了 ${result.updated_count} 条`)
      }
      if (result.deleted_count > 0) {
        messages.push(`删除了 ${result.deleted_count} 条`)
      }
      if (messages.length > 0) {
        toast.success(messages.join('，'))
      } else {
        toast.success('操作完成')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || '元数据更新失败')
    },
  })
}

/**
 * 更新知识库 Metadata 模板设置
 */
export const useUpdateKBMetadataSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: KBMetadataSettingsRequest) =>
      knowledgeAPI.metadata.updateKBSettings(data),
    onSuccess: (_, variables) => {
      // 使知识库详情缓存失效
      queryClient.invalidateQueries({
        queryKey: queryKeys.knowledgeBases.detail(variables.kb_id),
      })
      toast.success('元数据模板已更新')
    },
    onError: (error: any) => {
      toast.error(error.message || '元数据模板更新失败')
    },
  })
}

/**
 * 更新单文档 Metadata 模板设置
 */
export const useUpdateDocumentMetadataSettings = () => {
  return useMutation({
    mutationFn: (data: DocumentMetadataSettingsRequest) =>
      knowledgeAPI.metadata.updateDocumentSettings(data),
    onSuccess: () => {
      invalidateQueries.documents()
      toast.success('文档元数据设置已更新')
    },
    onError: (error: any) => {
      toast.error(error.message || '文档元数据设置更新失败')
    },
  })
}

/**
 * 更新单文档 Metadata 值 (meta_fields)
 */
export const useUpdateDocumentMeta = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      docId,
      meta,
      kbId: _kbId,
    }: {
      docId: string
      meta: Record<string, any>
      kbId?: string
    }) => knowledgeAPI.metadata.updateDocumentMeta(docId, meta),
    onSuccess: (_, variables) => {
      // 使文档列表缓存失效
      invalidateQueries.documents()
      // 如果提供了 kbId，也使 metadata summary 失效
      if (variables.kbId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.metadata.summary(variables.kbId),
        })
      }
      toast.success('文档元数据已更新')
    },
    onError: (error: any) => {
      toast.error(error.message || '文档元数据更新失败')
    },
  })
}
