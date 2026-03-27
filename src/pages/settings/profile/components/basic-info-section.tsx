import React from 'react'
import { Save } from 'lucide-react'
import { SectionCard } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TimezoneList } from '@/hooks/use-profile'
import { ProfileFieldRow } from './profile-field-row'
import type { ProfileData, ProfileFormErrors } from '../types'

interface BasicInfoSectionProps {
  profile: ProfileData
  draft: ProfileData
  errors: ProfileFormErrors
  isEditing: boolean
  saving: boolean
  onDraftChange: (patch: Partial<ProfileData>) => void
  onCancel: () => void
  onSave: () => void
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  profile,
  draft,
  errors,
  isEditing,
  saving,
  onDraftChange,
  onCancel,
  onSave,
}) => {
  return (
    <SectionCard
      padding="lg"
      title={(
        <div className="flex flex-col gap-space-xs">
          <span className="text-base font-semibold text-text-primary">基础资料</span>
          <p className="text-sm text-text-secondary">
            这些信息会用于导航展示、资料识别和时区相关时间显示。
          </p>
        </div>
      )}
    >
      <div className="flex flex-col gap-space-lg">
        {isEditing ? (
          <>
            <div className="grid gap-space-base md:grid-cols-2">
              <Input
                label="显示名称"
                value={draft.userName}
                onChange={(event) => onDraftChange({ userName: event.target.value })}
                error={errors.userName}
                placeholder="请输入显示名称"
              />

              <div className="flex flex-col gap-space-xs">
                <label className="text-sm font-medium text-text-primary" htmlFor="profile-time-zone">
                  时区
                </label>
                <Select
                  value={draft.timeZone}
                  onValueChange={(value) => onDraftChange({ timeZone: value })}
                >
                  <SelectTrigger id="profile-time-zone">
                    <SelectValue placeholder="选择时区" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {TimezoneList.map((timezone) => (
                      <SelectItem key={timezone} value={timezone}>
                        {timezone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.timeZone ? (
                  <p className="text-sm text-text-error">{errors.timeZone}</p>
                ) : null}
              </div>
            </div>

            <ProfileFieldRow
              label="邮箱"
              value={profile.email}
              hint="登录邮箱当前不可修改，用于账户识别和安全验证。"
            />

            <div className="flex flex-wrap items-center justify-end gap-space-sm border-t border-border-subtle pt-space-lg">
              <Button variant="outline" type="button" onClick={onCancel} disabled={saving}>
                取消
              </Button>
              <Button
                type="button"
                onClick={onSave}
                loading={saving}
                leftIcon={<Save className="h-4 w-4" />}
              >
                保存更改
              </Button>
            </div>
          </>
        ) : (
          <div className="grid gap-space-base md:grid-cols-2">
            <ProfileFieldRow label="显示名称" value={profile.userName} />
            <ProfileFieldRow label="时区" value={profile.timeZone} />
            <ProfileFieldRow
              label="邮箱"
              value={profile.email}
              hint="登录邮箱当前不可修改，用于账户识别和安全验证。"
              className="md:col-span-2"
            />
          </div>
        )}
      </div>
    </SectionCard>
  )
}
