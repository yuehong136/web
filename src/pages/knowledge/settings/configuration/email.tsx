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

export function EmailConfiguration() {
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
