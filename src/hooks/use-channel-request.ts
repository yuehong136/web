import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { channelAPI, type ChannelMutationPayload } from '@/api/channel'

export const channelKeys = {
  all: ['channels'] as const,
  providers: () => [...channelKeys.all, 'providers'] as const,
  lists: () => [...channelKeys.all, 'list'] as const,
  list: () => [...channelKeys.lists()] as const,
  details: () => [...channelKeys.all, 'detail'] as const,
  detail: (id: string) => [...channelKeys.details(), id] as const,
  runtime: (id: string) => [...channelKeys.detail(id), 'runtime'] as const,
}

export const useFetchChannelProviders = () =>
  useQuery({
    queryKey: channelKeys.providers(),
    queryFn: channelAPI.listProviders,
    staleTime: 5 * 60 * 1000,
  })

export const useFetchChannels = () =>
  useQuery({
    queryKey: channelKeys.list(),
    queryFn: channelAPI.list,
    staleTime: 10 * 1000,
  })

export const useFetchChannelDetail = (id: string | null) =>
  useQuery({
    queryKey: channelKeys.detail(id ?? ''),
    queryFn: () => channelAPI.get(id ?? ''),
    enabled: Boolean(id),
  })

export const useFetchChannelRuntime = (id: string | null, enabled = true) =>
  useQuery({
    queryKey: channelKeys.runtime(id ?? ''),
    queryFn: () => channelAPI.runtime(id ?? ''),
    enabled: Boolean(id) && enabled,
    refetchInterval: 15 * 1000,
  })

interface SaveChannelVariables {
  id?: string
  payload: ChannelMutationPayload
}

export const saveChannel = async ({ id, payload }: SaveChannelVariables) => {
  if (!id) {
    const provider = payload.connection.channel
    if (!provider) throw new Error('Channel provider is required.')
    return channelAPI.create({
      ...payload.connection,
      channel: provider,
      binding: payload.binding,
      status: 0,
    })
  }

  return channelAPI.update(id, {
    ...payload.connection,
    binding: payload.binding,
  })
}

export const useSaveChannel = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveChannel,
    onSuccess: (channel) => {
      queryClient.setQueryData(channelKeys.detail(channel.id), channel)
      void queryClient.invalidateQueries({ queryKey: channelKeys.lists() })
    },
  })
}

export const useSetChannelEnabled = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      enabled ? channelAPI.enable(id) : channelAPI.disable(id),
    onSuccess: (channel) => {
      queryClient.setQueryData(channelKeys.detail(channel.id), channel)
      void queryClient.invalidateQueries({ queryKey: channelKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: channelKeys.runtime(channel.id),
      })
    },
  })
}

export const useDeleteChannel = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: channelAPI.remove,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: channelKeys.lists() })
    },
  })
}
