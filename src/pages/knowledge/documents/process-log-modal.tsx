/**
 * 文档处理日志弹窗组件
 *
 * 展示文件详情和解析日志，支持实时更新
 */

import React, { useMemo } from 'react'
import { FileText } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import { Tooltip } from '@/components/ui/tooltip'
import { TaskStatus, TaskStatusConfig } from './constants'

// 日志信息接口
export interface LogInfo {
  fileType?: string
  uploadedBy?: string
  fileName: string
  uploadDate?: string
  fileSize?: string
  processBeginAt?: string
  chunkNumber?: number
  duration?: string
  status?: string
  details: string
}

interface ProcessLogModalProps {
  visible: boolean
  onClose: () => void
  logInfo: LogInfo
}

// 信息项组件
const InfoItem: React.FC<{
  label: string
  value: React.ReactNode
  className?: string
  fullWidth?: boolean
  overflowTip?: boolean // 是否支持鼠标悬浮显示完整内容
}> = ({ label, value, className = '', fullWidth = false, overflowTip = false }) => {
  return (
    <div className={`flex flex-col mb-4 ${fullWidth ? 'w-full' : 'w-1/2'} ${className}`}>
      <span
        className="text-sm"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {label}
      </span>
      {overflowTip ? (
        <Tooltip content={value} position="bottom" className="max-w-[300px] break-words">
          <span
            className="mt-1 truncate w-full"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {value}
          </span>
        </Tooltip>
      ) : (
        <span
          className="mt-1 truncate"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {value}
        </span>
      )}
    </div>
  )
}

// 状态徽章组件
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = TaskStatusConfig[status as TaskStatus] || TaskStatusConfig[TaskStatus.UNSTART]

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: config.bgToken,
        border: `1px solid ${config.borderToken}`,
        color: config.textToken,
      }}
    >
      <span
        className="inline-flex h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.dotToken }}
      />
      {config.text}
    </span>
  )
}

// 高亮错误文本
const highlightErrors = (text: string): React.ReactNode => {
  if (!text) return '-'

  // 移除重复换行
  const cleanText = text.replace(/(\n)\1+/g, '$1')

  // 分割文本，高亮 [ERROR] 行
  const parts = cleanText.split(/(\[ERROR\].+)/g)

  return parts.map((part, index) => {
    if (part.match(/^\[ERROR\]/)) {
      return (
        <span key={index} className="text-red-500">
          {part}
        </span>
      )
    }
    return <span key={index}>{part}</span>
  })
}

// 字段标签映射
const fieldLabels: Record<keyof LogInfo, string> = {
  fileType: '文件类型',
  uploadedBy: '创建者',
  fileName: '文件名',
  uploadDate: '上传日期',
  fileSize: '文件大小',
  processBeginAt: '开始于',
  chunkNumber: '分块数',
  duration: '耗时',
  status: '状态',
  details: '详情',
}

// 字段显示顺序
const fieldOrder: (keyof LogInfo)[] = [
  'fileType',
  'uploadedBy',
  'fileName',
  'uploadDate',
  'fileSize',
  'processBeginAt',
  'chunkNumber',
  'duration',
  'status',
  'details',
]

export const ProcessLogModal: React.FC<ProcessLogModalProps> = ({
  visible,
  onClose,
  logInfo,
}) => {
  // 过滤掉空值的字段
  const displayFields = useMemo(() => {
    return fieldOrder.filter((key) => {
      const value = logInfo[key]
      return value !== undefined && value !== null && value !== ''
    })
  }, [logInfo])

  return (
    <Modal
      open={visible}
      onClose={onClose}
      title="文件"
      icon={<FileText className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex justify-end">
          <Button onClick={onClose}>关闭</Button>
        </div>
      }
    >
      <div className="rounded-lg">
        <div className="flex flex-wrap">
          {displayFields.map((key) => {
            const value = logInfo[key]
            const label = fieldLabels[key]

            // 详情日志 - 全宽展示
            if (key === 'details') {
              return (
                <div className="w-full mt-2" key={key}>
                  <InfoItem
                    label={label}
                    fullWidth
                    value={
                      <div
                        className="w-full whitespace-pre-line text-wrap rounded-lg h-fit max-h-[350px] overflow-y-auto scrollbar-thin p-3 mt-1"
                        style={{
                          backgroundColor: 'var(--color-surface-secondary)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {highlightErrors(value as string)}
                      </div>
                    }
                  />
                </div>
              )
            }

            // 状态字段 - 使用状态徽章
            if (key === 'status') {
              return (
                <div className="flex flex-col w-1/2 mb-4" key={key}>
                  <span
                    className="text-sm"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {label}
                  </span>
                  <div className="mt-1">
                    <StatusBadge status={value as string} />
                  </div>
                </div>
              )
            }

            // 其他字段 - 半宽展示
            // 对于文件名、创建者等可能较长的字段，启用 tooltip
            const needsOverflowTip = key === 'fileName' || key === 'uploadedBy'
            return (
              <div className="w-1/2" key={key}>
                <InfoItem
                  label={label}
                  value={String(value)}
                  overflowTip={needsOverflowTip}
                />
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

export default ProcessLogModal
