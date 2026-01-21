'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Play, Trash2, Tag, AlertCircle, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { KnowledgeBase, Document } from '@/types/api'

interface ReparseConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (options: { 
    deleteChunks: boolean
    applyMetadataSettings: boolean 
  }) => void
  /** 要解析的文档列表 */
  documents: Document[]
  /** 当前知识库信息 */
  knowledgeBase: KnowledgeBase | null
  /** 是否正在处理 */
  isLoading?: boolean
}

/**
 * 解析确认弹窗
 * 
 * 参考 ragflow 的交互设计：
 * - 简洁现代的视觉风格
 * - 清晰的信息层次
 * - 卡片式选项
 */
export const ReparseConfirmModal: React.FC<ReparseConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  documents,
  knowledgeBase,
  isLoading = false,
}) => {
  // 是否清空已有 chunks
  const [deleteChunks, setDeleteChunks] = useState(true)
  // 是否应用元数据设置
  const [applyMetadataSettings, setApplyMetadataSettings] = useState(true)

  // 计算统计数据
  const stats = useMemo(() => {
    let totalChunks = 0
    let docsWithChunks = 0
    let docsWithMetadata = 0
    
    documents.forEach(doc => {
      const chunkNum = doc.chunk_num || 0
      if (chunkNum > 0) {
        totalChunks += chunkNum
        docsWithChunks++
      }
      if (doc.meta_fields && Object.keys(doc.meta_fields).length > 0) {
        docsWithMetadata++
      }
    })
    
    return { totalChunks, docsWithChunks, docsWithMetadata }
  }, [documents])

  // 检查知识库是否启用了自动元数据
  const hasMetadataEnabled = 
    knowledgeBase?.enable_metadata === true || 
    knowledgeBase?.parser_config?.enable_metadata === true
  const metadataFieldCount = knowledgeBase?.metadata_settings?.length ?? 0

  // 是否有已解析的文档
  const hasExistingChunks = stats.totalChunks > 0

  const handleConfirm = () => {
    onConfirm({ 
      deleteChunks: hasExistingChunks ? deleteChunks : false,
      applyMetadataSettings: hasMetadataEnabled ? applyMetadataSettings : false
    })
  }

  // 控制 body 滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  if (!open) return null

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-[480px] mx-4 bg-[var(--color-background-surface)] rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-primary)]/10">
              <Play className="h-4 w-4 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              开始解析
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          {/* 文档信息 */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--color-surface-secondary)]">
            <FileText className="h-5 w-5 text-[var(--color-text-secondary)]" />
            <span className="text-sm text-[var(--color-text-primary)]">
              已选择 <span className="font-semibold">{documents.length}</span> 个文档
            </span>
          </div>

          {/* 选项卡片 */}
          <div className="space-y-3">
            {/* 选项 1: 清空已有 chunks */}
            {hasExistingChunks && (
              <OptionCard
                checked={deleteChunks}
                onChange={setDeleteChunks}
                icon={<Trash2 className="h-4 w-4" />}
                iconColor="text-[var(--color-state-error)]"
                title={`清空已有的 ${stats.totalChunks} 个分块`}
                description={`${stats.docsWithChunks} 个文档已有分块数据，勾选后将清空这些数据并重新解析`}
              />
            )}

            {/* 选项 2: 应用全局自动元数据设置 - 仅当知识库启用了自动元数据时显示 */}
            {hasMetadataEnabled && (
              <OptionCard
                checked={applyMetadataSettings}
                onChange={setApplyMetadataSettings}
                icon={<Tag className="h-4 w-4" />}
                iconColor="text-[var(--color-primary)]"
                title="应用全局自动元数据设置"
                description={
                  metadataFieldCount > 0 
                    ? `知识库已配置 ${metadataFieldCount} 个元数据字段，勾选后将自动提取文档元数据`
                    : undefined
                }
                warning={
                  metadataFieldCount === 0
                    ? "尚未配置元数据字段，请先在知识库设置中添加"
                    : stats.docsWithMetadata > 0 && applyMetadataSettings
                      ? `${stats.docsWithMetadata} 个文档已有元数据，将被重新提取`
                      : undefined
                }
              />
            )}
          </div>

          {/* 无选项时的提示 */}
          {!hasExistingChunks && !hasMetadataEnabled && (
            <div className="px-4 py-3 rounded-lg bg-[var(--color-surface-secondary)] text-sm text-[var(--color-text-secondary)]">
              将使用知识库默认配置开始解析文档
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
          >
            取消
          </Button>
          <Button 
            onClick={handleConfirm} 
            loading={isLoading}
          >
            <Play className="h-4 w-4 mr-2" />
            开始解析
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

/**
 * 选项卡片组件
 */
interface OptionCardProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  icon: React.ReactNode
  iconColor?: string
  title: string
  description?: string
  warning?: string
}

const OptionCard: React.FC<OptionCardProps> = ({
  checked,
  onChange,
  disabled = false,
  icon,
  iconColor = "text-[var(--color-text-secondary)]",
  title,
  description,
  warning,
}) => {
  return (
    <div
      className={cn(
        "relative rounded-lg border transition-all duration-200",
        disabled 
          ? "border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]/50 opacity-60"
          : checked
            ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5"
            : "border-[var(--color-border-default)] bg-[var(--color-background-surface)] hover:border-[var(--color-border-accent)]"
      )}
    >
      <label 
        className={cn(
          "flex items-start gap-3 p-4",
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={(c) => !disabled && onChange(c === true)}
          disabled={disabled}
          className="mt-0.5 shrink-0"
        />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className={cn("shrink-0", iconColor)}>{icon}</span>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {title}
            </span>
          </div>
          {description && (
            <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">
              {description}
            </p>
          )}
          {warning && (
            <p className="flex items-center gap-1.5 text-xs text-[var(--color-state-warning)] leading-relaxed">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{warning}</span>
            </p>
          )}
        </div>
      </label>
    </div>
  )
}

export default ReparseConfirmModal
