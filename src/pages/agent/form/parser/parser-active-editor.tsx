import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  getParserMeta,
  getParserSetupSummary,
} from './constants'
import { ParserSetupBody } from './parser-setup-body'
import type { ParserFormValues } from './schema'

type ParserActiveEditorProps = {
  index: number
  showRemove: boolean
  allFileFormats: string[]
  onRemove: () => void
}

export function ParserActiveEditor({
  index,
  showRemove,
  allFileFormats,
  onRemove,
}: ParserActiveEditorProps) {
  const { t } = useTranslation()
  const { control } = useFormContext<ParserFormValues>()
  const setup = useWatch({
    control,
    name: `setups.${index}`,
  })
  const parserMeta = getParserMeta(t, setup?.fileFormat)
  const summary = getParserSetupSummary(t, setup)

  return (
    <section className="space-y-space-xl border-t border-border-subtle pt-space-xl">
      <div className="flex items-start justify-between gap-space-lg">
        <div className="min-w-0 space-y-space-md">
          <div className="flex flex-wrap items-center gap-space-sm">
            <h3 className="text-xl font-semibold leading-none text-text-primary">
              {`Parser ${index + 1}`}
            </h3>
            <span
              className={cn(
                'inline-flex items-center rounded-radius-full px-space-sm py-1 text-sm font-medium leading-none',
                parserMeta.badgeClassName,
              )}
            >
              {parserMeta.label}
            </span>
          </div>
          <div className="text-lg leading-7 text-text-secondary">
            {summary}
          </div>
        </div>

        {showRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-text-secondary hover:text-text-primary"
            onClick={onRemove}
            aria-label={t('common.delete', 'Delete')}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>

      <ParserSetupBody
        index={index}
        allFileFormats={allFileFormats}
      />
    </section>
  )
}
