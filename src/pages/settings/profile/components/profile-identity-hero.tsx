import React from 'react'
import { Camera, PencilLine } from 'lucide-react'
import { SectionCard } from '@/components/patterns'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { ProfileData } from '../types'

interface ProfileIdentityHeroProps {
  profile: ProfileData
  draft: ProfileData
  isEditing: boolean
  saving: boolean
  onEdit: () => void
  onAvatarChange: (avatar: string) => void
}

const getInitial = (value: string) => value.trim().charAt(0).toUpperCase() || 'U'

export const ProfileIdentityHero: React.FC<ProfileIdentityHeroProps> = ({
  profile,
  draft,
  isEditing,
  saving,
  onEdit,
  onAvatarChange,
}) => {
  const currentProfile = isEditing ? draft : profile

  return (
    <SectionCard padding="lg">
      <div className="flex flex-col gap-space-lg lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-space-lg sm:flex-row sm:items-center">
          <div className="shrink-0">
            {isEditing ? (
              <AvatarUpload
                value={draft.avatar}
                onChange={onAvatarChange}
                size={96}
                loading={saving}
                tips=""
              />
            ) : (
              <Avatar className="h-24 w-24 rounded-radius-xl border border-border-subtle shadow-sm">
                <AvatarImage src={profile.avatar || undefined} alt={profile.userName || profile.email} />
                <AvatarFallback className="rounded-radius-xl bg-surface-accent text-lg font-semibold text-text-on-accent">
                  {getInitial(profile.userName || profile.email)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          <div className="min-w-0 flex-1 flex flex-col gap-space-sm">
            <div className="flex flex-col gap-space-xs">
              <p className="text-sm font-medium text-text-secondary">账户身份</p>
              <h2 className="text-2xl font-semibold text-text-primary">
                {currentProfile.userName || '未设置显示名称'}
              </h2>
              <p className="text-sm text-text-secondary">{profile.email}</p>
            </div>

            <div className="flex flex-col gap-space-xs">
              <p className="max-w-2xl text-sm text-text-secondary">
                这里集中管理您的头像、公开身份、时区信息和账户安全设置。
              </p>
              <div className="flex flex-wrap items-center gap-space-sm text-xs text-text-tertiary">
                <span className="inline-flex items-center gap-space-xs rounded-radius-full bg-background-subtle px-space-sm py-space-xs">
                  <Camera className="h-3.5 w-3.5" />
                  头像支持 JPG / PNG，最大 4MB
                </span>
                {isEditing ? (
                  <span className="inline-flex items-center rounded-radius-full bg-background-subtle px-space-sm py-space-xs text-text-secondary">
                    编辑模式已启用
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {!isEditing ? (
          <div className="flex shrink-0 items-center">
            <Button onClick={onEdit} leftIcon={<PencilLine className="h-4 w-4" />}>
              编辑资料
            </Button>
          </div>
        ) : null}
      </div>
    </SectionCard>
  )
}
