import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { skillsAPI } from '@/api/skills'
import type {
  AcceptedSkillOperation,
  SkillListParams,
  SkillSearchMode,
} from '@/api/skill-types'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'

export const skillKeys = {
  all: ['skill-assets'] as const,
  capabilities: () => [...skillKeys.all, 'capabilities'] as const,
  models: () => [...skillKeys.all, 'models'] as const,
  spaces: (params: SkillListParams) =>
    [...skillKeys.all, 'spaces', params] as const,
  space: (id: string) => [...skillKeys.all, 'space', id] as const,
  skills: (space: string, params: SkillListParams) =>
    [...skillKeys.space(space), 'skills', params] as const,
  skill: (space: string, skill: string) =>
    [...skillKeys.space(space), 'skill', skill] as const,
  files: (space: string, version: string) =>
    [...skillKeys.space(space), 'files', version] as const,
  file: (space: string, version: string, path: string) =>
    [...skillKeys.files(space, version), path] as const,
  config: (space: string) => [...skillKeys.space(space), 'config'] as const,
  search: (space: string, query: string, mode: SkillSearchMode, page: number) =>
    [...skillKeys.space(space), 'search', query, mode, page] as const,
  operation: (id: string) => ['skill-operation', id] as const,
}
export const useSkillCapabilities = () =>
  useQuery({
    queryKey: skillKeys.capabilities(),
    queryFn: ({ signal }) => skillsAPI.capabilities(signal),
  })
export const useSkillModels = () =>
  useQuery({
    queryKey: skillKeys.models(),
    queryFn: ({ signal }) => skillsAPI.models(signal),
  })
export const useSkillSpaces = (params: SkillListParams) =>
  useQuery({
    queryKey: skillKeys.spaces(params),
    queryFn: ({ signal }) => skillsAPI.spaces(params, signal),
  })
export const useSkillSpace = (id: string) =>
  useQuery({
    queryKey: skillKeys.space(id),
    queryFn: ({ signal }) => skillsAPI.space(id, signal),
    enabled: !!id,
  })
export const useSkills = (space: string, params: SkillListParams) =>
  useQuery({
    queryKey: skillKeys.skills(space, params),
    queryFn: ({ signal }) => skillsAPI.skills(space, params, signal),
    enabled: !!space,
  })
export const useSkillDetail = (space: string, skill: string) =>
  useQuery({
    queryKey: skillKeys.skill(space, skill),
    queryFn: ({ signal }) => skillsAPI.skill(space, skill, signal),
    enabled: !!space && !!skill,
  })
export const useSkillFiles = (space: string, version: string) =>
  useQuery({
    queryKey: skillKeys.files(space, version),
    queryFn: ({ signal }) => skillsAPI.files(space, version, signal),
    enabled: !!version,
  })
export const useSkillFile = (space: string, version: string, path: string) =>
  useQuery({
    queryKey: skillKeys.file(space, version, path),
    queryFn: ({ signal }) => skillsAPI.file(space, version, path, signal),
    enabled: !!version && !!path,
    gcTime: 0,
  })
export const useSkillConfig = (space: string) =>
  useQuery({
    queryKey: skillKeys.config(space),
    queryFn: ({ signal }) => skillsAPI.config(space, signal),
    enabled: !!space,
  })
export const useSkillSearch = (
  space: string,
  query: string,
  mode: SkillSearchMode,
  page: number,
  enabled: boolean,
) =>
  useQuery({
    queryKey: skillKeys.search(space, query, mode, page),
    queryFn: ({ signal }) => skillsAPI.search(space, query, mode, page, signal),
    enabled: !!space && enabled,
  })
export const isSkillOperationTerminal = (state: string) =>
  ['succeeded', 'partial', 'failed'].includes(state)

export function useSkillOperation(id: string) {
  const client = useQueryClient()
  const query = useQuery({
    queryKey: skillKeys.operation(id),
    queryFn: ({ signal }) => skillsAPI.operation(id, signal),
    enabled: !!id,
    refetchInterval: (current) =>
      current.state.error ||
      (current.state.data && isSkillOperationTerminal(current.state.data.state))
        ? false
        : 1500,
  })
  const state = query.data?.state
  useEffect(() => {
    if (state && isSkillOperationTerminal(state))
      void client.invalidateQueries({ queryKey: skillKeys.all })
  }, [client, id, state])
  return query
}

export function useSkillAction(
  onAccepted?: (operation: AcceptedSkillOperation) => void,
) {
  const client = useQueryClient()
  const keys = useRef(new Map<string, string>())
  const mutation = useMutation({
    mutationFn: (request: () => Promise<unknown>) => request(),
    meta: { errorFeedback: MutationErrorFeedback.Local },
    retry: false,
    onError: () => {
      void client.invalidateQueries({ queryKey: skillKeys.all })
    },
    onSuccess: (result) => {
      void client.invalidateQueries({ queryKey: skillKeys.all })
      if (result && typeof result === 'object' && 'operation_id' in result) {
        keys.current.clear()
        const operation = result as AcceptedSkillOperation
        void client.invalidateQueries({
          queryKey: skillKeys.operation(operation.operation_id),
        })
        onAccepted?.(operation)
      }
    },
  })
  return {
    ...mutation,
    requestKey: (intent: string) => {
      const key = keys.current.get(intent) || crypto.randomUUID()
      keys.current.set(intent, key)
      return key
    },
  }
}
