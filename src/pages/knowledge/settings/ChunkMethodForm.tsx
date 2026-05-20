'use client'

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useFormContext, useWatch } from 'react-hook-form'
import { DocumentParserType } from '@/types/document-parser'

// 导入各解析器配置组件
import { NaiveConfiguration } from './configuration/naive'
import { QAConfiguration } from './configuration/qa'
import { PaperConfiguration } from './configuration/paper'
import { BookConfiguration } from './configuration/book'
import { LawsConfiguration } from './configuration/laws'
import { PresentationConfiguration } from './configuration/presentation'
import { TableConfiguration } from './configuration/table'
import { PictureConfiguration } from './configuration/picture'
import { AudioConfiguration } from './configuration/audio'
import { EmailConfiguration } from './configuration/email'
import { ResumeConfiguration } from './configuration/resume'
import { ManualConfiguration } from './configuration/manual'
import { OneConfiguration } from './configuration/one'
import { TagConfiguration } from './configuration/tag'
import { KnowledgeGraphConfiguration } from './configuration/knowledge-graph'

// 配置组件 Props 类型
export interface ConfigurationComponentProps {
  onMetadataSettingsClick?: () => void
  metadataCount?: number
}

// 配置组件映射
const ConfigurationComponentMap: Record<
  string,
  React.ComponentType<ConfigurationComponentProps>
> = {
  [DocumentParserType.Naive]: NaiveConfiguration,
  [DocumentParserType.Qa]: QAConfiguration,
  [DocumentParserType.Resume]: ResumeConfiguration,
  [DocumentParserType.Manual]: ManualConfiguration,
  [DocumentParserType.Table]: TableConfiguration,
  [DocumentParserType.Paper]: PaperConfiguration,
  [DocumentParserType.Book]: BookConfiguration,
  [DocumentParserType.Laws]: LawsConfiguration,
  [DocumentParserType.Presentation]: PresentationConfiguration,
  [DocumentParserType.Picture]: PictureConfiguration,
  [DocumentParserType.One]: OneConfiguration,
  [DocumentParserType.Audio]: AudioConfiguration,
  [DocumentParserType.Email]: EmailConfiguration,
  [DocumentParserType.Tag]: TagConfiguration,
  [DocumentParserType.KnowledgeGraph]: KnowledgeGraphConfiguration,
}

function EmptyConfiguration() {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-center py-8 text-text-tertiary">
      {t('knowledge.settings.configuration.selectParser')}
    </div>
  )
}

interface ChunkMethodFormProps {
  className?: string
  /** 点击自动元数据设置按钮的回调 */
  onMetadataSettingsClick?: () => void
  /** 已配置的元数据数量 */
  metadataCount?: number
}

export function ChunkMethodForm({
  className,
  onMetadataSettingsClick,
  metadataCount,
}: ChunkMethodFormProps) {
  const form = useFormContext()

  const parserId = useWatch({
    control: form.control,
    name: 'parser_id',
  })

  const ConfigurationComponent = React.useMemo(() => {
    if (!parserId) {
      return EmptyConfiguration
    }
    return ConfigurationComponentMap[parserId] || EmptyConfiguration
  }, [parserId])

  return (
    <div className={className}>
      <ConfigurationComponent
        onMetadataSettingsClick={onMetadataSettingsClick}
        metadataCount={metadataCount}
      />
    </div>
  )
}
