'use client'

import {
  ConfigurationFormContainer,
  MainContainer,
  ParserConfigurationEmptyState,
} from '../configuration-form-container'

export function ResumeConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <ParserConfigurationEmptyState i18nKey="knowledge.settings.configuration.resumeEmpty" />
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
