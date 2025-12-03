'use client'

import {
  AutoKeywordsFormField,
  AutoQuestionsFormField,
} from '@/components/forms/KnowledgeFormFields'
import {
  ConfigurationFormContainer,
  MainContainer,
  SectionTitle,
} from '../configuration-form-container'

export function AudioConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <SectionTitle>智能增强</SectionTitle>
        <AutoKeywordsFormField />
        <AutoQuestionsFormField />
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
