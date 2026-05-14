'use client'

import {
  LayoutRecognizeFormField,
  MinerUOptionsFormField,
  AutoKeywordsFormField,
  AutoQuestionsFormField,
} from '@/components/forms/KnowledgeFormFields'
import {
  ConfigurationFormContainer,
  BasicSectionTitle,
  EnhancementSectionTitle,
  MainContainer,
} from '../configuration-form-container'

export function BookConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <BasicSectionTitle />
        <LayoutRecognizeFormField />
        <MinerUOptionsFormField />
      </ConfigurationFormContainer>

      <ConfigurationFormContainer>
        <EnhancementSectionTitle />
        <AutoKeywordsFormField />
        <AutoQuestionsFormField />
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
