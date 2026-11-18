import { useId, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  MCP_TIMEOUT_MAX,
  MCP_TIMEOUT_MIN,
  useHomeChatOptions,
} from '../hooks/use-home-chat-options'
import {
  COMPOSER_PILL,
  COMPOSER_PILL_IDLE,
  COMPOSER_PILL_ON,
} from '@/components/patterns/chat/composer-pill'

/** How the selected MCP services are called: tool-call timeout and detail. */
export function McpRunOptions({ disabled }: { disabled?: boolean }) {
  const { t } = useTranslation()
  const id = useId()
  const [open, setOpen] = useState(false)
  const timeout = useHomeChatOptions((state) => state.mcpTimeout)
  const verbose = useHomeChatOptions((state) => state.verboseToolUse)
  const setTimeoutMs = useHomeChatOptions((state) => state.setMcpTimeout)
  const setVerbose = useHomeChatOptions((state) => state.setVerboseToolUse)
  // The field keeps what is typed; the store takes the clamped value on blur.
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft !== null && draft.trim()) setTimeoutMs(Number(draft))
    setDraft(null)
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            COMPOSER_PILL,
            open ? COMPOSER_PILL_ON : COMPOSER_PILL_IDLE,
          )}
          aria-label={t('home.mcpOptions.title')}
          title={t('home.mcpOptions.title')}
        >
          <SlidersHorizontal aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-80 flex-col gap-space-md">
        <div>
          <p className="text-sm font-semibold text-fg">
            {t('home.mcpOptions.title')}
          </p>
          <p className="text-xs text-fg-subtle">
            {t('home.mcpOptions.description')}
          </p>
        </div>
        <div className="flex items-center justify-between gap-space-base">
          <div className="min-w-0">
            <Label htmlFor={`${id}-timeout`} className="text-sm">
              {t('home.mcpOptions.timeout')}
            </Label>
            <p className="text-xs text-fg-subtle">
              {t('home.mcpOptions.timeoutHint', {
                min: MCP_TIMEOUT_MIN,
                max: MCP_TIMEOUT_MAX,
              })}
            </p>
          </div>
          <Input
            id={`${id}-timeout`}
            type="number"
            inputSize="sm"
            min={MCP_TIMEOUT_MIN}
            max={MCP_TIMEOUT_MAX}
            step={100}
            value={draft ?? String(timeout)}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit()
            }}
            className="w-28 text-right font-mono"
          />
        </div>
        <div className="flex items-center justify-between gap-space-base">
          <div className="min-w-0">
            <Label htmlFor={`${id}-verbose`} className="text-sm">
              {t('home.mcpOptions.verbose')}
            </Label>
            <p className="text-xs text-fg-subtle">
              {t('home.mcpOptions.verboseHint')}
            </p>
          </div>
          <Switch
            id={`${id}-verbose`}
            checked={verbose}
            onCheckedChange={setVerbose}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
