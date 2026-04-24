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
import { BeginQueryType } from '../constant'
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
  onChange,
  onUpload,
}: ShareInputFieldProps) {
  const label = field.label || field.name || fieldKey
  const required = isRequiredShareInput(field)
  const description = `${fieldKey} · ${field.type || BeginQueryType.Line}`
  const fileList = asFileList(value)

  return (
    <div className="space-y-space-sm rounded-radius-lg border border-border-default bg-surface-secondary/50 p-space-base">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div>
          <Label className="text-sm font-medium text-text-primary">
            {label}
          </Label>
          <p className="mt-space-xs text-xs text-text-secondary">
            {description}
          </p>
        </div>
        <Badge variant={required ? 'warning' : 'secondary'}>
          {required ? '必填' : '可选'}
        </Badge>
      </div>

      {field.type === BeginQueryType.Paragraph ? (
        <Textarea
          value={typeof value === 'string' ? value : ''}
          rows={4}
          disabled={disabled}
          onChange={(event) => onChange(fieldKey, event.target.value)}
          placeholder="输入文本"
        />
      ) : field.type === BeginQueryType.Options ? (
        <Select
          value={String(value ?? '')}
          onValueChange={(nextValue) => onChange(fieldKey, nextValue)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="请选择" />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((option) => (
              <SelectItem key={String(option)} value={String(option)}>
                {String(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === BeginQueryType.Boolean ? (
        <label className="flex items-center gap-space-sm text-sm text-text-primary">
          <Checkbox
            checked={Boolean(value)}
            disabled={disabled}
            onCheckedChange={(checked) => onChange(fieldKey, Boolean(checked))}
          />
          启用
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
            <div className="flex flex-wrap gap-space-xs">
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
              等待上传文件
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
          placeholder="输入内容"
        />
      )}
    </div>
  )
}
