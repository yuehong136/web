'use client'

import {
  LayoutRecognizeFormField,
  AutoKeywordsFormField,
  AutoQuestionsFormField,
} from '@/components/forms/KnowledgeFormFields'
import {
  ConfigurationFormContainer,
  MainContainer,
  SectionTitle,
} from '../configuration-form-container'

export function BookConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <SectionTitle>基础配置</SectionTitle>
        <LayoutRecognizeFormField />
      </ConfigurationFormContainer>

      <ConfigurationFormContainer>
        <SectionTitle>智能增强</SectionTitle>
        <AutoKeywordsFormField />
        <AutoQuestionsFormField />
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
