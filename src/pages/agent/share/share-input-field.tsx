import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BeginQueryType } from '../constant'
import { PersonDataMultiSelect } from '../components/persondata-multi-select'
import { isRequiredShareInput, type ShareFormValue } from './utils'
import type {
  AgentCanvasUploadResult,
  AgentShareInputField,
} from '@/types/agent'

interface ShareInputFieldProps {
  fieldKey: string
  field: AgentShareInputField
  value: ShareFormValue
  disabled?: boolean
  /** datav workflow id（分享页为 agent id），persondata 候选项来源 */
  workflowId?: string
  /** 分享页 beta token，persondata 走公开接口 */
  betaToken?: string
  onChange: (key: string, value: ShareFormValue) => void
  onUpload: (key: string, files: FileList) => Promise<void>
}

const asFileList = (value: ShareFormValue): AgentCanvasUploadResult[] => {
  return Array.isArray(value) ? (value as AgentCanvasUploadResult[]) : []
}

export function ShareInputField({
  fieldKey,
  field,
  value,
  disabled,
  workflowId,
  betaToken,
  onChange,
  onUpload,
}: ShareInputFieldProps) {
  const { t } = useTranslation()
  const label = field.label || field.name || fieldKey
  const required = isRequiredShareInput(field)
  const description = `${fieldKey} · ${field.type || BeginQueryType.Line}`
  const fileList = asFileList(value)

  return (
    <div className="space-y-space-sm rounded-radius-lg bg-surface-secondary/50 p-space-base border border-border-default">
      <div className="gap-space-sm flex flex-wrap items-center justify-between">
        <div>
          <Label className="text-sm font-medium text-text-primary">
            {label}
          </Label>
          <p className="mt-space-xs text-xs text-text-secondary">
            {description}
          </p>
        </div>
        <Badge variant={required ? 'warning' : 'secondary'}>
          {required
            ? t('agent.share.required', 'Required')
            : t('agent.share.optional', 'Optional')}
        </Badge>
      </div>

      {field.type === BeginQueryType.Paragraph ? (
        <Textarea
          value={typeof value === 'string' ? value : ''}
          rows={4}
          disabled={disabled}
          onChange={(event) => onChange(fieldKey, event.target.value)}
          placeholder={t('agent.share.inputTextPlaceholder', 'Enter text')}
        />
      ) : field.type === BeginQueryType.Options ? (
        <Select
          value={String(value ?? '')}
          onValueChange={(nextValue) => onChange(fieldKey, nextValue)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={t(
                'agent.share.selectPlaceholder',
                'Select an option',
              )}
            />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((option) => (
              <SelectItem key={String(option)} value={String(option)}>
                {String(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === BeginQueryType.PersonData ? (
        <PersonDataMultiSelect
          workflowId={workflowId}
          betaToken={betaToken}
          value={Array.isArray(value) ? (value as string[]) : []}
          disabled={disabled}
          onChange={(next) => onChange(fieldKey, next)}
        />
      ) : field.type === BeginQueryType.Boolean ? (
        <label className="gap-space-sm flex items-center text-sm text-text-primary">
          <Checkbox
            checked={Boolean(value)}
            disabled={disabled}
            onCheckedChange={(checked) => onChange(fieldKey, Boolean(checked))}
          />
          {t('agent.share.enable', 'Enable')}
        </label>
      ) : field.type === BeginQueryType.File ? (
        <div className="space-y-space-sm">
          <Input
            type="file"
            disabled={disabled}
            multiple
            onChange={(event) => {
              if (event.target.files?.length) {
                void onUpload(fieldKey, event.target.files)
              }
              event.target.value = ''
            }}
          />
          {fileList.length ? (
            <div className="gap-space-xs flex flex-wrap">
              {fileList.map((file) => (
                <Badge key={file.id || file.name} variant="outline">
                  {file.name || file.filename || file.id}
                </Badge>
              ))}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled
              className="pointer-events-none"
            >
              <Upload className="mr-space-xs h-4 w-4" />
              {t('agent.share.waitingUpload', 'Waiting for uploaded files')}
            </Button>
          )}
        </div>
      ) : (
        <Input
          type={field.type === BeginQueryType.Integer ? 'number' : 'text'}
          value={
            typeof value === 'string' || typeof value === 'number' ? value : ''
          }
          disabled={disabled}
          onChange={(event) =>
            onChange(
              fieldKey,
              field.type === BeginQueryType.Integer
                ? Number(event.target.value)
                : event.target.value,
            )
          }
          placeholder={t(
            'agent.share.inputContentPlaceholder',
            'Enter content',
          )}
        />
      )}
    </div>
  )
}
