import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { skillCoreAPI, allCoreFiles, coreFileTree } from '@/api/skill-core'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'

export const skillCoreKeys = {
  all: ['skill-core'] as const,
  spaces: () => [...skillCoreKeys.all, 'spaces'] as const,
  models: () => [...skillCoreKeys.all, 'models'] as const,
  protocols: () => [...skillCoreKeys.all, 'protocols'] as const,
  space: (id: string) => [...skillCoreKeys.all, 'space', id] as const,
  search: (space: string, query: string, page: number) =>
    [...skillCoreKeys.all, 'search', space, query, page] as const,
  children: (folder: string) =>
    [...skillCoreKeys.all, 'children', folder] as const,
  tree: (folder: string) => [...skillCoreKeys.all, 'tree', folder] as const,
  file: (id: string) => [...skillCoreKeys.all, 'file', id] as const,
  config: (space: string) => [...skillCoreKeys.all, 'config', space] as const,
}
export const useCoreModels = () =>
  useQuery({
    queryKey: skillCoreKeys.models(),
    queryFn: ({ signal }) => skillCoreAPI.models(signal),
  })
export const useCoreProtocols = () =>
  useQuery({
    queryKey: skillCoreKeys.protocols(),
    queryFn: ({ signal }) => skillCoreAPI.protocols(signal),
  })
export const useCoreSpaces = () =>
  useQuery({
    queryKey: skillCoreKeys.spaces(),
    queryFn: ({ signal }) => skillCoreAPI.spaces(signal),
    refetchInterval: (query) =>
      query.state.data?.spaces.some(
        (space) => space.status === 'deleting' && !space.delete_error,
      )
        ? 1500
        : false,
  })
export const useCoreSpace = (id: string) =>
  useQuery({
    queryKey: skillCoreKeys.space(id),
    queryFn: ({ signal }) => skillCoreAPI.space(id, signal),
    enabled: !!id,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.status === 'deleting' &&
      !query.state.data.delete_error &&
      !query.state.error
        ? 1500
        : false,
  })
export const useCoreSearch = (space: string, query: string, page: number) =>
  useQuery({
    queryKey: skillCoreKeys.search(space, query, page),
    queryFn: ({ signal }) => skillCoreAPI.search(space, query, page, signal),
    enabled: !!space && !!query.trim(),
  })
export const useCoreChildren = (folder: string) =>
  useQuery({
    queryKey: skillCoreKeys.children(folder),
    queryFn: ({ signal }) => allCoreFiles(folder, signal),
    enabled: !!folder,
  })
export const useCoreTree = (folder: string) =>
  useQuery({
    queryKey: skillCoreKeys.tree(folder),
    queryFn: ({ signal }) => coreFileTree(folder, signal),
    enabled: !!folder,
  })
export const useCoreFile = (id: string) =>
  useQuery({
    queryKey: skillCoreKeys.file(id),
    queryFn: ({ signal }) => skillCoreAPI.file(id, signal),
    enabled: !!id,
    gcTime: 0,
  })
export const useCoreConfig = (space: string) =>
  useQuery({
    queryKey: skillCoreKeys.config(space),
    queryFn: ({ signal }) => skillCoreAPI.config(space, signal),
    enabled: !!space,
  })
export function useCoreAction() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (request: () => Promise<unknown>) => request(),
    meta: { errorFeedback: MutationErrorFeedback.Local },
    retry: false,
    onSettled: () => {
      void client.invalidateQueries({ queryKey: skillCoreKeys.all })
    },
  })
}
