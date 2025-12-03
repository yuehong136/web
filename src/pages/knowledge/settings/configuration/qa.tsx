'use client'

import {
  ConfigurationFormContainer,
  MainContainer,
} from '../configuration-form-container'

export function QAConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <div className="text-sm text-text-tertiary py-4 text-center">
          Q&A 解析器专门用于解析问答格式的文档，无需额外配置。
        </div>
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
