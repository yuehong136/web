import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authAPI } from '@/api/auth'
import { toast } from '@/lib/toast'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import { useAuthStore } from '@/stores/auth'
import {
  defaultProfileData,
  passwordChangeSchema,
  profileSchema,
  ProfileMode,
  type PasswordChangeFormData,
  type ProfileData,
  type ProfileFormErrors,
} from '@/pages/settings/profile/types'

// profile 域 query key 工厂（key 沿用原内联 ['userProfile']，形状不变）
export const profileKeys = {
  all: ['userProfile'] as const,
}

export const TimezoneList = [
  'UTC-12\tPacific/Kwajalein',
  'UTC-11\tPacific/Midway',
  'UTC-11\tPacific/Niue',
  'UTC-11\tPacific/Pago_Pago',
  'UTC-10\tAmerica/Adak',
  'UTC-10\tPacific/Honolulu',
  'UTC-10\tPacific/Rarotonga',
  'UTC-10\tPacific/Tahiti',
  'UTC-9\tAmerica/Anchorage',
  'UTC-9\tAmerica/Juneau',
  'UTC-9\tPacific/Gambier',
  'UTC-8\tAmerica/Los_Angeles',
  'UTC-8\tAmerica/Tijuana',
  'UTC-8\tAmerica/Vancouver',
  'UTC-7\tAmerica/Denver',
  'UTC-7\tAmerica/Phoenix',
  'UTC-6\tAmerica/Chicago',
  'UTC-6\tAmerica/Mexico_City',
  'UTC-5\tAmerica/New_York',
  'UTC-5\tAmerica/Toronto',
  'UTC-4\tAmerica/Caracas',
  'UTC-4\tAmerica/Santiago',
  'UTC-3\tAmerica/Sao_Paulo',
  'UTC-3\tAmerica/Buenos_Aires',
  'UTC-2\tAtlantic/South_Georgia',
  'UTC-1\tAtlantic/Azores',
  'UTC+0\tEurope/London',
  'UTC+0\tAtlantic/Reykjavik',
  'UTC+1\tEurope/Berlin',
  'UTC+1\tEurope/Paris',
  'UTC+2\tEurope/Helsinki',
  'UTC+2\tAfrica/Cairo',
  'UTC+3\tEurope/Moscow',
  'UTC+3\tAsia/Baghdad',
  'UTC+4\tAsia/Dubai',
  'UTC+5\tAsia/Karachi',
  'UTC+5:30\tAsia/Kolkata',
  'UTC+6\tAsia/Dhaka',
  'UTC+7\tAsia/Bangkok',
  'UTC+7\tAsia/Ho_Chi_Minh',
  'UTC+8\tAsia/Shanghai',
  'UTC+8\tAsia/Hong_Kong',
  'UTC+8\tAsia/Taipei',
  'UTC+8\tAsia/Singapore',
  'UTC+9\tAsia/Tokyo',
  'UTC+9\tAsia/Seoul',
  'UTC+10\tAustralia/Sydney',
  'UTC+10\tPacific/Guam',
  'UTC+11\tPacific/Noumea',
  'UTC+12\tPacific/Auckland',
  'UTC+12\tPacific/Fiji',
]

const getProfileFromResponse = (userInfo: {
  nickname?: string
  timezone?: string
  avatar?: string | null
  email?: string
}): ProfileData => ({
  userName: userInfo.nickname || '',
  timeZone: userInfo.timezone || defaultProfileData.timeZone,
  avatar: userInfo.avatar || '',
  email: userInfo.email || '',
})

const getFirstIssueMessage = (errors: Record<string, string[] | undefined>) => {
  const firstError = Object.values(errors).find(
    (messages) => messages && messages.length > 0,
  )
  return firstError?.[0]
}

