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
import { z } from 'zod'
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
  const [copyLabel, setCopyLabel] = useState('Copy agent prompt')
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

  const handleCopyPrompt = useCallback(() => {
    void navigator.clipboard?.writeText(A2UI_AGENT_PROMPT_TEMPLATE)
    setCopyLabel('Copied')
    window.setTimeout(() => setCopyLabel('Copy agent prompt'), 1200)
  }, [])

  return (
    <Form {...form}>
      <FormWrapper>
        <FormItem>
          <FormLabel>A2UI Commands</FormLabel>
          <div className="space-y-space-sm rounded-radius-md border border-border-subtle bg-surface-secondary p-space-sm text-xs leading-5 text-text-secondary">
            <p>
              v0.9 raw JSON array / JSONL only. Catalog: {A2UIBasicCatalogId}.
              Required: createSurface, updateComponents, root component id.
            </p>
            <p>Supported components: {A2UI_BASIC_COMPONENTS.join(', ')}.</p>
            <p>Do not use: {A2UI_UNSUPPORTED_COMPONENT_HINTS.join('; ')}.</p>
          </div>
          <div className="space-y-space-md">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-space-sm">
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
          <div className="space-y-space-sm rounded-radius-md border border-border-subtle bg-surface-secondary p-space-sm">
            <div className="flex items-center justify-between gap-space-sm">
              <FormLabel>Agent prompt template</FormLabel>
              <Button type="button" variant="outline" size="sm" onClick={handleCopyPrompt}>
                <Clipboard className="size-4" />
                {copyLabel}
              </Button>
            </div>
            <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-radius-sm bg-surface-primary p-space-sm text-xs leading-5 text-text-secondary">
              {A2UI_AGENT_PROMPT_TEMPLATE}
            </pre>
          </div>
        </FormItem>
      </FormWrapper>
    </Form>
  )
}
