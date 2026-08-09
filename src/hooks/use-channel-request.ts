import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
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
    refetchInterval: 15 * 1000,
  })

/**
 * Detail feeds an open edit form, so it must not refetch underneath the admin.
 * A reconnect or window focus would swap in a fresh object and — before the
 * form's reset guard — wipe whatever had been typed, App Secret included.
 */
export const useFetchChannelDetail = (id: string | null) =>
  useQuery({
    queryKey: channelKeys.detail(id ?? ''),
    queryFn: () => channelAPI.get(id ?? ''),
    enabled: Boolean(id),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
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

/**
 * Mutation responses are a narrower projection than reads: the server builds
 * them without `include_runtime`, so `runtime` is null and `revision_stale` is
 * null regardless of the truth. Writing one into the detail cache therefore
 * erased a live runtime panel and reset the staleness warning — and, with a
 * five-minute staleTime, kept it wrong for five minutes. Invalidate instead.
 */
const invalidateChannel = (
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
) => {
  void queryClient.invalidateQueries({ queryKey: channelKeys.detail(id) })
  void queryClient.invalidateQueries({ queryKey: channelKeys.lists() })
}

export const useSaveChannel = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveChannel,
    onSuccess: (channel) => invalidateChannel(queryClient, channel.id),
  })
}

export const useSetChannelEnabled = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      enabled ? channelAPI.enable(id) : channelAPI.disable(id),
    onSuccess: (channel) => {
      invalidateChannel(queryClient, channel.id)
      void queryClient.invalidateQueries({
        queryKey: channelKeys.runtime(channel.id),
      })
    },
  })
}

/** Mirrors the server's per-channel cooldown (CHN-O6). */
export const CHANNEL_VERIFY_COOLDOWN_MS = 10 * 1000

/**
 * Run one credential self-check and keep the control disabled afterwards.
 *
 * The cooldown is the server's, re-stated here so the button greys out instead
 * of letting an admin collect `CHANNEL_VERIFICATION_THROTTLED` by clicking. It
 * is a courtesy, not the enforcement — that lives on the server, because a
 * disabled button is not a rate limit.
 *
 * Nothing is invalidated on success: this reads the provider, not our state.
 */
export const useVerifyChannel = () => {
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [, forceTick] = useState(0)

  const mutation = useMutation({
    mutationFn: channelAPI.verify,
    onSettled: () => setCooldownUntil(Date.now() + CHANNEL_VERIFY_COOLDOWN_MS),
  })

  // Re-render once when the cooldown lapses; without this the button stays
  // disabled until some unrelated render happens to come along.
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return
    const timer = setTimeout(
      () => forceTick((tick) => tick + 1),
      cooldownUntil - Date.now(),
    )
    return () => clearTimeout(timer)
  }, [cooldownUntil])

  return {
    ...mutation,
    coolingDown: cooldownUntil > Date.now(),
  }
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
