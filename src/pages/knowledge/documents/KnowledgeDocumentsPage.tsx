/**
 * 文档列表页面
 *
 * 重构后的版本，使用 TanStack Query 智能轮询，无页面抖动
 */

import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useAbilities } from '@/hooks/use-abilities'
import { FileText, Upload, Plus, Search, RefreshCw, Tag } from 'lucide-react'
import {
  Button,
  Input,
  Card,
  Table,
  Modal,
  ConfirmModal,
  PageSizeSelector,
} from '@/components/ui'
import { Checkbox } from '@/components/ui/checkbox'
import { useKnowledgeStore } from '@/stores/knowledge'
import { ReparseConfirmModal, ChunkMethodModal } from '@/components/knowledge'
import { MetadataManageType as MetadataType } from '@/types/api'
import type { Document } from '@/types/api'
import { ManageMetadataModal, DocumentMetadataModal } from '../metadata'
import { useUpdateDocumentParser } from '@/hooks/use-document-request'

// 本地组件
import { FilterButton } from './document-filter-popover'
import { DocumentUploadModal } from './document-upload-modal'
import { BulkActionToolbar } from './bulk-action-toolbar'
import { useDocumentTableColumns } from './document-table-columns'
import {
  useDocumentListState,
  useFilterCollections,
  useFilterGroup,
  useDocumentActions,
  useShowLog,
} from './hooks'
import { PAGE_SIZE_OPTIONS } from './constants'
import { ProcessLogModal } from './process-log-modal'
import {
  GenerateButton,
  GenerateTaskDock,
  GenerateDeleteConfirm,
} from './generate'
import { useGenerateState } from './generate/hooks'
import { ListPageTemplate } from '@/components/page-templates'
import { PageEmptyState } from '@/components/patterns'

