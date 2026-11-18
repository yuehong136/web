import { useState } from 'react'
import { KeyRound, Plus, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  GatewayCatalog,
  GatewayKey,
  GatewayKeyStatus,
} from '@/api/model-gateway'
import { PageEmptyState } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PREFIX } from '../../utils'
import { KeyRow } from './key-row'

const STATUSES: GatewayKeyStatus[] = ['active', 'disabled', 'revoked']

interface KeysPanelProps {
  keys: GatewayKey[]
  catalog: GatewayCatalog
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
}

/** Gateway keys by status: who may call which models, within which limits. */
export function KeysPanel({
  keys,
  catalog,
  selectedId,
  onSelect,
  onCreate,
}: KeysPanelProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<GatewayKeyStatus>('active')
  const [search, setSearch] = useState('')
  // The detail panel shows the last use; the list makes room for it.
  const compact = selectedId !== null
  const query = search.trim().toLowerCase()
  const shown = keys.filter(
    (key) =>
      key.status === status &&
      (!query ||
        key.name.toLowerCase().includes(query) ||
        key.redacted_key.toLowerCase().includes(query)),
  )

  if (keys.length === 0)
    return (
      <PageEmptyState
        title={t(`${PREFIX}.keys.empty`)}
        description={t(`${PREFIX}.keys.emptyDescription`)}
        icon={<KeyRound className="size-icon-lg" aria-hidden="true" />}
        action={
          <Button
            size="sm"
            leftIcon={<Plus className="size-icon-sm" aria-hidden="true" />}
            onClick={onCreate}
          >
            {t(`${PREFIX}.keys.create`)}
          </Button>
        }
      />
    )

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-wrap items-center gap-space-sm">
        <div className="w-full sm:w-64">
          <Input
            type="search"
            inputSize="sm"
            aria-label={t(`${PREFIX}.keys.search`)}
            placeholder={t(`${PREFIX}.keys.search`)}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leftIcon={<Search className="size-icon-sm" aria-hidden="true" />}
          />
        </div>
        <SegmentedControl
          size="sm"
          aria-label={t(`${PREFIX}.keys.statusFilter`)}
          value={status}
          onValueChange={setStatus}
          options={STATUSES.map((value) => ({
            value,
            label: t(`${PREFIX}.keys.statusCount`, {
              label: t(`${PREFIX}.keyStatus.${value}`),
              value: keys.filter((key) => key.status === value).length,
            }),
          }))}
        />
      </div>

      {shown.length === 0 ? (
        <PageEmptyState
          compact
          title={t(`${PREFIX}.keys.noMatch`)}
          icon={<KeyRound className="size-icon-lg" aria-hidden="true" />}
        />
      ) : (
        <Table
          aria-label={t(`${PREFIX}.keys.listLabel`)}
          wrapperClassName="rounded-radius-lg border border-line-subtle"
        >
          <TableHeader className="bg-sunken">
            <TableRow>
              <TableHead>{t(`${PREFIX}.keys.columns.name`)}</TableHead>
              <TableHead>{t(`${PREFIX}.keys.columns.scope`)}</TableHead>
              <TableHead>{t(`${PREFIX}.keys.columns.usage`)}</TableHead>
              <TableHead>{t(`${PREFIX}.keys.columns.expiry`)}</TableHead>
              {compact ? null : (
                <>
                  <TableHead>{t(`${PREFIX}.keys.columns.lastUsed`)}</TableHead>
                  <TableHead className="w-8">
                    <span className="sr-only">
                      {t(`${PREFIX}.common.more`)}
                    </span>
                  </TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((key) => (
              <KeyRow
                key={key.id}
                gatewayKey={key}
                catalog={catalog}
                selected={key.id === selectedId}
                compact={compact}
                onSelect={() => onSelect(key.id)}
              />
            ))}
          </TableBody>
        </Table>
      )}
      <p className="text-xs text-fg-subtle">{t(`${PREFIX}.keys.selectHint`)}</p>
    </div>
  )
}
