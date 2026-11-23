import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Eye, EyeOff, KeyRound, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/lib/toast'
import { copyToClipboard } from '@/lib/utils'
import { maskSecret, type CreateModeVariable } from './environment-variables'

export type { CreateModeVariable } from './environment-variables'

interface CreateModeVariablesTableProps {
  variables: CreateModeVariable[]
  onVariablesChange: (variables: CreateModeVariable[]) => void
}

/** Variables of an environment that is still being created (kept locally until saved). */
export function CreateModeVariablesTable({
  variables,
  onVariablesChange,
}: CreateModeVariablesTableProps) {
  const { t } = useTranslation()
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>(
    {},
  )

  const toggleVisibility = (id: string) =>
    setVisibilityMap((prev) => ({ ...prev, [id]: !prev[id] }))

  const copyValue = async (value: string) => {
    try {
      await copyToClipboard(value)
      toast.success(t('environment.variables.copied'))
    } catch {
      toast.error(t('environment.variables.copyFailed'))
    }
  }

  // Nothing is saved yet, so removing needs no confirmation.
  const removeVariable = (id: string) => {
    onVariablesChange(variables.filter((v) => v.id !== id))
    toast.success(t('environment.variables.removed'))
  }

  return (
    <div className="overflow-hidden rounded-radius-lg border border-line-subtle">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('environment.variables.columns.name')}</TableHead>
            <TableHead>{t('environment.variables.columns.type')}</TableHead>
            <TableHead>{t('environment.variables.columns.value')}</TableHead>
            <TableHead className="text-center">
              {t('environment.variables.columns.secret')}
            </TableHead>
            <TableHead>
              {t('environment.variables.columns.description')}
            </TableHead>
            <TableHead className="text-center">
              {t('environment.variables.columns.actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variables.map((variable) => {
            const name = variable.key_name
            const shown = Boolean(visibilityMap[variable.id])
            return (
              <TableRow key={variable.id}>
                <TableCell>
                  <code className="font-mono text-sm text-fg">{name}</code>
                </TableCell>
                <TableCell>
                  <Badge className="font-mono">{variable.variable_type}</Badge>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="flex items-center gap-space-xs">
                    <code className="min-w-0 flex-1 truncate font-mono text-sm text-fg">
                      {variable.is_secret && !shown
                        ? maskSecret(variable.key_value)
                        : variable.key_value}
                    </code>
                    {variable.is_secret && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => toggleVisibility(variable.id)}
                        aria-label={t(
                          shown
                            ? 'environment.variables.hide'
                            : 'environment.variables.show',
                          { name },
                        )}
                        aria-pressed={shown}
                      >
                        {shown ? (
                          <EyeOff aria-hidden="true" />
                        ) : (
                          <Eye aria-hidden="true" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => copyValue(variable.key_value)}
                      aria-label={t('environment.variables.copy', { name })}
                    >
                      <Copy aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {variable.is_secret && (
                    <Badge tone="warning">
                      <KeyRound className="size-icon-xs" aria-hidden="true" />
                      {t('environment.variables.secret')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="line-clamp-2 text-sm text-fg-muted">
                    {variable.description || ''}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeVariable(variable.id)}
                    aria-label={t('environment.variables.delete', { name })}
                    className="text-danger-fg hover:bg-danger-soft hover:text-danger-fg"
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
