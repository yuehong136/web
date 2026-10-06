import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Key, Plus, Search } from 'lucide-react'
import { systemAPI } from '@/api/system'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PageSizeSelector } from '@/components/ui/page-size-selector'
import {
  useApiTokens,
  usePendingApiTokens,
} from '@/hooks/use-api-token-request'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  ApiKeyActionDialog,
  type ApiKeyAction,
} from '@/pages/settings/components/api-key-action-dialog'
import { ApiKeyTable } from '@/pages/settings/components/api-key-table'
import {
  CreateApiKeyDialog,
  type CreateApiKeySubmitData,
} from '@/pages/settings/components/create-api-key-dialog'

const PAGE_SIZE_OPTIONS = [10, 20, 50]
const MAX_PAGE_BUTTONS = 5

/** A window of at most five page numbers, centred on the current page. */
const visiblePages = (page: number, totalPages: number) => {
  const count = Math.min(MAX_PAGE_BUTTONS, totalPages)
  const start = Math.min(
    Math.max(1, page - Math.floor(MAX_PAGE_BUTTONS / 2)),
    totalPages - count + 1,
  )
  return Array.from({ length: count }, (_, i) => start + i)
}

export const ApiKeyManagerDialog = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [action, setAction] = useState<ApiKeyAction | null>(null)
  const pendingTokens = usePendingApiTokens()
  const tokenQuery = useApiTokens({ enabled: open })

  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const [previousSearch, setPreviousSearch] = useState(debouncedSearch)
  if (previousSearch !== debouncedSearch) {
    setPreviousSearch(debouncedSearch)
    setPage(1)
  }
  const needle = debouncedSearch.toLowerCase()
  const filteredKeys = (tokenQuery.data ?? []).filter(
    (key) =>
      !needle ||
      key.name.toLowerCase().includes(needle) ||
      key.description?.toLowerCase().includes(needle) ||
      key.tenant_id.includes(debouncedSearch),
  )
  const total = filteredKeys.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  // Deleting the last key on the final page must not strand the view past the end.
  const currentPage = Math.min(page, totalPages)
  const apiKeys = filteredKeys.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const createKey = async ({ name, description }: CreateApiKeySubmitData) => {
    setCreating(true)
    try {
      await systemAPI.createToken({ name, description })
      setCreateOpen(false)
      void tokenQuery.refetch()
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="default"
            className="h-10 gap-space-sm border border-border/50 bg-background shadow-xs transition-colors hover:border-border"
          >
            <Key className="size-icon-sm" />
            {t('settings.apiKeys.manager.trigger')}
          </Button>
        </DialogTrigger>
        <DialogContent size="3xl" className="flex h-[80vh] flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 px-space-lg pt-space-lg pb-space-md">
            <DialogTitle className="flex items-center gap-space-sm">
              <Key className="size-icon-md" />
              {t('settings.apiKeys.manager.title')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.apiKeys.manager.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 flex-col overflow-hidden px-space-lg pb-space-md">
            <div className="mb-space-md flex shrink-0 items-center justify-between gap-space-md">
              <Input
                className="w-80"
                leftIcon={<Search className="size-icon-sm" />}
                aria-label={t('settings.apiKeys.manager.search')}
                placeholder={t('settings.apiKeys.manager.searchPlaceholder')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <Button
                onClick={() => setCreateOpen(true)}
                className="gap-space-sm"
              >
                <Plus className="size-icon-sm" />
                {t('settings.apiKeys.manager.create')}
              </Button>
            </div>

            <div className="flex-1 overflow-hidden rounded-radius-lg border border-border-default">
              <ApiKeyTable
                apiKeys={apiKeys}
                loading={tokenQuery.isFetching}
                searching={Boolean(needle)}
                pendingTokens={pendingTokens}
                onAction={setAction}
              />
            </div>
          </div>

          {total > 0 && (
            <DialogFooter className="shrink-0 justify-between px-space-lg py-space-md">
              <div className="text-sm text-text-secondary">
                {t('settings.apiKeys.manager.total', { count: total })}
              </div>
              <div className="flex items-center gap-space-md">
                <PageSizeSelector
                  pageSize={pageSize}
                  onChange={(size) => {
                    setPageSize(size)
                    setPage(1)
                  }}
                  options={PAGE_SIZE_OPTIONS}
                />
                <div className="flex items-center gap-space-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    {t('common.previousPage')}
                  </Button>
                  <div className="flex items-center gap-space-xs rounded-radius-lg bg-background-subtle p-space-xs">
                    {visiblePages(currentPage, totalPages).map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? 'default' : 'ghost'}
                        size="sm"
                        className="size-8 p-0"
                        aria-current={
                          pageNum === currentPage ? 'page' : undefined
                        }
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    {t('common.nextPage')}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <CreateApiKeyDialog
        open={createOpen}
        isLoading={creating}
        onOpenChange={setCreateOpen}
        onSubmit={createKey}
      />

      <ApiKeyActionDialog action={action} onClose={() => setAction(null)} />
    </>
  )
}
