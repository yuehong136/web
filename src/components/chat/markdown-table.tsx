import { memo, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Download, Maximize2 } from 'lucide-react'
import type { ComponentProps } from '@ant-design/x-markdown'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MessageAction } from '@/components/patterns/chat/message'
import { downloadCsvFile } from '@/lib/download'
import { toast } from '@/lib/toast'
import { copyToClipboard } from '@/lib/utils'
import { copyTableRows, readTableRows, tableToCsv } from './table-data'
import './markdown-table.css'

/**
 * A table in an answer. It keeps its natural column widths, may grow past
 * the reading column into the free space beside it, and scrolls sideways
 * inside its own frame beyond that, so it can never widen the thread.
 * Copy, CSV download and a full-size view sit over its corner; the stylesheet
 * hides them while the answer is still streaming.
 */
export const MarkdownTable = memo(function MarkdownTable({
  children,
  streamStatus = 'done',
}: ComponentProps) {
  const { t } = useTranslation()
  const table = useRef<HTMLTableElement>(null)
  const expand = useRef<HTMLButtonElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current)
    },
    [],
  )

  const rows = () => (table.current ? readTableRows(table.current) : [])
  const copy = async () => {
    try {
      await copyTableRows(rows(), copyToClipboard)
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(t('common.copyFailed'))
    }
  }

  return (
    <div className="chat-table" data-streaming={streamStatus === 'loading'}>
      {/* Focusable so the keyboard can scroll a table wider than its frame. */}
      <section
        className="chat-table-frame chat-table-scroll"
        aria-label={t('chat.table.region')}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be reachable by keyboard
        tabIndex={0}
      >
        <table ref={table} className="chat-table-grid">
          {children as ReactNode}
        </table>
      </section>
      {streamStatus !== 'loading' && (
        <div className="chat-table-actions">
          <MessageAction
            label={copied ? t('common.copied') : t('chat.table.copy')}
            onClick={() => void copy()}
          >
            {copied ? <Check /> : <Copy />}
          </MessageAction>
          <MessageAction
            label={t('chat.table.download')}
            onClick={() =>
              downloadCsvFile(tableToCsv(rows()), t('chat.table.filename'))
            }
          >
            <Download />
          </MessageAction>
          <MessageAction
            ref={expand}
            label={t('chat.table.expand')}
            onClick={() => setExpanded(true)}
          >
            <Maximize2 />
          </MessageAction>
        </div>
      )}
      {expanded && (
        <Dialog open onOpenChange={setExpanded}>
          <DialogContent size="full" modal returnFocusRef={expand}>
            <DialogHeader>
              <DialogTitle>{t('chat.table.region')}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className="chat-table-frame chat-table-expanded">
                <table className="chat-table-grid">
                  {children as ReactNode}
                </table>
              </div>
            </DialogBody>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
})
