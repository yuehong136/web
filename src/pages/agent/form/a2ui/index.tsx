import { PromptEditor } from '@/components/prompt-editor'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Clipboard, Plus, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { toast } from '@/lib/toast'
import { copyToClipboard } from '@/lib/utils'
import type { INextOperatorForm } from '../../types'
import { FormWrapper } from '../components'
import { A2UIBasicCatalogId } from '../../constant'
import {
  A2UI_AGENT_PROMPT_TEMPLATE,
  A2UI_BASIC_COMPONENTS,
  A2UI_UNSUPPORTED_COMPONENT_HINTS,
} from './catalog'
import { useA2UIFormValues, useWatchA2UIFormChange } from './hooks'

const a2uiSchema = z.object({
  commands: z.array(z.object({ value: z.string() })).optional(),
})

export function A2UIForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const values = useA2UIFormValues(node)
  const form = useForm({
    resolver: zodResolver(a2uiSchema),
    defaultValues: values,
  })
  const { fields, append, remove } = useFieldArray({
    name: 'commands',
    control: form.control,
  })

  useWatchA2UIFormChange(node?.id, form)

  const handleCopyPrompt = useCallback(async () => {
    try {
      await copyToClipboard(A2UI_AGENT_PROMPT_TEMPLATE)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
      toast.error(t('common.copyFailed', 'Copy failed'))
    }
  }, [t])

  return (
    <Form {...form}>
      <FormWrapper>
        <FormItem>
          <FormLabel>A2UI Commands</FormLabel>
          <div className="space-y-space-sm rounded-radius-md bg-surface-secondary p-space-sm border border-border-subtle text-xs leading-5 text-text-secondary">
            <p>
              v0.9 raw JSON array / JSONL only. Catalog: {A2UIBasicCatalogId}.
              Required: createSurface, updateComponents, root component id.
            </p>
            <p>Supported components: {A2UI_BASIC_COMPONENTS.join(', ')}.</p>
            <p>Do not use: {A2UI_UNSUPPORTED_COMPONENT_HINTS.join('; ')}.</p>
          </div>
          <div className="space-y-space-md">
            {fields.map((field, index) => (
              <div key={field.id} className="gap-space-sm flex items-start">
                <FormField
                  control={form.control}
                  name={`commands.${index}.value`}
                  render={({ field: commandField }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <PromptEditor
                          value={commandField.value ?? ''}
                          onChange={commandField.onChange}
                          nodeId={node?.id}
                          placeholder="Paste canonical A2UI v0.9 commands..."
                        />
                      </FormControl>
                      <FormMessage />
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
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => append({ value: '' })}
          >
            <Plus className="size-4" />
            Add command block
          </Button>
          <div className="space-y-space-sm rounded-radius-md bg-surface-secondary p-space-sm border border-border-subtle">
            <div className="gap-space-sm flex items-center justify-between">
              <FormLabel>Agent prompt template</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPrompt}
              >
                <Clipboard className="size-4" />
                {copied
                  ? t('common.copied', 'Copied')
                  : t('flow.copyAgentPrompt', 'Copy agent prompt')}
              </Button>
            </div>
            <pre className="rounded-radius-sm bg-surface-primary p-space-sm max-h-60 overflow-auto whitespace-pre-wrap text-xs leading-5 text-text-secondary">
              {A2UI_AGENT_PROMPT_TEMPLATE}
            </pre>
          </div>
        </FormItem>
      </FormWrapper>
    </Form>
  )
}
