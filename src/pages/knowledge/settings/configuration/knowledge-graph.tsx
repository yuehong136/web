'use client'

import {
  MaxTokenNumberFormField,
  DelimiterFormField,
} from '@/components/forms/KnowledgeFormFields'
import {
  ConfigurationFormContainer,
  MainContainer,
  SectionTitle,
} from '../configuration-form-container'

export function KnowledgeGraphConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <SectionTitle>基础配置</SectionTitle>
        <MaxTokenNumberFormField max={16384} />
        <DelimiterFormField />
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
