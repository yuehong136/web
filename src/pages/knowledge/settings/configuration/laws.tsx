'use client'

import {
  LayoutRecognizeFormField,
  MinerUOptionsFormField,
  AutoKeywordsFormField,
  AutoQuestionsFormField,
} from '@/components/forms/KnowledgeFormFields'
import {
  ConfigurationFormContainer,
  MainContainer,
  SectionTitle,
} from '../configuration-form-container'

export function LawsConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <SectionTitle>基础配置</SectionTitle>
        <LayoutRecognizeFormField />
        <MinerUOptionsFormField />
      </ConfigurationFormContainer>

      <ConfigurationFormContainer>
        <SectionTitle>智能增强</SectionTitle>
        <AutoKeywordsFormField />
        <AutoQuestionsFormField />
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
