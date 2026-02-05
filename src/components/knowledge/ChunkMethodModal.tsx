/**
 * 切片方法配置弹窗
 *
 * 用于修改单个文档的解析方式和配置
 * 参照 RAGFlow 的 ChunkMethodDialog 实现
 */

import React from 'react'
import { useForm, FormProvider, useWatch } from 'react-hook-form'
import { Modal, Button } from '@/components/ui'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SelectWithSearch, type SelectOptionGroup } from '@/components/ui/select-with-search'
import { Settings2 } from 'lucide-react'
import type { Document } from '@/types/api'
import { DocumentParserType } from '@/types/document-parser'
import { ChunkMethodForm } from '@/pages/knowledge/settings/ChunkMethodForm'

interface ChunkMethodModalProps {
  open: boolean
  onClose: () => void
  document: Document | null
  onSubmit: (data: {
    docId: string
    parserId: string
    parserConfig?: Record<string, any>
  }) => Promise<void>
  isLoading?: boolean
}

interface FormValues {
  parseType: 1 | 2 // 1 = 内置, 2 = 选择pipeline
  parser_id: string
  pipeline_id: string
  parser_config: Record<string, any>
}

/**
 * 解析器列表 - 与 RAGFlow 保持一致
 * 排除: email, picture, audio (这些不在文档配置中显示)
 */
const PARSER_OPTIONS: SelectOptionGroup[] = [
  { value: 'naive', label: 'General' },
  { value: 'qa', label: 'Q&A' },
  { value: 'resume', label: 'Resume' },
  { value: 'manual', label: 'Manual' },
  { value: 'table', label: 'Table' },
  { value: 'paper', label: 'Paper' },
  { value: 'book', label: 'Book' },
  { value: 'laws', label: 'Laws' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'one', label: 'One' },
  { value: 'tag', label: 'Tag' },
]

/**
 * 解析方法切换组件 - 内置 vs 选择pipeline
 */
const ParseTypeSelector: React.FC<{
  value: 1 | 2
  onChange: (value: 1 | 2) => void
}> = ({ value, onChange }) => {
  return (
    <div className="rounded-radius-lg p-space-base bg-surface-secondary border border-border-default">
      <label className="block text-sm font-medium mb-space-sm text-text-primary">
        解析方法
      </label>
      <RadioGroup
        value={String(value)}
        onValueChange={(val) => onChange(Number(val) as 1 | 2)}
        className="flex items-center gap-space-lg"
      >
        <label className="flex items-center gap-space-xs cursor-pointer">
          <RadioGroupItem value="1" />
          <span className="text-sm text-text-secondary">内置</span>
        </label>
        <label className="flex items-center gap-space-xs cursor-pointer">
          <RadioGroupItem value="2" />
          <span className="text-sm text-text-secondary">选择pipeline</span>
        </label>
      </RadioGroup>
    </div>
  )
}

/**
 * 内置解析器选择组件 - 使用 SelectWithSearch
 */
const BuiltInParserSelector: React.FC<{
  value: string
  onChange: (value: string) => void
}> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <label
        className="flex items-center gap-1 text-sm font-medium"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <span className="text-red-500">*</span>
        内置
      </label>
      <SelectWithSearch
        value={value}
        onChange={onChange}
        options={PARSER_OPTIONS}
        placeholder="请选择解析器"
        emptyText="暂无匹配的解析器"
      />
    </div>
  )
}

/**
 * Pipeline选择组件 - 使用 SelectWithSearch
 */
const PipelineSelector: React.FC<{
  value: string
  onChange: (value: string) => void
  options?: SelectOptionGroup[]
}> = ({ value, onChange, options = [] }) => {
  return (
    <div className="space-y-2">
      <label
        className="flex items-center gap-1 text-sm font-medium"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <span className="text-red-500">*</span>
        选择pipeline
      </label>
      <SelectWithSearch
        value={value}
        onChange={onChange}
        options={options}
        placeholder="请选择pipeline"
        emptyText="暂无可用的pipeline"
      />
      <p
        className="text-xs"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        选择已配置的数据处理pipeline
      </p>
    </div>
  )
}

/**
 * 元数据设置弹窗
 */
