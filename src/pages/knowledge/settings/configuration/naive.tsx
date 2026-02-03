'use client'

import {
  LayoutRecognizeFormField,
  MinerUOptionsFormField,
  MaxTokenNumberFormField,
  DelimiterFormField,
  ChildrenDelimiterFormField,
  TocExtractionFormField,
  ImageTableContextWindowFormField,
  AutoMetadataFormField,
  OverlappedPercentFormField,
  AutoKeywordsFormField,
  AutoQuestionsFormField,
  ExcelToHtmlFormField,
} from '@/components/forms/KnowledgeFormFields'
import {
  ConfigurationFormContainer,
  MainContainer,
} from '../configuration-form-container'

interface NaiveConfigurationProps {
  /** 点击自动元数据设置按钮的回调 */
  onMetadataSettingsClick?: () => void
  /** 已配置的元数据数量 */
  metadataCount?: number
}

export function NaiveConfiguration({
  onMetadataSettingsClick,
  metadataCount,
}: NaiveConfigurationProps = {}) {
  return (
    <MainContainer>
      {/* 第一组：基础分块配置 - 与 RAGFlow 保持一致 */}
      <ConfigurationFormContainer>
        <LayoutRecognizeFormField />
        <MinerUOptionsFormField />
        <MaxTokenNumberFormField initialValue={512} max={2048} />
        <DelimiterFormField />
        <ChildrenDelimiterFormField />
      </ConfigurationFormContainer>

      {/* 第二组：增强配置 */}
      <ConfigurationFormContainer>
        <TocExtractionFormField />
        <ImageTableContextWindowFormField />
        <AutoMetadataFormField 
          onSettingsClick={onMetadataSettingsClick}
          metadataCount={metadataCount}
        />
        <OverlappedPercentFormField />
        <AutoKeywordsFormField />
        <AutoQuestionsFormField />
        <ExcelToHtmlFormField />
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
