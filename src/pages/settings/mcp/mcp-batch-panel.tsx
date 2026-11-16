import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Copy, Download, Trash2, Upload } from 'lucide-react'
import { mcpAPI } from '@/api/mcp'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { mcpQueryKeys, useDeleteMCPServer } from '@/hooks/use-mcp-request'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import { toast } from '@/lib/toast'
import { getCurrentLanguage } from '@/locales/i18n'
import type { ImportMCPServerRequest } from '@/types/mcp'
import { downloadJson } from './mcp-utils'

type Operation = {
  kind: 'import' | 'export' | 'delete'
  success: boolean
  count: number
  at: Date
}

function Group({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-space-sm border-t border-border-subtle pt-space-base first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {description ? (
          <p className="text-xs text-text-secondary">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/**
 * Batch work on the servers selected in the list (export, delete) plus
 * importing a JSON configuration. The history covers this visit only.
 */
export function MCPBatchPanel({
  selectedIds,
  onSelectionCleared,
}: {
  selectedIds: string[]
  onSelectionCleared: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const deleteMutation = useDeleteMCPServer()
  const [importText, setImportText] = useState('')
  const [importInvalid, setImportInvalid] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [history, setHistory] = useState<Operation[]>([])
  const count = selectedIds.length
  const record = (operation: Omit<Operation, 'at'>) =>
    setHistory((previous) =>
      [{ ...operation, at: new Date() }, ...previous].slice(0, 10),
    )

  const runImport = async () => {
    // The server validates each entry; the client only checks the shape.
    let servers: ImportMCPServerRequest['mcpServers']
    try {
      const parsed: unknown = JSON.parse(importText)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new TypeError('not an object')
      servers = parsed as ImportMCPServerRequest['mcpServers']
    } catch {
      setImportInvalid(true)
      return
    }
    const total = Object.keys(servers).length
    setImporting(true)
    try {
      await mcpAPI.import({ mcpServers: servers })
      await queryClient.invalidateQueries({ queryKey: mcpQueryKeys.servers() })
      setImportText('')
      record({ kind: 'import', success: true, count: total })
      toast.success(t('mcp.batch.imported', { count: total }))
    } catch {
      record({ kind: 'import', success: false, count: total })
      toast.error(t('mcp.batch.importFailed'))
    } finally {
      setImporting(false)
    }
  }

  const runExport = async () => {
    setExporting(true)
    try {
      const result = await mcpAPI.export({ mcp_ids: selectedIds })
      setExported(JSON.stringify(result.mcpServers, null, 2))
      record({ kind: 'export', success: true, count })
    } catch {
      record({ kind: 'export', success: false, count })
      toast.error(t('mcp.batch.exportFailed'))
    } finally {
      setExporting(false)
    }
  }

  const runDelete = async () => {
    try {
      await deleteMutation.mutateAsync(selectedIds)
      record({ kind: 'delete', success: true, count })
      setConfirmDelete(false)
      onSelectionCleared()
    } catch {
      // The domain mutation reports the failure; keep the dialog for retry.
      record({ kind: 'delete', success: false, count })
    }
  }

  const time = new Intl.DateTimeFormat(getCurrentLanguage(), {
    timeStyle: 'short',
  })
  const importId = 'mcp-batch-import'
  return (
    <div className="flex flex-col gap-space-base">
      <Group
        title={t('mcp.batch.selectedServers', { count })}
        description={count ? undefined : t('mcp.batch.selectHint')}
      >
        <div className="flex flex-wrap gap-space-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={count === 0}
            loading={exporting}
            leftIcon={<Download className="size-icon-sm" aria-hidden="true" />}
            onClick={() => void runExport()}
          >
            {t('mcp.batch.export')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={count === 0}
            leftIcon={<Trash2 className="size-icon-sm" aria-hidden="true" />}
            onClick={() => setConfirmDelete(true)}
          >
            {t('mcp.batch.delete')}
          </Button>
        </div>
        {exported ? (
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="flex-1 text-xs font-medium text-text-secondary">
                {t('mcp.batch.exportResult')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Copy className="size-icon-sm" aria-hidden="true" />}
                onClick={() =>
                  void copyToClipboardWithFeedback(
                    exported,
                    t('common.copied'),
                    t('common.copyFailed'),
                  )
                }
              >
                {t('common.copy')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={
                  <Download className="size-icon-sm" aria-hidden="true" />
                }
                onClick={() =>
                  downloadJson(exported, `mcp-servers-${Date.now()}.json`)
                }
              >
                {t('mcp.batch.download')}
              </Button>
            </div>
            <Textarea
              readOnly
              value={exported}
              rows={8}
              aria-label={t('mcp.batch.exportResult')}
              className="font-mono text-xs"
            />
          </div>
        ) : null}
      </Group>

      <Group
        title={t('mcp.batch.import')}
        description={t('mcp.batch.importHint')}
      >
        <Label htmlFor={importId} className="sr-only">
          {t('mcp.batch.importLabel')}
        </Label>
        <Textarea
          id={importId}
          value={importText}
          rows={8}
          className="font-mono text-xs"
          placeholder={t('mcp.batch.importPlaceholder')}
          aria-invalid={importInvalid}
          aria-describedby={importInvalid ? `${importId}-error` : undefined}
          onChange={(event) => {
            setImportText(event.target.value)
            setImportInvalid(false)
          }}
        />
        {importInvalid ? (
          <p
            id={`${importId}-error`}
            role="alert"
            className="text-xs text-status-error"
          >
            {t('mcp.batch.importInvalid')}
          </p>
        ) : null}
        <div>
          <Button
            size="sm"
            disabled={!importText.trim()}
            loading={importing}
            leftIcon={<Upload className="size-icon-sm" aria-hidden="true" />}
            onClick={() => void runImport()}
          >
            {t('mcp.batch.importAction')}
          </Button>
        </div>
      </Group>

      {history.length ? (
        <Group title={t('mcp.batch.history')}>
          <ul className="flex flex-col">
            {history.map((operation, index) => (
              <li
                key={`${operation.at.getTime()}-${index}`}
                className="flex items-center gap-space-sm border-t border-border-subtle py-space-xs text-xs first:border-t-0"
              >
                <span
                  aria-hidden="true"
                  className={
                    operation.success
                      ? 'size-1.5 shrink-0 rounded-radius-full bg-status-success'
                      : 'size-1.5 shrink-0 rounded-radius-full bg-status-error'
                  }
                />
                <span className="min-w-0 flex-1 text-text-secondary">
                  {t(
                    `mcp.batch.operations.${operation.kind}.${
                      operation.success ? 'success' : 'failed'
                    }`,
                    { count: operation.count },
                  )}
                </span>
                <time
                  dateTime={operation.at.toISOString()}
                  className="text-text-tertiary tabular-nums"
                >
                  {time.format(operation.at)}
                </time>
              </li>
            ))}
          </ul>
        </Group>
      ) : null}

      <ConfirmDialog
        variant="destructive"
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setConfirmDelete(false)
        }}
        title={t('mcp.batch.deleteTitle', { count })}
        description={t('mcp.batch.deleteDescription', { count })}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('mcp.batch.delete')}
        pending={deleteMutation.isPending}
        onConfirm={() => void runDelete()}
      />
    </div>
  )
}
