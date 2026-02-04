// src/hooks/use-profile.ts
// 参考 ragflow 的用户档案管理 hook

import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authAPI } from '@/api/auth'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores/auth'

// 时区列表 - 参考 ragflow 完整的时区列表
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

// 编辑类型
export const EditType = {
  editName: 'editName',
  editTimeZone: 'editTimeZone',
  editPassword: 'editPassword',
} as const

export type IEditType = keyof typeof EditType

// 弹窗标题
export const modalTitle: Record<IEditType, string> = {
  [EditType.editName]: '修改用户名',
  [EditType.editTimeZone]: '修改时区',
  [EditType.editPassword]: '修改密码',
}

// Profile 数据接口
interface ProfileData {
  userName: string
  timeZone: string
  currPasswd?: string
  newPasswd?: string
  confirmPasswd?: string
  avatar: string
  email: string
}

// useProfile hook
export const useProfile = () => {
  const queryClient = useQueryClient()
  const { updateUser } = useAuthStore()
  
  const [profile, setProfile] = useState<ProfileData>({
    userName: '',
    avatar: '',
    timeZone: '',
    email: '',
    currPasswd: '',
  })

  const [editType, setEditType] = useState<IEditType>(EditType.editName)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<ProfileData>>({})

  // 获取用户信息
  const { data: userInfo, isLoading: loading, refetch } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const data = await authAPI.getUserProfile()
      return data
    },
    gcTime: 0,
  })

  // 保存设置 mutation
  const { mutateAsync: saveSetting, isPending: submitLoading } = useMutation({
    mutationKey: ['saveSetting'],
    mutationFn: async (data: {
      nickname?: string
      timezone?: string
      avatar?: string
      password?: string
      new_password?: string
    }) => {
      const response = await authAPI.updateUserSettings(data)
      return response
    },
    onSuccess: (response) => {
      if (response.retcode === 0) {
        toast.success('保存成功')
        queryClient.invalidateQueries({ queryKey: ['userProfile'] })
        setIsEditing(false)
        setEditForm({})
      } else {
        // 处理业务错误
        toast.error(response.retmsg || '保存失败')
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || '保存失败，请稍后重试')
    },
  })

  // 当用户信息更新时，同步到 profile 状态和 authStore
  useEffect(() => {
    if (userInfo) {
      const newProfile = {
        userName: userInfo.nickname || '',
        timeZone: userInfo.timezone || 'UTC+8\tAsia/Shanghai',
        avatar: userInfo.avatar || '',
        email: userInfo.email || '',
        currPasswd: userInfo.password ? '********' : '',
      }
      setProfile(newProfile)

      // 同步 avatar 和 nickname 到 authStore，确保侧边栏显示正确
      updateUser({
        avatar: userInfo.avatar || '',
        nickname: userInfo.nickname || '',
      })
    }
  }, [userInfo, updateUser])

  // 打开编辑弹窗
  const handleEditClick = useCallback((type: IEditType) => {
    setEditForm(profile)
    setEditType(type)
    setIsEditing(true)
  }, [profile])

  // 关闭弹窗
  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setEditForm({})
  }, [])

  // 保存修改
  const handleSave = async (data: ProfileData) => {
    const newProfile = { ...profile, ...data }

    try {
      if (editType === EditType.editName && newProfile.userName) {
        await saveSetting({ nickname: newProfile.userName })
        setProfile(prev => ({ ...prev, userName: newProfile.userName }))
        // 同步更新 auth store
        updateUser({ nickname: newProfile.userName })
      }
      
      if (editType === EditType.editTimeZone && newProfile.timeZone) {
        await saveSetting({ timezone: newProfile.timeZone })
        setProfile(prev => ({ ...prev, timeZone: newProfile.timeZone }))
      }
      
      if (editType === EditType.editPassword && data.currPasswd && data.newPasswd) {
        await saveSetting({
          password: data.currPasswd,
          new_password: data.newPasswd,
        })
        setProfile(prev => ({ ...prev, currPasswd: '********' }))
      }
    } catch (error) {
      // 错误已在 mutation 的 onError 中处理
      console.error('Save failed:', error)
    }
  }

  // 头像上传
  const handleAvatarUpload = async (avatar: string) => {
    try {
      await saveSetting({ avatar })
      setProfile(prev => ({ ...prev, avatar }))
      // 同步更新 auth store
      updateUser({ avatar })
    } catch (error) {
      console.error('Avatar upload failed:', error)
    }
  }

  return {
    profile,
    setProfile,
    loading,
    submitLoading,
    isEditing,
    editType,
    editForm,
    handleEditClick,
    handleCancel,
    handleSave,
    handleAvatarUpload,
    refetch,
  }
}
