'use client'

import {
  ConfigurationFormContainer,
  MainContainer,
  ParserConfigurationEmptyState,
} from '../configuration-form-container'

export function QAConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <ParserConfigurationEmptyState i18nKey="knowledge.settings.configuration.qaEmpty" />
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
