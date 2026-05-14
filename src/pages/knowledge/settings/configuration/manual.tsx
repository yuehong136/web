'use client'

import {
  AutoKeywordsFormField,
  AutoQuestionsFormField,
} from '@/components/forms/KnowledgeFormFields'
import {
  ConfigurationFormContainer,
  EnhancementSectionTitle,
  MainContainer,
} from '../configuration-form-container'

export function ManualConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <EnhancementSectionTitle />
        <AutoKeywordsFormField />
        <AutoQuestionsFormField />
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
