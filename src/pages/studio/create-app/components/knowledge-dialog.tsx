import React from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Table } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KnowledgeBaseAvatar } from '@/components/knowledge'
import { KNOWLEDGE_PAGE_SIZE } from '../constants'
import type { CreateAppPageController } from '../hooks/use-create-app-page'
import type { KnowledgeBase } from '@/types/api'

interface KnowledgeDialogProps {
  controller: CreateAppPageController
}

export const KnowledgeDialog: React.FC<KnowledgeDialogProps> = ({ controller }) => {
  const {
    showKnowledgeModal,
    setShowKnowledgeModal,
    availableKnowledgeBases,
    knowledgeSearch,
    setKnowledgeSearch,
    knowledgePage,
    knowledgeTotal,
    addedKnowledgeBases,
    selectedEmbdId,
    handleAddKnowledgeBase,
    handleKnowledgeSearch,
    handleKnowledgePageChange,
  } = controller

  return (
    <Dialog open={showKnowledgeModal} onOpenChange={(open) => { if (!open) setShowKnowledgeModal(false) }}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>添加知识库</DialogTitle>
        </DialogHeader>

        <div className="space-y-space-base px-6 pb-6">
          <div className="flex gap-space-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="搜索知识库名称"
                value={knowledgeSearch}
                onChange={(event) => setKnowledgeSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleKnowledgeSearch()
                  }
                }}
                className="pl-10"
              />
            </div>
            <Button onClick={handleKnowledgeSearch}>搜索</Button>
          </div>

          <div
            className="overflow-hidden rounded-radius-xl border"
            style={{
              backgroundColor: 'var(--color-components-table-bg)',
              borderColor: 'var(--color-components-table-border)',
            }}
          >
            <Table<KnowledgeBase>
              columns={[
                {
                  key: 'name',
                  title: '名称',
                  dataIndex: 'name',
                  width: 180,
                  render: (name: string, record: KnowledgeBase) => (
                    <div className="flex items-center gap-space-sm">
                      <KnowledgeBaseAvatar name={record.name} avatar={record.avatar} size="md" />
                      <span className="truncate text-text-primary">{name}</span>
                    </div>
                  ),
                },
                {
                  key: 'description',
                  title: '描述',
                  dataIndex: 'description',
                  ellipsis: true,
                  render: (description: string) => (
                    <span className="text-text-secondary">{description || '-'}</span>
                  ),
                },
                {
                  key: 'embd_id',
                  title: '向量模型',
                  dataIndex: 'embd_id',
                  width: 160,
                  render: (embdId: string) => embdId ? (
                    <Badge variant="blue" className="max-w-[140px] truncate text-xs" title={embdId}>
                      {embdId}
                    </Badge>
                  ) : (
                    <span className="text-text-tertiary">-</span>
                  ),
                },
                {
                  key: 'doc_num',
                  title: '文档个数',
                  dataIndex: 'doc_num',
                  width: 80,
                  render: (value: number) => (
                    <span className="text-text-secondary">{value || 0}</span>
                  ),
                },
                {
                  key: 'chunk_num',
                  title: '文本块个数',
                  dataIndex: 'chunk_num',
                  width: 100,
                  render: (value: number) => (
                    <span className="text-text-secondary">{value || 0}</span>
                  ),
                },
                {
                  key: 'action',
                  title: '操作',
                  width: 90,
                  render: (_: unknown, record: KnowledgeBase) => {
                    const isAdded = addedKnowledgeBases.has(record.id)
                    const isEmbdIncompatible = selectedEmbdId !== '' && record.embd_id !== selectedEmbdId

                    if (isAdded) {
                      return <Button size="sm" disabled variant="outline">已添加</Button>
                    }

                    if (isEmbdIncompatible) {
                      return (
                        <Button
                          size="sm"
                          disabled
                          variant="outline"
                          title={`向量模型不兼容：已选择 ${selectedEmbdId}，当前为 ${record.embd_id || '未知'}`}
                        >
                          不兼容
                        </Button>
                      )
                    }

                    return (
                      <Button size="sm" onClick={() => handleAddKnowledgeBase(record)}>
                        添加
                      </Button>
                    )
                  },
                },
              ]}
              data={availableKnowledgeBases}
              rowKey="id"
              hoverable
            />
          </div>

          {knowledgeTotal > KNOWLEDGE_PAGE_SIZE ? (
            <div className="flex justify-end">
              <Pagination
                current={knowledgePage}
                total={knowledgeTotal}
                pageSize={KNOWLEDGE_PAGE_SIZE}
                onChange={handleKnowledgePageChange}
              />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
