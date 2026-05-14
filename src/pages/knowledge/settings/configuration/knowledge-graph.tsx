'use client'

import {
  MaxTokenNumberFormField,
  DelimiterFormField,
} from '@/components/forms/KnowledgeFormFields'
import {
  ConfigurationFormContainer,
  BasicSectionTitle,
  MainContainer,
} from '../configuration-form-container'

export function KnowledgeGraphConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <BasicSectionTitle />
        <MaxTokenNumberFormField max={16384} />
        <DelimiterFormField />
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
