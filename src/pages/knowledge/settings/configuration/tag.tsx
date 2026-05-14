'use client'

import {
  ConfigurationFormContainer,
  MainContainer,
  ParserConfigurationEmptyState,
} from '../configuration-form-container'

export function TagConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <ParserConfigurationEmptyState i18nKey="knowledge.settings.configuration.tagEmpty" />
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
