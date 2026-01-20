'use client'

import {
  LayoutRecognizeFormField,
  MinerUOptionsFormField,
  MaxTokenNumberFormField,
  DelimiterFormField,
  TocExtractionFormField,
  ImageTableContextWindowFormField,
  AutoKeywordsFormField,
  AutoQuestionsFormField,
  ExcelToHtmlFormField,
} from '@/components/forms/KnowledgeFormFields'
import {
  ConfigurationFormContainer,
  MainContainer,
  SectionTitle,
} from '../configuration-form-container'

export function NaiveConfiguration() {
  return (
    <MainContainer>
      {/* 基础配置 */}
      <ConfigurationFormContainer>
        <SectionTitle>基础配置</SectionTitle>
        <LayoutRecognizeFormField />
        <MinerUOptionsFormField />
        <MaxTokenNumberFormField initialValue={512} max={2048} />
        <DelimiterFormField />
        <TocExtractionFormField />
        <ImageTableContextWindowFormField />
      </ConfigurationFormContainer>

      {/* 智能增强 */}
      <ConfigurationFormContainer>
        <SectionTitle>智能增强</SectionTitle>
        <AutoKeywordsFormField />
        <AutoQuestionsFormField />
        <ExcelToHtmlFormField />
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
