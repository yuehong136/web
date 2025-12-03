'use client'

import {
  ConfigurationFormContainer,
  MainContainer,
} from '../configuration-form-container'

export function OneConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <div className="text-sm text-text-tertiary py-4 text-center">
          单页解析器将整个文档作为一个块处理，无需额外配置。
        </div>
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
