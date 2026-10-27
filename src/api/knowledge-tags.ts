import { APIError, apiClient } from './client'
import { knowledgeRestConfig } from './knowledge-config'

const tagsPath = (datasetId: string) =>
  `/v1/datasets/${encodeURIComponent(datasetId)}/tags`

// The list and aggregation endpoints can return tuples or `{ value, count }`.
// Normalize at the transport boundary; UI consumers never destructure wire data.
const normalizeTags = (
  data: unknown,
): Array<{ value: string; count: number }> => {
  if (!Array.isArray(data))
    throw new APIError(502, 'INVALID_TAG_LIST', 'Invalid tag list')
  return data.flatMap((tag) => {
    const value: unknown = Array.isArray(tag) ? tag[0] : tag?.value
    const count: unknown = (Array.isArray(tag) ? tag[1] : tag?.count) ?? 0
    if (typeof value !== 'string' || !value) return []
    if (typeof count !== 'number' || !Number.isFinite(count) || count < 0)
      throw new APIError(502, 'INVALID_TAG_COUNT', 'Invalid tag count')
    return [{ value, count }]
  })
}

export const knowledgeTagAPI = {
  list: async (
    datasetId: string,
  ): Promise<Array<{ name: string; count: number }>> => {
    const tags = await apiClient.get<unknown>(
      tagsPath(datasetId),
      knowledgeRestConfig,
    )
    return normalizeTags(tags).map(({ value, count }) => ({
      name: value,
      count,
    }))
  },
  aggregate: async (
    datasetIds: string[],
  ): Promise<Array<{ value: string; count: number }>> =>
    normalizeTags(
      await apiClient.get<unknown>('/v1/datasets/tags/aggregation', {
        ...knowledgeRestConfig,
        params: { dataset_ids: datasetIds.join(',') },
      }),
    ),
  rename: (
    datasetId: string,
    fromTag: string,
    toTag: string,
  ): Promise<Record<string, never>> =>
    apiClient.put(
      tagsPath(datasetId),
      { from_tag: fromTag, to_tag: toTag },
      knowledgeRestConfig,
    ),
  delete: (datasetId: string, tags: string[]): Promise<Record<string, never>> =>
    apiClient.delete(tagsPath(datasetId), {
      ...knowledgeRestConfig,
      data: { tags },
    }),
}
