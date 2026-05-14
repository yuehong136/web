'use client'

import {
  ConfigurationFormContainer,
  MainContainer,
  ParserConfigurationEmptyState,
} from '../configuration-form-container'

export function OneConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <ParserConfigurationEmptyState i18nKey="knowledge.settings.configuration.oneEmpty" />
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
