import React from 'react';
import { DocumentParserType } from '@/types/document-parser';
import { AudioConfiguration } from './configuration/audio';
import { BookConfiguration } from './configuration/book';
import { EmailConfiguration } from './configuration/email';
import { KnowledgeGraphConfiguration } from './configuration/knowledge-graph';
import { NaiveConfiguration } from './configuration/naive';
import { QAConfiguration } from './configuration/qa';
import {
  LawsConfiguration,
  ManualConfiguration,
  OneConfiguration,
  PaperConfiguration,
  PictureConfiguration,
  PresentationConfiguration,
  ResumeConfiguration,
  TableConfiguration,
  TagConfiguration
} from './configuration/simple-configs';
import { EmptyComponent } from './configuration-form-container';

// 配置组件映射
export const ConfigurationComponentMap = {
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
};

interface ConfigurationRendererProps {
  parserId: DocumentParserType | string | null;
}

export function ConfigurationRenderer({ parserId }: ConfigurationRendererProps) {
  const ConfigurationComponent = React.useMemo(() => {
    if (!parserId || typeof parserId !== 'string') {
      return EmptyComponent;
    }
    
    return ConfigurationComponentMap[parserId as DocumentParserType] || EmptyComponent;
  }, [parserId]);

  return (
    <div className="overflow-auto max-h-[76vh]">
      <ConfigurationComponent />
    </div>
  );
}