export const useProfile = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const updateUser = useAuthStore((state) => state.updateUser)

  const [profile, setProfile] = useState<ProfileData>(defaultProfileData)
  const [draft, setDraft] = useState<ProfileData>(defaultProfileData)
  const [profileErrors, setProfileErrors] = useState<ProfileFormErrors>({})
  const [mode, setMode] = useState<ProfileMode>(ProfileMode.VIEW)

  const {
    data: userInfo,
    isLoading: loading,
    isError,
    refetch,
  } = useQuery({
    queryKey: profileKeys.all,
    queryFn: async () => authAPI.getUserProfile(),
    gcTime: 0,
  })

  const [previousUserInfo, setPreviousUserInfo] =
    useState<typeof userInfo>(undefined)
  if (previousUserInfo !== userInfo) {
    setPreviousUserInfo(userInfo)
    if (userInfo) {
      const nextProfile = getProfileFromResponse(userInfo)
      setProfile(nextProfile)
      if (mode !== ProfileMode.EDIT_PROFILE) setDraft(nextProfile)
    }
  }
  useEffect(() => {
    if (userInfo)
      updateUser({
        avatar: userInfo.avatar || '',
        nickname: userInfo.nickname || '',
      })
  }, [updateUser, userInfo])

  const saveProfileMutation = useMutation({
    mutationKey: ['saveProfile'],
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (nextProfile: ProfileData) =>
      authAPI.updateUserSettings({
        nickname: nextProfile.userName,
        timezone: nextProfile.timeZone,
        avatar: nextProfile.avatar,
      }),
  })

  const changePasswordMutation = useMutation({
    mutationKey: ['changePassword'],
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (data: PasswordChangeFormData) =>
      authAPI.updateUserSettings({
        password: data.currPasswd,
        new_password: data.newPasswd,
      }),
  })

  const startEditing = useCallback(() => {
    setDraft(profile)
    setProfileErrors({})
    setMode(ProfileMode.EDIT_PROFILE)
  }, [profile])

  const startChangingPassword = useCallback(() => {
    setMode(ProfileMode.CHANGE_PASSWORD)
  }, [])

  const cancelEditing = useCallback(() => {
    setDraft(profile)
    setProfileErrors({})
    setMode(ProfileMode.VIEW)
  }, [profile])

  const closePasswordDialog = useCallback(() => {
    setMode(ProfileMode.VIEW)
  }, [])

  const updateDraft = useCallback((patch: Partial<ProfileData>) => {
    setDraft((prev) => ({ ...prev, ...patch }))

    setProfileErrors((prev) => ({
      ...prev,
      ...(patch.userName !== undefined ? { userName: undefined } : {}),
      ...(patch.timeZone !== undefined ? { timeZone: undefined } : {}),
      ...(patch.avatar !== undefined ? { avatar: undefined } : {}),
    }))
  }, [])

  const saveProfile = useCallback(async () => {
    const parsed = profileSchema.safeParse(draft)

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors
      setProfileErrors({
        userName: flattened.userName?.[0],
        timeZone: flattened.timeZone?.[0],
        avatar: flattened.avatar?.[0],
      })

      toast.error(
        t(getFirstIssueMessage(flattened) || 'settings.profile.incomplete'),
      )
      return false
    }

    const nextProfile = { ...draft, ...parsed.data }

    try {
      const response = await saveProfileMutation.mutateAsync(nextProfile)

      if (response.retcode !== 0) {
        toast.error(t('settings.profile.saveFailed'))
        return false
      }

      setProfile(nextProfile)
      setDraft(nextProfile)
      setProfileErrors({})
      setMode(ProfileMode.VIEW)

      updateUser({
        avatar: nextProfile.avatar,
        nickname: nextProfile.userName,
      })

      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      toast.success(t('settings.profile.updated'))
      return true
    } catch {
      toast.error(t('settings.profile.saveFailed'))
      return false
    }
  }, [draft, queryClient, saveProfileMutation, updateUser, t])

  const changePassword = useCallback(
    async (data: PasswordChangeFormData) => {
      const parsed = passwordChangeSchema.safeParse(data)

      if (!parsed.success) {
        toast.error(t('settings.profile.passwordInvalid'))
        return false
      }

      try {
        const response = await changePasswordMutation.mutateAsync(parsed.data)

        if (response.retcode !== 0) {
          toast.error(t('settings.profile.passwordFailed'))
          return false
        }

        setMode(ProfileMode.VIEW)
        toast.success(t('settings.profile.passwordUpdated'))
        return true
      } catch {
        toast.error(t('settings.profile.passwordFailed'))
        return false
      }
    },
    [changePasswordMutation, t],
  )

  return useMemo(
    () => ({
      profile,
      draft,
      profileErrors,
      loading,
      isError,
      refetch,
      savingProfile: saveProfileMutation.isPending,
      changingPassword: changePasswordMutation.isPending,
      mode,
      startEditing,
      startChangingPassword,
      cancelEditing,
      closePasswordDialog,
      updateDraft,
      saveProfile,
      changePassword,
    }),
    [
      cancelEditing,
      changePassword,
      changePasswordMutation.isPending,
      closePasswordDialog,
      draft,
      loading,
      isError,
      refetch,
      mode,
      profile,
      profileErrors,
      saveProfile,
      saveProfileMutation.isPending,
      startChangingPassword,
      startEditing,
      updateDraft,
    ],
  )
}
