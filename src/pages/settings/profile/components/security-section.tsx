import React from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { SectionCard } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { ProfileFieldRow } from './profile-field-row'

interface SecuritySectionProps {
  disabled?: boolean
  onChangePassword: () => void
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  disabled = false,
  onChangePassword,
}) => {
  return (
    <SectionCard
      padding="lg"
      title={
        <div className="gap-space-xs flex flex-col">
          <span className="text-base font-semibold text-text-primary">
            安全信息
          </span>
          <p className="text-sm text-text-secondary">
            与登录和账户保护相关的操作集中放在这里，避免与基础资料混排。
          </p>
        </div>
      }
      actions={
        <Button
          variant="outline"
          type="button"
          onClick={onChangePassword}
          disabled={disabled}
          leftIcon={<LockKeyhole className="h-4 w-4" />}
        >
          修改密码
        </Button>
      }
    >
      <div className="gap-space-base grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <ProfileFieldRow
          label="密码"
          value="已设置密码"
          hint="如需提升安全性，建议定期更新密码，并避免与其他服务复用相同密码。"
        />
        <div className="flex items-start justify-start md:justify-end">
          <div className="gap-space-xs rounded-radius-full px-space-base py-space-sm inline-flex items-center bg-background-subtle text-sm text-text-secondary">
            <ShieldCheck className="h-4 w-4 text-status-success" />
            账户安全设置集中管理
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
