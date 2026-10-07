/**
 * 引用详情侧栏的检索诊断区：检索匹配评分（含向量 / 词汇分项）、定位数据与
 * 各类 ID。评分是检索阶段的排序分，量纲随应用的检索设置（混合权重、重排模型）
 * 变化，不代表可信度，所以只在这里展示；角标浮层和来源面板不展示评分。
 * 评分没有颜色分档，状态全部用文字表达（缺失或无效显示“不可用”）。
 */
import { useId, useState, type ReactNode } from 'react'
import {
  Check,
  Copy,
  Database,
  FileText,
  Hash,
  Image,
  MapPin,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/lib/toast'
import { cn, copyToClipboard } from '@/lib/utils'
import { getCurrentLanguage } from '@/locales/i18n'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { truncateId } from './reference-meta'
import { formatRetrievalScore, readRetrievalScore } from './reference-score'

interface ReferenceDiagnosticsProps {
  chunk: ReferenceChunk
  /** 复制 ID 成功回调 */
  onCopySuccess?: () => void
}

export function ReferenceDiagnostics({
  chunk,
  onCopySuccess,
}: ReferenceDiagnosticsProps) {
  const { t } = useTranslation()
  const headingId = useId()
  const locale = getCurrentLanguage()
  const score = readRetrievalScore(chunk.similarity)
  // 有限数字却超出 0–1（如知识库设了 PageRank，排序加权叠加到综合分上）：
  // 评分仍算不可用，另行写出原始值，排查时不丢信息
  const rawScore =
    score === null &&
    typeof chunk.similarity === 'number' &&
    Number.isFinite(chunk.similarity)
      ? chunk.similarity
      : null
  const subScores = [
    {
      key: 'vector',
      label: t('reference.diagnostics.vectorScore'),
      value: readRetrievalScore(chunk.vector_similarity),
    },
    {
      key: 'term',
      label: t('reference.diagnostics.termScore'),
      value: readRetrievalScore(chunk.term_similarity),
    },
  ].filter(
    (item): item is typeof item & { value: number } => item.value !== null,
  )
  // 定位数据只原样展示：PDF 切片是页码加坐标，其他文档是切片序号，联网结果为空；
  // 原文预览不会定位到片段，这里也不把它解释成页码
  const positions =
    Array.isArray(chunk.positions) && chunk.positions.length > 0
      ? JSON.stringify(chunk.positions)
      : null
  const ids = [
    {
      key: 'chunk',
      icon: <Hash aria-hidden className="size-icon-xs" />,
      label: t('reference.diagnostics.chunkId'),
      value: chunk.id,
    },
    {
      key: 'document',
      icon: <FileText aria-hidden className="size-icon-xs" />,
      label: t('reference.diagnostics.documentId'),
      value: chunk.document_id,
    },
    {
      key: 'dataset',
      icon: <Database aria-hidden className="size-icon-xs" />,
      label: t('reference.diagnostics.datasetId'),
      value: chunk.dataset_id,
    },
    {
      key: 'image',
      icon: <Image aria-hidden className="size-icon-xs" />,
      label: t('reference.diagnostics.imageId'),
      value: chunk.image_id,
    },
  ]

  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId} className="mb-2 text-sm font-medium text-text-primary">
        {t('reference.diagnostics.title')}
      </h3>
      <div className="rounded-lg border border-border-subtle bg-background-subtle">
        <div className="p-3">
          <dl>
            <div className="flex items-baseline justify-between gap-space-sm">
              <dt className="text-sm text-text-secondary">
                {t('reference.diagnostics.score')}
              </dt>
              <dd className="text-sm font-semibold text-text-primary tabular-nums">
                {score === null
                  ? t('reference.diagnostics.unavailable')
                  : formatRetrievalScore(score, locale)}
              </dd>
            </div>
          </dl>
          {/* 数值已在上方以文字给出，进度条只作视觉辅助 */}
          {score !== null && (
            <Progress aria-hidden value={score * 100} className="mt-2 h-1.5" />
          )}
          {rawScore !== null && (
            <p className="mt-1 text-xs text-text-secondary">
              {t('reference.diagnostics.outOfRange', {
                value: new Intl.NumberFormat(locale, {
                  maximumFractionDigits: 3,
                }).format(rawScore),
              })}
            </p>
          )}
          {subScores.length > 0 && (
            <dl className="mt-2 flex flex-wrap gap-x-space-md gap-y-space-xs text-xs">
              {subScores.map((item) => (
                <div key={item.key} className="flex gap-space-xs">
                  <dt className="text-text-tertiary">{item.label}</dt>
                  <dd className="font-medium text-text-secondary tabular-nums">
                    {formatRetrievalScore(item.value, locale)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <p className="mt-2 text-xs text-text-tertiary">
            {t('reference.diagnostics.scoreHint')}
          </p>
        </div>

        <dl className="divide-y divide-border-subtle border-t border-border-subtle px-3">
          <DiagnosticItem
            icon={<MapPin aria-hidden className="size-icon-xs" />}
            label={t('reference.diagnostics.positions')}
            value={positions ?? t('reference.diagnostics.noPositions')}
            copyable={positions !== null}
            onCopy={onCopySuccess}
          />
          {ids
            // 协议里这些字段可能为空或不是字符串（联网结果的知识库 ID 为空数组）
            .filter(({ value }) => typeof value === 'string' && value !== '')
            .map(({ key, icon, label, value }) => (
              <DiagnosticItem
                key={key}
                icon={icon}
                label={label}
                value={value as string}
                copyable
                onCopy={onCopySuccess}
              />
            ))}
        </dl>
      </div>
    </section>
  )
}

interface DiagnosticItemProps {
  icon: ReactNode
  label: string
  value: string
  /** ID 类条目：等宽截断显示，可复制 */
  copyable?: boolean
  onCopy?: () => void
}

function DiagnosticItem({
  icon,
  label,
  value,
  copyable = false,
  onCopy,
}: DiagnosticItemProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await copyToClipboard(value)
      setCopied(true)
      toast.success(t('reference.diagnostics.valueCopied', { label }))
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('common.copyFailed'))
    }
  }

  return (
    <div className="py-2">
      <dt className="mb-0.5 flex items-center gap-1.5 text-xs text-text-tertiary">
        {icon}
        {label}
      </dt>
      <dd className="flex items-center gap-2">
        {copyable ? (
          <>
            <span
              className="truncate font-mono text-sm text-text-secondary"
              title={value}
            >
              {truncateId(value, 24)}
            </span>
            <button
              type="button"
              className={cn(
                'shrink-0 rounded p-1 transition-colors',
                'focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden',
                copied ? 'text-text-success' : 'text-text-tertiary',
              )}
              onClick={handleCopy}
              aria-label={t('reference.diagnostics.copyValue', { label })}
              title={t('reference.diagnostics.copyValue', { label })}
            >
              {copied ? (
                <Check aria-hidden className="size-icon-xs" />
              ) : (
                <Copy aria-hidden className="size-icon-xs" />
              )}
            </button>
          </>
        ) : (
          <span className="text-sm text-text-secondary">{value}</span>
        )}
      </dd>
    </div>
  )
}