export const KnowledgeDocumentsPage: React.FC = () => {
  const { t } = useTranslation()
  const { id: kbId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentKnowledgeBase } = useKnowledgeStore()

  // 文档列表状态 (使用智能轮询)
  const listState = useDocumentListState()

  // 筛选器配置
  const filterCollections = useFilterCollections(listState.filterOptions)
  const filterGroup = useFilterGroup()

  // 文档操作
  const actions = useDocumentActions(kbId, () => {
    listState.clearSelection()
    listState.refetch()
  })

  // 日志弹窗
  const { showLog, hideLog, logVisible, logInfo } = useShowLog(
    listState.documents,
  )

  // 生成任务（GraphRAG / RAPTOR）
  const generate = useGenerateState(kbId || '')
  const chunkNum = currentKnowledgeBase?.chunk_num ?? 0

  // 模态框状态
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renamingDoc, setRenamingDoc] = useState<Document | null>(null)
  const [newDocName, setNewDocName] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingDocId, setDeletingDocId] = useState<string>('')
  const [reparseModalOpen, setReparseModalOpen] = useState(false)
  const [reparsingDocs, setReparsingDocs] = useState<Document[]>([])
  const [isReparsing, setIsReparsing] = useState(false)
  const [metadataModalOpen, setMetadataModalOpen] = useState(false)
  const [docMetadataModalOpen, setDocMetadataModalOpen] = useState(false)
  const [editingDocMeta, setEditingDocMeta] = useState<Document | null>(null)
  const [chunkMethodModalOpen, setChunkMethodModalOpen] = useState(false)
  const [editingParserDoc, setEditingParserDoc] = useState<Document | null>(
    null,
  )

  // 更新文档解析器 hook
  const { updateDocumentParser, isLoading: isUpdatingParser } =
    useUpdateDocumentParser()

  // 检查是否需要显示解析确认弹窗
  const needsParseConfirmation = useCallback(
    (docs: Document[]) => {
      const hasChunks = docs.some((doc) => (doc.chunk_num || 0) > 0)
      const hasMetadataEnabled =
        currentKnowledgeBase?.enable_metadata === true ||
        currentKnowledgeBase?.parser_config?.enable_metadata === true
      return hasChunks || hasMetadataEnabled
    },
    [currentKnowledgeBase],
  )

  // 开始解析处理
  const handleStartParse = useCallback(
    (doc: Document) => {
      if (needsParseConfirmation([doc])) {
        setReparsingDocs([doc])
        setReparseModalOpen(true)
      } else {
        actions.handleStartParse([doc.id], false)
      }
    },
    [needsParseConfirmation, actions],
  )

  // 批量开始解析处理
  const handleBatchStartParse = useCallback(() => {
    const docs = listState.selectedDocuments
    if (needsParseConfirmation(docs)) {
      setReparsingDocs(docs)
      setReparseModalOpen(true)
    } else {
      actions.handleStartParse(
        docs.map((d) => d.id),
        false,
      )
      listState.clearSelection()
    }
  }, [needsParseConfirmation, actions, listState])

  // 确认解析弹窗回调
  const handleConfirmParse = useCallback(
    async (options: {
      deleteChunks: boolean
      applyMetadataSettings: boolean
    }) => {
      if (reparsingDocs.length === 0) return
      setIsReparsing(true)
      try {
        await actions.handleStartParse(
          reparsingDocs.map((d) => d.id),
          options.deleteChunks,
        )
        setReparseModalOpen(false)
        setReparsingDocs([])
        listState.clearSelection()
      } finally {
        setIsReparsing(false)
      }
    },
    [reparsingDocs, actions, listState],
  )

  // 重命名处理
  const handleRename = useCallback(async () => {
    if (!renamingDoc || !newDocName) return
    await actions.handleRename(renamingDoc.id, newDocName)
    setRenameModalOpen(false)
    setRenamingDoc(null)
    setNewDocName('')
  }, [renamingDoc, newDocName, actions])

  // 删除处理
  const handleDelete = useCallback(async () => {
    if (!deletingDocId) return
    await actions.handleDelete([deletingDocId])
    setDeleteConfirmOpen(false)
    setDeletingDocId('')
  }, [deletingDocId, actions])

  // 批量删除处理
  const handleBulkDelete = useCallback(async () => {
    const docIds = Array.from(listState.selectedDocs)
    const confirmed = window.confirm(
      t('knowledge.documents.bulkDeleteConfirm', { count: docIds.length }),
    )
    if (!confirmed) return
    await actions.handleDelete(docIds)
    listState.clearSelection()
  }, [listState, actions, t])

  // 显示解析方式配置弹窗
  const handleShowChunkMethodModal = useCallback((doc: Document) => {
    setEditingParserDoc(doc)
    setChunkMethodModalOpen(true)
  }, [])

  // 提交解析方式配置
  const handleChunkMethodSubmit = useCallback(
    async (data: {
      docId: string
      parserId: string
      parserConfig?: Record<string, any>
    }) => {
      await updateDocumentParser(data)
      setChunkMethodModalOpen(false)
      setEditingParserDoc(null)
      listState.refetch()
    },
    [updateDocumentParser, listState],
  )

  // 知识库是否启用元数据
  const hasMetadataEnabled =
    currentKnowledgeBase?.enable_metadata === true ||
    currentKnowledgeBase?.parser_config?.enable_metadata === true

  const { canDownloadInTenant } = useAbilities()
  const canDownload = canDownloadInTenant(currentKnowledgeBase?.tenant_id)

  // 表格列配置
  const columns = useDocumentTableColumns({
    kbId: kbId || '',
    selectedDocs: listState.selectedDocs,
    hasMetadataEnabled,
    canDownload,
    onSelectDoc: listState.selectDoc,
    onToggleStatus: actions.handleToggleStatus,
    onStartParse: handleStartParse,
    onStopParse: (doc) => actions.handleStopParse([doc.id]),
    onRename: (doc) => {
      setRenamingDoc(doc)
      setNewDocName(doc.name)
      setRenameModalOpen(true)
    },
    onDownload: actions.handleDownload,
    onDelete: (doc) => {
      setDeletingDocId(doc.id)
      setDeleteConfirmOpen(true)
    },
    onShowLog: showLog,
    onShowChunkMethodModal: handleShowChunkMethodModal,
  })

  return (
    <ListPageTemplate
      title={t('knowledge.documents.title')}
      description={t('knowledge.documents.description')}
    >
      {/* 搜索和筛选栏 */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center space-x-4">
            <div className="max-w-md flex-1">
              <Input
                type="search"
                placeholder={t('knowledge.documents.searchPlaceholder')}
                value={listState.searchKeywords}
                onChange={(e) => listState.setSearchKeywords(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <FilterButton
              filters={filterCollections}
              value={listState.filterValue}
              onChange={listState.setFilterValue}
              filterCount={listState.filterCount}
              filterGroup={filterGroup}
              onOpenChange={(open) => {
                if (open) {
                  listState.refreshFilterOptions()
                }
              }}
            />
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={listState.refetch}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${listState.isFetching ? 'animate-spin' : ''}`}
              />
              {t('knowledge.common.refresh')}
            </Button>
            <GenerateButton
              disabled={chunkNum <= 0}
              graphStatus={generate.graph.status}
              raptorStatus={generate.raptor.status}
              graphTrace={generate.graph.traceData}
              raptorTrace={generate.raptor.traceData}
              isActionPending={generate.isActionPending}
              onRun={generate.handleRun}
              onPause={generate.handlePause}
              onDelete={generate.handleDeleteRequest}
            />
            <Button
              variant="outline"
              onClick={() => setMetadataModalOpen(true)}
            >
              <Tag className="mr-2 h-4 w-4" />
              {t('knowledge.documents.manageMetadata')}
            </Button>
            <Button onClick={() => setUploadModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              {t('knowledge.documents.import')}
            </Button>
          </div>
        </div>
      </Card>

      {/* 常驻生成任务状态区 */}
      <GenerateTaskDock
        kbId={kbId || ''}
        graphStatus={generate.graph.status}
        raptorStatus={generate.raptor.status}
        graphTrace={generate.graph.traceData}
        raptorTrace={generate.raptor.traceData}
        disabled={chunkNum <= 0}
        isActionPending={generate.isActionPending}
        onRun={generate.handleRun}
        onPause={generate.handlePause}
        onDelete={generate.handleDeleteRequest}
      />

      {/* 文档列表 */}
      {!listState.isLoading && listState.documents.length > 0 && (
        <div className="rounded-radius-lg shadow-elevation-low flex min-h-0 flex-1 flex-col overflow-hidden bg-background-surface">
          {/* 列表头部控制 */}
          <div className="border-b border-border-default px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="gap-space-md flex items-center">
                <label className="gap-space-xs flex cursor-pointer items-center">
                  <Checkbox
                    checked={listState.allSelected}
                    onCheckedChange={(checked) =>
                      listState.selectAll(checked as boolean)
                    }
                  />
                  <span className="text-sm text-text-secondary">
                    {t('knowledge.documents.selectAll')} (
                    {listState.selectedDocs.size > 0
                      ? t('knowledge.documents.selectedCount', {
                          count: listState.selectedDocs.size,
                        })
                      : t('knowledge.documents.totalDocuments', {
                          count: listState.total,
                        })}
                    )
                  </span>
                </label>
              </div>
              <div className="text-sm text-text-tertiary">
                {t('knowledge.documents.displayCount', {
                  visible: listState.documents.length,
                  total: listState.total,
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <Table<Document>
              columns={columns}
              data={listState.documents}
              rowKey="id"
              sortConfig={{
                field: listState.sortConfig.orderby,
                direction: listState.sortConfig.desc ? 'desc' : 'asc',
              }}
              onSort={(field, direction) => {
                listState.setSortConfig({
                  orderby: field,
                  desc: direction === 'desc',
                })
              }}
              striped
              hoverable
              className="min-w-full"
            />
          </div>

          {/* 分页控件 */}
          {listState.total > 0 && (
            <div className="shadow-elevation-high sticky bottom-0 border-t border-components-pagination-border bg-components-pagination-bg backdrop-blur-sm">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="text-sm text-components-pagination-text">
                  {t('knowledge.documents.totalItems', {
                    count: listState.total,
                  })}
                  {listState.selectedDocs.size > 0 &&
                    ` • ${t('knowledge.documents.selectedCount', {
                      count: listState.selectedDocs.size,
                    })}`}
                </div>

                <div className="flex items-center space-x-4">
                  <PageSizeSelector
                    pageSize={listState.pageSize}
                    onChange={(size) => {
                      listState.setPageSize(size)
                      listState.setPage(1)
                    }}
                    options={PAGE_SIZE_OPTIONS}
                  />

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => listState.setPage(listState.page - 1)}
                      disabled={listState.page <= 1}
                    >
                      {t('knowledge.documents.previousPage')}
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from(
                        {
                          length: Math.min(
                            5,
                            Math.ceil(listState.total / listState.pageSize),
                          ),
                        },
                        (_, i) => {
                          const totalPages = Math.ceil(
                            listState.total / listState.pageSize,
                          )
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (listState.page <= 3) {
                            pageNum = i + 1
                          } else if (listState.page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = listState.page - 2 + i
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={
                                listState.page === pageNum
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() => listState.setPage(pageNum)}
                              className="min-w-[32px]"
                            >
                              {pageNum}
                            </Button>
                          )
                        },
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => listState.setPage(listState.page + 1)}
                      disabled={
                        listState.page >=
                        Math.ceil(listState.total / listState.pageSize)
                      }
                    >
                      {t('knowledge.documents.nextPage')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 空状态 */}
      {!listState.isLoading && listState.documents.length === 0 && (
        <Card className="flex flex-1 items-center justify-center">
          <PageEmptyState
            title={t('knowledge.documents.emptyTitle')}
            description={t('knowledge.documents.emptyDescription')}
            icon={<FileText className="h-6 w-6" />}
            action={
              <Button onClick={() => setUploadModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('knowledge.documents.addDocument')}
              </Button>
            }
          />
        </Card>
      )}

      {/* 批量操作工具栏 */}
      <BulkActionToolbar
        selectedCount={listState.selectedDocs.size}
        onEnable={() =>
          actions.handleBulkEnable(Array.from(listState.selectedDocs))
        }
        onDisable={() =>
          actions.handleBulkDisable(Array.from(listState.selectedDocs))
        }
        onStartParse={handleBatchStartParse}
        onStopParse={() =>
          actions.handleStopParse(Array.from(listState.selectedDocs))
        }
        onDelete={handleBulkDelete}
        onClearSelection={listState.clearSelection}
        isLoading={actions.isChangingStatus || actions.isRunning}
      />

      {/* 重命名模态框 */}
      <Modal
        open={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        title={t('knowledge.documents.renameTitle')}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="newDocName"
              className="block text-sm font-medium text-text-primary"
            >
              {t('knowledge.documents.newName')}
            </label>
            <Input
              id="newDocName"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder={t('knowledge.documents.newNamePlaceholder')}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setRenameModalOpen(false)}>
              {t('knowledge.common.cancel')}
            </Button>
            <Button onClick={handleRename} loading={actions.isRenaming}>
              {t('knowledge.documents.confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 删除确认模态框 */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title={t('knowledge.documents.deleteTitle')}
        description={t('knowledge.documents.deleteDescription')}
      />

      {/* 文件上传模态框 */}
      {kbId && (
        <DocumentUploadModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          kbId={kbId}
          onSuccess={listState.refetch}
        />
      )}

      {/* Metadata 管理模态框 */}
      {kbId && (
        <ManageMetadataModal
          open={metadataModalOpen}
          onClose={() => setMetadataModalOpen(false)}
          kbId={kbId}
          mode={MetadataType.MANAGE}
          onSuccess={listState.refetch}
          onNavigateToSettings={() => {
            navigate(`/knowledge/${kbId}/settings?openMetadata=true`)
          }}
        />
      )}

      {/* 单文档 Metadata 编辑模态框 */}
      {editingDocMeta && kbId && (
        <DocumentMetadataModal
          open={docMetadataModalOpen}
          onClose={() => {
            setDocMetadataModalOpen(false)
            setEditingDocMeta(null)
          }}
          docId={editingDocMeta.id}
          docName={editingDocMeta.name}
          kbId={kbId}
          metaFields={editingDocMeta.meta_fields || {}}
          onSuccess={listState.refetch}
        />
      )}

      {/* 重新解析确认弹窗 */}
      <ReparseConfirmModal
        open={reparseModalOpen}
        onClose={() => {
          setReparseModalOpen(false)
          setReparsingDocs([])
        }}
        onConfirm={handleConfirmParse}
        documents={reparsingDocs}
        knowledgeBase={currentKnowledgeBase}
        isLoading={isReparsing}
      />

      {/* 文件详情/日志弹窗 */}
      <ProcessLogModal
        visible={logVisible}
        onClose={hideLog}
        logInfo={logInfo}
      />

      {/* 解析方式配置弹窗 */}
      <ChunkMethodModal
        open={chunkMethodModalOpen}
        onClose={() => {
          setChunkMethodModalOpen(false)
          setEditingParserDoc(null)
        }}
        document={editingParserDoc}
        onSubmit={handleChunkMethodSubmit}
        isLoading={isUpdatingParser}
      />

      {/* 生成结果删除确认弹窗 */}
      <GenerateDeleteConfirm
        open={generate.deleteConfirmOpen}
        type={generate.deletingType}
        onConfirm={generate.handleDeleteConfirm}
        onClose={generate.handleDeleteCancel}
      />
    </ListPageTemplate>
  )
}
