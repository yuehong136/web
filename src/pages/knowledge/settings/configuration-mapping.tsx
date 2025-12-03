'use client'

import React from 'react'
import { DocumentParserType } from '@/types/document-parser'
import { AudioConfiguration } from './configuration/audio'
import { BookConfiguration } from './configuration/book'
import { EmailConfiguration } from './configuration/email'
import { KnowledgeGraphConfiguration } from './configuration/knowledge-graph'
import { LawsConfiguration } from './configuration/laws'
import { ManualConfiguration } from './configuration/manual'
import { NaiveConfiguration } from './configuration/naive'
import { OneConfiguration } from './configuration/one'
import { PaperConfiguration } from './configuration/paper'
import { PictureConfiguration } from './configuration/picture'
import { PresentationConfiguration } from './configuration/presentation'
import { QAConfiguration } from './configuration/qa'
import { ResumeConfiguration } from './configuration/resume'
import { TableConfiguration } from './configuration/table'
import { TagConfiguration } from './configuration/tag'
import { EmptyComponent } from './configuration-form-container'

// 配置组件映射
export const ConfigurationComponentMap: Record<string, React.ComponentType> = {
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

interface ConfigurationRendererProps {
  parserId: DocumentParserType | string | null
}

export function ConfigurationRenderer({ parserId }: ConfigurationRendererProps) {
  const ConfigurationComponent = React.useMemo(() => {
    if (!parserId || typeof parserId !== 'string') {
      return EmptyComponent
    }

    return ConfigurationComponentMap[parserId] || EmptyComponent
  }, [parserId])

  return <ConfigurationComponent />
}
