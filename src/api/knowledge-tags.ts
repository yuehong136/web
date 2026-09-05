import { apiClient } from './client'
import { knowledgeRestConfig } from './knowledge-config'

const tagsPath = (datasetId: string) =>
  `/v1/datasets/${encodeURIComponent(datasetId)}/tags`

export const knowledgeTagAPI = {
  list: async (
    datasetId: string,
  ): Promise<Array<{ name: string; count: number }>> => {
    const tags = await apiClient.get<Array<[string, number]>>(
      tagsPath(datasetId),
      knowledgeRestConfig,
    )
    return tags.map(([name, count]) => ({ name, count }))
  },
  aggregate: (
    datasetIds: string[],
  ): Promise<Array<{ value: string; count: number }>> =>
    apiClient.get('/v1/datasets/tags/aggregation', {
      ...knowledgeRestConfig,
      params: { dataset_ids: datasetIds.join(',') },
    }),
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