const MetadataSettingsModal: React.FC<{
  open: boolean
  onClose: () => void
}> = ({ open, onClose }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="元数据生成设置"
      size="lg"
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={onClose}>
            确定
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          配置自动元数据提取的字段和规则。修改将影响新解析的文档。
        </p>
        {/* TODO: 实现元数据字段配置列表 */}
        <div 
          className="border rounded-lg p-4 text-center text-text-tertiary"
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          元数据配置功能开发中...
        </div>
      </div>
    </Modal>
  )
}

export const ChunkMethodModal: React.FC<ChunkMethodModalProps> = ({
  open,
  onClose,
  document,
  onSubmit,
  isLoading = false,
}) => {
  const [metadataModalOpen, setMetadataModalOpen] = React.useState(false)
  
  const methods = useForm<FormValues>({
    defaultValues: {
      parseType: 1,
      parser_id: document?.parser_id || DocumentParserType.Naive,
      pipeline_id: '',
      parser_config: document?.parser_config || {},
    },
  })

  // 当文档变化时重置表单
  React.useEffect(() => {
    if (document && open) {
      methods.reset({
        parseType: 1,
        parser_id: document.parser_id || DocumentParserType.Naive,
        pipeline_id: '',
        parser_config: document.parser_config || {},
      })
    }
  }, [document, open, methods])

  const handleSubmit = async (data: FormValues) => {
    if (!document) return

    // 如果选择了pipeline模式但没有选择pipeline，阻止提交
    if (data.parseType === 2 && !data.pipeline_id) {
      return
    }

    await onSubmit({
      docId: document.id,
      parserId: data.parseType === 1 ? data.parser_id : data.pipeline_id,
      parserConfig: data.parseType === 1 ? data.parser_config : {},
    })
  }

  const handleMetadataSettingsClick = React.useCallback(() => {
    setMetadataModalOpen(true)
  }, [])

  const parseType = useWatch({
    control: methods.control,
    name: 'parseType',
  })

  const currentParserId = useWatch({
    control: methods.control,
    name: 'parser_id',
  })

  if (!document) return null

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="切片方法"
        icon={<Settings2 className="h-5 w-5" />}
        size="lg"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              取消
            </Button>
            <Button
              onClick={methods.handleSubmit(handleSubmit)}
              loading={isLoading}
            >
              保存
            </Button>
          </div>
        }
      >
        <FormProvider {...methods}>
          <form className="space-y-4">
            {/* 解析方法切换: 内置 vs 选择pipeline */}
            <ParseTypeSelector
              value={parseType}
              onChange={(value) => {
                methods.setValue('parseType', value)
                // 切换时清空另一个模式的选择
                if (value === 1) {
                  methods.setValue('pipeline_id', '')
                }
              }}
            />

            {/* 内置解析器选择 */}
            {parseType === 1 && (
              <div
                className="rounded-lg p-4 space-y-4"
                style={{
                  backgroundColor: 'var(--color-surface-secondary)',
                  border: '1px solid var(--color-border-default)',
                }}
              >
                <BuiltInParserSelector
                  value={currentParserId}
                  onChange={(value) => {
                    methods.setValue('parser_id', value)
                    // 切换解析器时重置配置为空对象
                    methods.setValue('parser_config', {})
                  }}
                />
              </div>
            )}

            {/* Pipeline选择 */}
            {parseType === 2 && (
              <div
                className="rounded-lg p-4"
                style={{
                  backgroundColor: 'var(--color-surface-secondary)',
                  border: '1px solid var(--color-border-default)',
                }}
              >
                <PipelineSelector
                  value={methods.watch('pipeline_id')}
                  onChange={(value) => methods.setValue('pipeline_id', value)}
                />
              </div>
            )}

            {/* 解析器配置 - 仅在内置模式下显示 */}
            {parseType === 1 && currentParserId && (
              <ChunkMethodForm 
                onMetadataSettingsClick={handleMetadataSettingsClick}
              />
            )}
          </form>
        </FormProvider>
      </Modal>

      {/* 元数据设置弹窗 */}
      <MetadataSettingsModal
        open={metadataModalOpen}
        onClose={() => setMetadataModalOpen(false)}
      />
    </>
  )
}

export default ChunkMethodModal
