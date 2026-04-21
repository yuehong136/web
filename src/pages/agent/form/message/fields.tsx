import { PromptEditor } from '@/components/prompt-editor'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { Switch } from '@/components/ui/switch'
import { X } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ExportFileType } from '../../constant'
import { MemorySelectField } from '../retrieval/memory-select-field'

export function MessageContentListField() {
  const { t } = useTranslation()
  const form = useFormContext()
  const { fields, append, remove } = useFieldArray({
    name: 'content',
    control: form.control,
  })

  return (
    <FormItem>
      <FormLabel>{t('flow.msg', 'Message')}</FormLabel>
      <div className="space-y-space-md">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-space-sm">
            <FormField
              control={form.control}
              name={`content.${index}.value`}
              render={({ field: contentField }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <PromptEditor
                      value={contentField.value ?? ''}
                      onChange={contentField.onChange}
                      placeholder={t(
                        'flow.messagePlaceholder',
                        'Write the message content...',
                      )}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => remove(index)}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => append({ value: '' })}
        >
          {t('flow.addMessage', 'Add message')}
        </Button>
      </div>
      <FormMessage />
    </FormItem>
  )
}

export function WebhookResponseStatusField() {
  const { t } = useTranslation()
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('flow.webhook.status', 'Status')}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={100}
              max={599}
              {...field}
              value={field.value ?? 200}
              onChange={(event) => field.onChange(Number(event.target.value))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function MessageOutputSettings() {
  const { t } = useTranslation()
  const form = useFormContext()
  const exportOptions = Object.values(ExportFileType).map((value) => ({
    label: value.toUpperCase(),
    value,
  }))

  return (
    <>
      <FormField
        control={form.control}
        name="output_format"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.downloadFileType', 'Download file type')}</FormLabel>
            <FormControl>
              <SelectWithSearch
                value={field.value ?? ''}
                onChange={field.onChange}
                options={exportOptions}
                allowClear
                placeholder={t('common.selectPlaceholder', 'Select')}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="auto_play"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <FormLabel>{t('flow.autoPlay', 'Auto play')}</FormLabel>
            <FormControl>
              <Switch
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  )
}

export function MessageAudienceFields() {
  const { t } = useTranslation()
  const form = useFormContext()

  return (
    <>
      <MemorySelectField
        name="memory_ids"
        label={t('flow.saveToMemory', 'Save to memory')}
      />

      <FormField
        control={form.control}
        name="user_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.userId', 'User ID')}</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  )
}
