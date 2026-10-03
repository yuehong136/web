import { useTranslation } from 'react-i18next'
import { toast } from '@/lib/toast'
import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MultiSelectWithSearch } from '@/components/ui/multi-select-with-search'
import { useCreateSearch } from '@/hooks/use-search-request'
import { useFetchKnowledgeList } from '@/hooks/use-knowledge-request'
import { ROUTES } from '@/constants'
import { cn } from '@/lib/utils'
import { getAvatarGradient } from '@/components/ui/resource-list'
import { DEFAULT_SEARCH_CONFIG } from '../constants'

interface CreateSearchDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: (searchId: string) => void
}

const CreateSearchDialog: React.FC<CreateSearchDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { createSearch, isLoading } = useCreateSearch()
  const { knowledgeBases } = useFetchKnowledgeList({ page_size: 1000 })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [kbIds, setKbIds] = useState<string[]>([])
  const [nameError, setNameError] = useState<string | null>(null)

  const kbOptions = knowledgeBases.map((kb) => ({
    label: kb.name,
    value: kb.id,
  }))

  const resetForm = useCallback(() => {
    setName('')
    setDescription('')
    setKbIds([])
    setNameError(null)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError(t('searchPage.feedback.nameRequired'))
      return
    }
    if (kbIds.length === 0) {
      toast.error(t('searchPage.feedback.knowledgeRequired'))
      return
    }

    try {
      const result = await createSearch({
        name: trimmedName,
        description: description.trim() || undefined,
        search_config: {
          ...DEFAULT_SEARCH_CONFIG,
          kb_ids: kbIds,
          rerank_id: '',
          web_search: false,
          query_mindmap: false,
          cross_languages: [],
          meta_data_filter: {
            method: 'disabled',
            logic: 'and',
            semi_auto: [],
            manual: [],
          },
        },
      })

      toast.success(t('searchPage.feedback.createTitle'), {
        description: t('searchPage.feedback.createSuccess'),
      })
      resetForm()
      onClose()

      if (onSuccess) {
        onSuccess(result.search_id)
      } else {
        navigate(`${ROUTES.SEARCH}/${result.search_id}`)
      }
    } catch {
      toast.error(t('searchPage.feedback.createFailedTitle'), {
        description: t('searchPage.feedback.createFailed'),
      })
    }
  }, [
    t,
    name,
    description,
    kbIds,
    createSearch,
    navigate,
    resetForm,
    onClose,
    onSuccess,
  ])

  const gradient = name
    ? getAvatarGradient(name)
    : 'from-text-tertiary to-text-muted'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-0">
          <div className="mb-2 flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                'bg-linear-to-br shadow-xs',
                gradient,
              )}
            >
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>创建搜索应用</DialogTitle>
              <DialogDescription>
                配置知识库和检索参数，快速查找文档信息
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(90vh-200px)] space-y-5 overflow-y-auto px-6 py-5">
          {/* Name */}
          <div className="space-y-2">
            <Label>
              名称 <span className="text-status-error">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (nameError) setNameError(null)
              }}
              placeholder="输入搜索应用名称"
              className={cn(nameError && 'border-status-error')}
            />
            {nameError && (
              <p className="text-xs text-status-error">{nameError}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>描述</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述搜索应用的用途"
              rows={3}
            />
          </div>

          {/* Knowledge Base Selection */}
          <div className="space-y-2">
            <Label>
              知识库 <span className="text-status-error">*</span>
            </Label>
            <MultiSelectWithSearch
              options={[{ label: '知识库', options: kbOptions }]}
              value={kbIds}
              onChange={setKbIds}
              placeholder="选择关联的知识库"
              emptyText="暂无知识库"
            />
            <p className="text-xs text-text-tertiary">
              选择要搜索的知识库，支持多选
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !name.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateSearchDialog
