'use client'

import {
  ConfigurationFormContainer,
  MainContainer,
} from '../configuration-form-container'

export function TagConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <div className="text-sm text-text-tertiary py-4 text-center">
          标签解析器用于创建标签知识库，无需额外配置。
        </div>
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
