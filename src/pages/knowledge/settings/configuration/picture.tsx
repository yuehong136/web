'use client'

import {
  ConfigurationFormContainer,
  MainContainer,
  ParserConfigurationEmptyState,
} from '../configuration-form-container'

export function PictureConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <ParserConfigurationEmptyState i18nKey="knowledge.settings.configuration.pictureEmpty" />
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
